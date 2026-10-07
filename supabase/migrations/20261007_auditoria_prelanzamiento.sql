-- Pendiente de aplicar en Supabase (SQL Editor). Es idempotente: se puede ejecutar más de una vez.
-- La web ya es compatible con la base de datos antes y después de aplicarla.

-- ============================================================
-- Auditoría pre-lanzamiento (oct 2026): límites por IP, MFA del
-- panel, registro de cambios, desistimiento, conservación de datos
-- y limpieza del control de stock que ya no se usa.
-- ============================================================

-- ---------- Sin control de stock (pendiente de aplicar en producción) ----------
drop trigger if exists amway_pedidos_stock on public.amway_pedidos;
drop function if exists public.amway_pedido_stock();
drop function if exists public.amway_mover_stock(jsonb, integer);
drop function if exists public.amway_stock_insuficiente(jsonb);
alter table public.amway_productos drop column if exists stock;

-- ---------- Límites por IP ----------
-- Los límites globales dejaban que un bot bloquease la tienda entera. Ahora
-- cada acción se limita por IP (solo se guarda un hash, y un día como mucho)
-- y el límite global queda como freno de emergencia, mucho más alto.
create table if not exists public.amway_limites (
  id bigint generated always as identity primary key,
  accion text not null,
  clave text not null,
  created_at timestamptz not null default now()
);
alter table public.amway_limites enable row level security;
create index if not exists idx_amway_limites on public.amway_limites (accion, clave, created_at desc);

-- IP del visitante tal como la pasa la API de Supabase (llamadas desde el navegador).
create or replace function public.amway_ip_peticion()
returns text language sql stable set search_path = public
as $$
  select nullif(trim(split_part(coalesce(
    current_setting('request.headers', true)::json ->> 'cf-connecting-ip',
    current_setting('request.headers', true)::json ->> 'x-forwarded-for',
    ''), ',', 1)), '');
$$;

-- true = permitido (y lo apunta); false = ha superado p_max en la ventana.
-- Sin IP no se limita (si no, todos los visitantes compartirían el mismo
-- cupo): queda el límite global de cada función.
create or replace function public.amway_limite(p_accion text, p_ip text, p_max integer, p_ventana interval)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_clave text := encode(sha256(convert_to('amway:' || coalesce(p_ip, ''), 'UTF8')), 'hex');
begin
  if nullif(trim(coalesce(p_ip, '')), '') is null then
    return true;
  end if;
  if (select count(*) from public.amway_limites
      where accion = p_accion and clave = v_clave and created_at > now() - p_ventana) >= p_max then
    return false;
  end if;
  insert into public.amway_limites (accion, clave) values (p_accion, v_clave);
  return true;
end;
$$;
revoke all on function public.amway_limite(text, text, integer, interval) from public, anon, authenticated;
revoke all on function public.amway_ip_peticion() from public, anon, authenticated;

-- Para el servidor Next.js (pedidos y pagos llegan desde Vercel con la IP
-- del cliente en x-forwarded-for, no en la cabecera de Supabase).
create or replace function public.amway_limite_servidor(p_token text, p_accion text, p_ip text, p_max integer, p_segundos integer)
returns boolean
language plpgsql security definer set search_path = public
as $$
begin
  if not public.amway_token_servidor_valido(p_token) then
    raise exception 'no autorizado';
  end if;
  return public.amway_limite(left(p_accion, 40), left(p_ip, 100), p_max, make_interval(secs => p_segundos));
end;
$$;
revoke all on function public.amway_limite_servidor(text, text, text, integer, integer) from public, authenticated;
grant execute on function public.amway_limite_servidor(text, text, text, integer, integer) to anon;

-- ---------- Pedidos en efectivo: límite por IP e idempotencia ----------
alter table public.amway_pedidos add column if not exists idempotencia uuid;
create unique index if not exists idx_amway_pedidos_idempotencia on public.amway_pedidos (idempotencia)
  where idempotencia is not null;

drop function if exists public.amway_registrar_pedido_recogida(text, jsonb, numeric, text, text, date, text, text, uuid, text);
create or replace function public.amway_registrar_pedido_recogida(
  p_token text,
  p_items jsonb,
  p_total_eur numeric,
  p_cliente_nombre text,
  p_cliente_telefono text,
  p_recogida_fecha date,
  p_recogida_hora text,
  p_notas text default null,
  p_cliente_id uuid default null,
  p_cliente_email text default null,
  p_ip text default null,
  p_idempotencia uuid default null
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
  v_numero bigint;
begin
  if not public.amway_token_servidor_valido(p_token) then
    raise exception 'no autorizado';
  end if;
  -- El mismo intento (doble clic, reintento de red) devuelve el pedido ya creado.
  if p_idempotencia is not null then
    select id, numero into v_id, v_numero from public.amway_pedidos where idempotencia = p_idempotencia;
    if v_id is not null then
      return jsonb_build_object('id', v_id, 'numero', v_numero, 'repetido', true);
    end if;
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or p_recogida_fecha is null then
    raise exception 'pedido inválido';
  end if;
  if char_length(coalesce(trim(p_cliente_nombre), '')) not between 1 and 100
     or char_length(coalesce(trim(p_cliente_telefono), '')) not between 6 and 30 then
    raise exception 'datos de contacto inválidos';
  end if;
  if not public.amway_limite('pedido', p_ip, 4, interval '10 minutes')
     or not public.amway_limite('pedido_dia', p_ip, 15, interval '1 day') then
    raise exception 'demasiados pedidos';
  end if;
  if (select count(*) from public.amway_pedidos
      where origen = 'web' and stripe_session_id is null and created_at > now() - interval '1 hour') >= 200 then
    raise exception 'demasiados pedidos';
  end if;

  insert into public.amway_pedidos (
    origen, metodo_pago, estado, items, total_eur, cliente_nombre, cliente_telefono, cliente_email,
    recogida_fecha, recogida_hora, notas, cliente_id, idempotencia
  ) values (
    'web', 'efectivo', 'pendiente', p_items, p_total_eur, trim(p_cliente_nombre), trim(p_cliente_telefono),
    nullif(left(trim(coalesce(p_cliente_email, '')), 200), ''),
    p_recogida_fecha, p_recogida_hora, nullif(left(trim(coalesce(p_notas, '')), 500), ''),
    (select u.id from auth.users u where u.id = p_cliente_id), p_idempotencia
  )
  returning id, numero into v_id, v_numero;
  return jsonb_build_object('id', v_id, 'numero', v_numero);
end;
$$;

-- ---------- Solicitudes, reseñas, visitas y errores: límite por IP ----------
alter table public.amway_solicitudes drop constraint if exists amway_solicitudes_tipo_check;
alter table public.amway_solicitudes add constraint amway_solicitudes_tipo_check
  check (tipo in ('agotado', 'encargo', 'otro', 'desistimiento'));
alter table public.amway_solicitudes add column if not exists pedido_numero bigint;

create or replace function public.amway_crear_solicitud(
  p_tipo text, p_product_id text, p_producto_nombre text, p_formato text, p_cantidad integer,
  p_nombre text, p_telefono text, p_email text, p_mensaje text
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_tipo not in ('agotado', 'encargo', 'otro') then raise exception 'tipo inválido'; end if;
  if char_length(coalesce(p_nombre, '')) not between 1 and 100 then raise exception 'nombre inválido'; end if;
  if char_length(coalesce(p_producto_nombre, '')) not between 1 and 200 then raise exception 'producto inválido'; end if;
  if coalesce(nullif(trim(p_telefono), ''), nullif(trim(p_email), '')) is null then
    raise exception 'falta contacto';
  end if;
  if char_length(coalesce(p_telefono, '')) > 30 or char_length(coalesce(p_email, '')) > 200
     or char_length(coalesce(p_mensaje, '')) > 1000 or char_length(coalesce(p_formato, '')) > 200
     or char_length(coalesce(p_product_id, '')) > 80 then
    raise exception 'datos demasiado largos';
  end if;
  if not public.amway_limite('solicitud', public.amway_ip_peticion(), 5, interval '1 hour')
     or (select count(*) from public.amway_solicitudes where created_at > now() - interval '1 hour') >= 300 then
    raise exception 'demasiadas solicitudes';
  end if;

  insert into public.amway_solicitudes (tipo, product_id, producto_nombre, formato, cantidad, nombre, telefono, email, mensaje)
  values (p_tipo, nullif(p_product_id, ''), p_producto_nombre, nullif(p_formato, ''), p_cantidad,
          trim(p_nombre), nullif(trim(p_telefono), ''), nullif(trim(p_email), ''), nullif(trim(p_mensaje), ''))
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.amway_crear_resena(
  p_product_id text, p_producto_nombre text, p_nombre text, p_valoracion integer, p_comentario text
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
begin
  if char_length(coalesce(trim(p_nombre), '')) not between 1 and 100 then raise exception 'nombre inválido'; end if;
  if char_length(coalesce(trim(p_comentario), '')) not between 3 and 1000 then raise exception 'comentario inválido'; end if;
  if p_valoracion is null or p_valoracion not between 1 and 5 then raise exception 'valoración inválida'; end if;
  if char_length(coalesce(p_product_id, '')) > 80 or char_length(coalesce(p_producto_nombre, '')) > 200 then
    raise exception 'producto inválido';
  end if;
  if not public.amway_limite('resena', public.amway_ip_peticion(), 3, interval '1 hour')
     or (select count(*) from public.amway_resenas where created_at > now() - interval '1 hour') >= 200 then
    raise exception 'demasiadas reseñas';
  end if;

  insert into public.amway_resenas (product_id, producto_nombre, nombre, valoracion, comentario)
  values (nullif(p_product_id, ''), nullif(p_producto_nombre, ''), trim(p_nombre), p_valoracion, trim(p_comentario))
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.amway_registrar_visita(
  p_session_id uuid, p_event_type text, p_path text, p_label text, p_referrer text, p_source_category text,
  p_utm_source text, p_utm_medium text, p_utm_campaign text, p_device_type text, p_is_returning boolean
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  -- Freno anti-abuso: la API es pública y el session_id lo elige el navegador.
  if (select count(*) from public.amway_visitas where session_id = p_session_id and created_at > now() - interval '1 hour') >= 300
     or not public.amway_limite('visita', public.amway_ip_peticion(), 600, interval '1 hour')
     or (select count(*) from public.amway_visitas where created_at > now() - interval '1 hour') >= 20000 then
    return;
  end if;
  insert into public.amway_visitas (
    session_id, event_type, path, label, referrer, source_category,
    utm_source, utm_medium, utm_campaign, device_type, is_returning
  ) values (
    p_session_id, p_event_type, left(p_path, 300), left(p_label, 200), left(p_referrer, 500), p_source_category,
    left(p_utm_source, 100), left(p_utm_medium, 100), left(p_utm_campaign, 150), p_device_type, coalesce(p_is_returning, false)
  );
end;
$$;

create or replace function public.amway_registrar_error(p_mensaje text, p_detalle text, p_path text, p_user_agent text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.amway_limite('error', public.amway_ip_peticion(), 20, interval '1 hour')
     or (select count(*) from public.amway_errores where created_at > now() - interval '1 hour') >= 200 then
    return;
  end if;
  insert into public.amway_errores (mensaje, detalle, path, user_agent)
  values (left(coalesce(p_mensaje, 'Error'), 500), left(p_detalle, 4000), left(p_path, 300), left(p_user_agent, 300));
end;
$$;

-- ---------- Desistimiento online ----------
-- El cliente comunica que desiste de un pedido desde la web (nº + teléfono,
-- mismo freno de intentos que la consulta de estado). Queda como solicitud
-- 'desistimiento' en el panel y el cliente recibe una referencia y la hora.
create or replace function public.amway_solicitar_desistimiento(
  p_numero bigint, p_telefono text, p_nombre text, p_email text, p_motivo text
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_tel text := right(regexp_replace(coalesce(p_telefono, ''), '\D', '', 'g'), 9);
  v_ok boolean;
  v_id uuid;
  v_fecha timestamptz;
begin
  if p_numero is null or length(v_tel) < 9 then
    return jsonb_build_object('error', 'datos');
  end if;
  if char_length(coalesce(trim(p_nombre), '')) not between 1 and 100
     or char_length(coalesce(p_email, '')) > 200 or char_length(coalesce(p_motivo, '')) > 1000 then
    return jsonb_build_object('error', 'datos');
  end if;

  delete from public.amway_consultas_pedido where created_at < now() - interval '1 day';
  if (select count(*) from public.amway_consultas_pedido
        where numero = p_numero and not acierto and created_at > now() - interval '1 hour') >= 5
     or (select count(*) from public.amway_consultas_pedido
        where not acierto and created_at > now() - interval '1 hour') >= 300
     or not public.amway_limite('desistimiento', public.amway_ip_peticion(), 10, interval '1 hour') then
    return jsonb_build_object('error', 'bloqueado');
  end if;

  select true into v_ok from public.amway_pedidos
   where numero = p_numero and estado <> 'cancelado'
     and right(regexp_replace(coalesce(cliente_telefono, ''), '\D', '', 'g'), 9) = v_tel;
  v_ok := coalesce(v_ok, false);
  insert into public.amway_consultas_pedido (numero, acierto) values (p_numero, v_ok);
  if not v_ok then
    return jsonb_build_object('error', 'no_encontrado');
  end if;

  insert into public.amway_solicitudes (tipo, producto_nombre, nombre, telefono, email, mensaje, pedido_numero)
  values ('desistimiento', 'Desistimiento del pedido nº ' || p_numero, trim(p_nombre), trim(p_telefono),
          nullif(trim(p_email), ''), nullif(trim(p_motivo), ''), p_numero)
  returning id, created_at into v_id, v_fecha;
  return jsonb_build_object('referencia', upper(left(replace(v_id::text, '-', ''), 8)), 'fecha', v_fecha);
end;
$$;
revoke all on function public.amway_solicitar_desistimiento(bigint, text, text, text, text) from public;
grant execute on function public.amway_solicitar_desistimiento(bigint, text, text, text, text) to anon, authenticated;

-- ---------- Panel: verificación en dos pasos ----------
-- Quien ya ha activado un segundo factor (TOTP) solo pasa como admin con
-- una sesión verificada (aal2). Quien aún no lo tiene sigue entrando igual,
-- para no dejar fuera a nadie mientras lo activa.
create or replace function public.amway_sesion_verificada()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
      or not exists (select 1 from auth.mfa_factors f where f.user_id = auth.uid() and f.status = 'verified');
$$;
revoke all on function public.amway_sesion_verificada() from public, anon;
grant execute on function public.amway_sesion_verificada() to authenticated;

create or replace function public.amway_es_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.amway_admins where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  ) and public.amway_sesion_verificada();
$$;

create or replace function public.amway_es_desarrollador()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.amway_admins
    where email = lower(coalesce(auth.jwt() ->> 'email', '')) and rol = 'desarrollador')
    and public.amway_sesion_verificada();
$$;

create or replace function public.amway_mi_rol()
returns text language sql stable security definer set search_path = public
as $$
  select rol from public.amway_admins
   where email = lower(coalesce(auth.jwt() ->> 'email', '')) and public.amway_sesion_verificada();
$$;

-- ---------- Registro de cambios del panel ----------
-- Quién cambió qué y cuándo en pedidos, productos, gastos y accesos. Sin
-- datos de contacto: de esos campos solo consta que cambiaron.
create table if not exists public.amway_auditoria (
  id bigint generated always as identity primary key,
  tabla text not null,
  registro text,
  accion text not null check (accion in ('alta', 'cambio', 'borrado')),
  usuario text,
  cambios jsonb,
  created_at timestamptz not null default now()
);
alter table public.amway_auditoria enable row level security;
create index if not exists idx_amway_auditoria_fecha on public.amway_auditoria (created_at desc);
drop policy if exists "amway_auditoria_dev" on public.amway_auditoria;
create policy "amway_auditoria_dev" on public.amway_auditoria for select to authenticated
  using (public.amway_es_desarrollador());

create or replace function public.amway_auditar()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_old jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  v_new jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  v_personales text[] := array['cliente_nombre', 'cliente_email', 'cliente_telefono', 'direccion', 'notas', 'notas_internas', 'items'];
  v_ignorar text[] := array['updated_at', 'push_avisado_at'];
  v_cambios jsonb := '{}'::jsonb;
  v_clave text;
  v_registro text;
begin
  v_registro := coalesce(v_new, v_old) ->> case tg_table_name
    when 'amway_pedidos' then 'numero' when 'amway_productos' then 'product_id'
    when 'amway_admins' then 'email' else 'id' end;

  if tg_op = 'UPDATE' then
    for v_clave in select jsonb_object_keys(v_new) loop
      continue when v_clave = any (v_ignorar) or (v_old -> v_clave) is not distinct from (v_new -> v_clave);
      v_cambios := v_cambios || jsonb_build_object(v_clave,
        case when v_clave = any (v_personales) then '"(modificado)"'::jsonb
             else jsonb_build_object('antes', v_old -> v_clave, 'despues', v_new -> v_clave) end);
    end loop;
    if v_cambios = '{}'::jsonb then return new; end if;
  elsif tg_op = 'DELETE' and tg_table_name = 'amway_pedidos' then
    v_cambios := jsonb_build_object('estado', v_old -> 'estado', 'total_eur', v_old -> 'total_eur', 'metodo_pago', v_old -> 'metodo_pago');
  elsif tg_table_name <> 'amway_pedidos' then
    v_cambios := coalesce(v_new, v_old) - v_personales;
  end if;

  insert into public.amway_auditoria (tabla, registro, accion, usuario, cambios)
  values (tg_table_name, v_registro,
          case tg_op when 'INSERT' then 'alta' when 'UPDATE' then 'cambio' else 'borrado' end,
          coalesce(auth.jwt() ->> 'email', 'sistema'), nullif(v_cambios, '{}'::jsonb));
  return coalesce(new, old);
end;
$$;
revoke all on function public.amway_auditar() from public, anon, authenticated;

drop trigger if exists amway_pedidos_auditoria on public.amway_pedidos;
create trigger amway_pedidos_auditoria after update or delete on public.amway_pedidos
  for each row execute function public.amway_auditar();
drop trigger if exists amway_productos_auditoria on public.amway_productos;
create trigger amway_productos_auditoria after insert or update or delete on public.amway_productos
  for each row execute function public.amway_auditar();
drop trigger if exists amway_gastos_auditoria on public.amway_gastos;
create trigger amway_gastos_auditoria after update or delete on public.amway_gastos
  for each row execute function public.amway_auditar();
drop trigger if exists amway_admins_auditoria on public.amway_admins;
create trigger amway_admins_auditoria after insert or update or delete on public.amway_admins
  for each row execute function public.amway_auditar();

-- ---------- Borrar mis datos: también la cuenta si es solo de esta tienda ----------
create or replace function public.amway_borrar_mis_datos()
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'no autorizado';
  end if;
  update public.amway_pedidos set cliente_id = null where cliente_id = auth.uid();
  delete from public.amway_clientes where user_id = auth.uid();
  -- La cuenta se creó en esta tienda: se borra entera (email, contraseña y
  -- perfil). Una cuenta de otra web del mismo Auth se conserva.
  delete from auth.users
   where id = auth.uid() and raw_user_meta_data ->> 'tienda' = 'amway-premium'
     and not exists (select 1 from public.amway_admins a where a.email = lower(auth.users.email));
end;
$$;

-- ---------- Anuncios: enlaces válidos también en la base de datos ----------
alter table public.amway_anuncios drop constraint if exists amway_anuncios_enlace_check;
alter table public.amway_anuncios add constraint amway_anuncios_enlace_check
  check (enlace is null or enlace = '' or enlace = '/' or enlace ~ '^/[^/\\]'
         or enlace ~* '^(https?://\S+|tel:\+?[\d ]+|mailto:\S+@\S+)$');

-- ---------- Conservación ----------
-- Lo que ya no hace falta se borra solo cada noche: límites (1 día),
-- intentos de consulta (1 día), errores (90 días), analítica (25 meses),
-- solicitudes cerradas (12 meses) y registro de cambios (3 años). Los
-- pedidos se conservan por obligación contable y se gestionan desde el panel.
create or replace function public.amway_purgar()
returns void
language plpgsql security definer set search_path = public
as $$
begin
  delete from public.amway_limites where created_at < now() - interval '1 day';
  delete from public.amway_consultas_pedido where created_at < now() - interval '1 day';
  delete from public.amway_errores where created_at < now() - interval '90 days';
  delete from public.amway_visitas where created_at < now() - interval '25 months';
  delete from public.amway_solicitudes where estado <> 'pendiente' and created_at < now() - interval '12 months';
  delete from public.amway_auditoria where created_at < now() - interval '3 years';
end;
$$;
revoke all on function public.amway_purgar() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'amway_purgar';
    perform cron.schedule('amway_purgar', '17 3 * * *', 'select public.amway_purgar()');
  end if;
end $$;
