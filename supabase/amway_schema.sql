-- ============================================================
-- Amway Premium — panel de gestión (precios, agotados, pedidos,
-- contabilidad, solicitudes y reseñas).
--
-- Vive en el mismo proyecto Supabase que otras webs (p.ej. Arrantza),
-- así que TODO lleva prefijo amway_ y no reutiliza ninguna tabla,
-- función ni trigger ajeno: ni clientes/site_key, ni mi_cliente_id(),
-- ni is_developer(), ni set_updated_at(). Borrar o cambiar esto nunca
-- afecta a otra web, y viceversa.
--
-- El catálogo (nombres, formatos, precio de catálogo) sigue en el código
-- (src/data/products). Aquí solo se guardan los ajustes por producto.
-- ============================================================

-- ---------- Acceso de administración ----------

create table if not exists public.amway_admins (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);
alter table public.amway_admins enable row level security;

create or replace function public.amway_es_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.amway_admins where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

drop policy if exists "amway_admins_select_self" on public.amway_admins;
create policy "amway_admins_select_self"
  on public.amway_admins for select to authenticated
  using (public.amway_es_admin());

-- Secretos del servidor Next.js (hash del token que registra pedidos web).
-- RLS sin policies: nadie lo lee por la API, solo las funciones definer.
create table if not exists public.amway_config (
  clave text primary key,
  valor text not null
);
alter table public.amway_config enable row level security;

create or replace function public.amway_set_updated_at()
returns trigger language plpgsql set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------- Ajustes por producto ----------
-- precios_eur / costes_eur: {"<índice de formato>": importe}. Un formato
-- sin clave usa el precio de catálogo. Sin control de stock: todo está
-- en tienda; «agotado» solo se marca a mano.

create table if not exists public.amway_productos (
  product_id text primary key check (char_length(product_id) between 1 and 80),
  precios_eur jsonb not null default '{}'::jsonb,
  costes_eur jsonb not null default '{}'::jsonb,
  agotado boolean not null default false,
  oculto boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.amway_productos enable row level security;

drop trigger if exists amway_productos_updated_at on public.amway_productos;
create trigger amway_productos_updated_at before update on public.amway_productos
  for each row execute function public.amway_set_updated_at();

drop policy if exists "amway_productos_admin" on public.amway_productos;
create policy "amway_productos_admin"
  on public.amway_productos for all to authenticated
  using (public.amway_es_admin()) with check (public.amway_es_admin());

-- ---------- Pedidos (web con Stripe + ventas manuales) ----------
-- items: [{product_id, variant_index, nombre, formato, sabor, cantidad,
--          precio_eur, coste_eur}] — copia congelada del momento de la venta.

create table if not exists public.amway_pedidos (
  id uuid primary key default gen_random_uuid(),
  numero bigint generated always as identity,
  origen text not null default 'web' check (origen in ('web', 'manual')),
  metodo_pago text not null default 'tarjeta'
    check (metodo_pago in ('tarjeta', 'bizum', 'efectivo', 'transferencia', 'whatsapp', 'otro')),
  estado text not null default 'pagado'
    check (estado in ('pendiente', 'pagado', 'enviado', 'entregado', 'cancelado')),
  stripe_session_id text unique,
  items jsonb not null default '[]'::jsonb,
  total_eur numeric(10, 2) not null check (total_eur >= 0),
  envio_eur numeric(10, 2) not null default 0,
  cliente_nombre text,
  cliente_email text,
  cliente_telefono text,
  direccion text,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.amway_pedidos enable row level security;

drop trigger if exists amway_pedidos_updated_at on public.amway_pedidos;
create trigger amway_pedidos_updated_at before update on public.amway_pedidos
  for each row execute function public.amway_set_updated_at();

drop policy if exists "amway_pedidos_admin" on public.amway_pedidos;
create policy "amway_pedidos_admin"
  on public.amway_pedidos for all to authenticated
  using (public.amway_es_admin()) with check (public.amway_es_admin());

create index if not exists idx_amway_pedidos_created_at on public.amway_pedidos (created_at desc);
create index if not exists idx_amway_pedidos_estado on public.amway_pedidos (estado);

-- Completa el coste unitario de cada línea (si no viene) con el coste
-- configurado del producto, para que la contabilidad refleje el margen
-- real del momento de la venta aunque luego cambie el coste.
create or replace function public.amway_pedido_completar_costes()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  select coalesce(jsonb_agg(
    case
      when (item ? 'coste_eur') and item ->> 'coste_eur' is not null then item
      else item || jsonb_build_object('coste_eur', (
        select (p.costes_eur ->> (item ->> 'variant_index'))::numeric
        from public.amway_productos p where p.product_id = item ->> 'product_id'
      ))
    end order by ord), '[]'::jsonb)
  into new.items
  from jsonb_array_elements(new.items) with ordinality as t(item, ord);
  return new;
end;
$$;

drop trigger if exists amway_pedidos_costes on public.amway_pedidos;
create trigger amway_pedidos_costes before insert on public.amway_pedidos
  for each row execute function public.amway_pedido_completar_costes();

-- El servidor Next.js registra aquí cada pago confirmado por Stripe.
-- Protegida con un token de servidor (solo se guarda su hash) porque la
-- anon key es pública. Idempotente por stripe_session_id: la página de
-- éxito y el webhook pueden llamarla los dos sin duplicar el pedido.
create or replace function public.amway_registrar_pedido_web(
  p_token text,
  p_stripe_session_id text,
  p_items jsonb,
  p_total_eur numeric,
  p_envio_eur numeric,
  p_metodo_pago text,
  p_cliente_nombre text,
  p_cliente_email text,
  p_cliente_telefono text,
  p_direccion text
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_hash text;
  v_id uuid;
begin
  select valor into v_hash from public.amway_config where clave = 'pedidos_token_sha256';
  if v_hash is null or v_hash <> encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex') then
    raise exception 'no autorizado';
  end if;
  if p_stripe_session_id is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'pedido inválido';
  end if;

  select id into v_id from public.amway_pedidos where stripe_session_id = p_stripe_session_id;
  if v_id is not null then
    return v_id;
  end if;

  insert into public.amway_pedidos (
    origen, metodo_pago, estado, stripe_session_id, items, total_eur, envio_eur,
    cliente_nombre, cliente_email, cliente_telefono, direccion
  ) values (
    'web', coalesce(nullif(p_metodo_pago, ''), 'tarjeta'), 'pagado', p_stripe_session_id, p_items,
    p_total_eur, coalesce(p_envio_eur, 0),
    nullif(p_cliente_nombre, ''), nullif(p_cliente_email, ''), nullif(p_cliente_telefono, ''), nullif(p_direccion, '')
  )
  on conflict (stripe_session_id) do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id from public.amway_pedidos where stripe_session_id = p_stripe_session_id;
  end if;
  return v_id;
end;
$$;

-- ---------- Gastos (contabilidad) ----------

create table if not exists public.amway_gastos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default current_date,
  concepto text not null check (char_length(concepto) between 1 and 200),
  categoria text not null default 'otros'
    check (categoria in ('mercancia', 'muestras', 'envios', 'publicidad', 'comisiones', 'material', 'cuota', 'transporte', 'telefono', 'web', 'formacion', 'otros')),
  importe_eur numeric(10, 2) not null check (importe_eur >= 0),
  notas text,
  created_at timestamptz not null default now()
);
alter table public.amway_gastos enable row level security;

drop policy if exists "amway_gastos_admin" on public.amway_gastos;
create policy "amway_gastos_admin"
  on public.amway_gastos for all to authenticated
  using (public.amway_es_admin()) with check (public.amway_es_admin());

-- Tablas ya creadas con la lista corta de categorías.
alter table public.amway_gastos drop constraint if exists amway_gastos_categoria_check;
alter table public.amway_gastos add constraint amway_gastos_categoria_check
  check (categoria in ('mercancia', 'muestras', 'envios', 'publicidad', 'comisiones', 'material', 'cuota', 'transporte', 'telefono', 'web', 'formacion', 'otros'));

create index if not exists idx_amway_gastos_fecha on public.amway_gastos (fecha desc);

-- ---------- Solicitudes de producto ----------
-- tipo: 'agotado' (avísame cuando vuelva), 'encargo' (pedir un producto
-- disponible con formato/cantidad concretos), 'otro' (algo fuera del catálogo).

create table if not exists public.amway_solicitudes (
  id uuid primary key default gen_random_uuid(),
  tipo text not null default 'encargo' check (tipo in ('agotado', 'encargo', 'otro')),
  product_id text,
  producto_nombre text not null,
  formato text,
  cantidad integer check (cantidad is null or cantidad between 1 and 999),
  nombre text not null,
  telefono text,
  email text,
  mensaje text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'atendida', 'descartada')),
  created_at timestamptz not null default now()
);
alter table public.amway_solicitudes enable row level security;

drop policy if exists "amway_solicitudes_admin" on public.amway_solicitudes;
create policy "amway_solicitudes_admin"
  on public.amway_solicitudes for all to authenticated
  using (public.amway_es_admin()) with check (public.amway_es_admin());

create index if not exists idx_amway_solicitudes_created_at on public.amway_solicitudes (created_at desc);

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
  -- Freno básico anti-spam: la API es pública.
  if (select count(*) from public.amway_solicitudes where created_at > now() - interval '1 hour') >= 60 then
    raise exception 'demasiadas solicitudes';
  end if;

  insert into public.amway_solicitudes (tipo, product_id, producto_nombre, formato, cantidad, nombre, telefono, email, mensaje)
  values (p_tipo, nullif(p_product_id, ''), p_producto_nombre, nullif(p_formato, ''), p_cantidad,
          trim(p_nombre), nullif(trim(p_telefono), ''), nullif(trim(p_email), ''), nullif(trim(p_mensaje), ''))
  returning id into v_id;
  return v_id;
end;
$$;

-- ---------- Reseñas ----------

create table if not exists public.amway_resenas (
  id uuid primary key default gen_random_uuid(),
  product_id text,
  producto_nombre text,
  nombre text not null,
  valoracion integer not null check (valoracion between 1 and 5),
  comentario text not null,
  respuesta text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobada', 'rechazada')),
  created_at timestamptz not null default now()
);
alter table public.amway_resenas enable row level security;

drop policy if exists "amway_resenas_select_publico" on public.amway_resenas;
create policy "amway_resenas_select_publico"
  on public.amway_resenas for select to anon, authenticated
  using (estado = 'aprobada');

drop policy if exists "amway_resenas_admin" on public.amway_resenas;
create policy "amway_resenas_admin"
  on public.amway_resenas for all to authenticated
  using (public.amway_es_admin()) with check (public.amway_es_admin());

create index if not exists idx_amway_resenas_estado on public.amway_resenas (estado, created_at desc);

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
  if (select count(*) from public.amway_resenas where created_at > now() - interval '1 hour') >= 30 then
    raise exception 'demasiadas reseñas';
  end if;

  insert into public.amway_resenas (product_id, producto_nombre, nombre, valoracion, comentario)
  values (nullif(p_product_id, ''), nullif(p_producto_nombre, ''), trim(p_nombre), p_valoracion, trim(p_comentario))
  returning id into v_id;
  return v_id;
end;
$$;

-- ---------- Lectura pública para la tienda ----------
-- Lo único que la web pública necesita: precios de venta ajustados,
-- agotados/ocultos y la valoración media por producto. Nunca costes. stable → se puede llamar por GET (cacheable por Next).

create or replace function public.amway_catalogo_publico()
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'productos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', product_id,
        'precios', precios_eur,
        'agotado', agotado,
        'oculto', oculto
      ))
      from public.amway_productos
    ), '[]'::jsonb),
    'valoraciones', coalesce((
      select jsonb_agg(v) from (
        select jsonb_build_object('id', product_id, 'media', round(avg(valoracion)::numeric, 1), 'total', count(*)) as v
        from public.amway_resenas
        where estado = 'aprobada' and product_id is not null
        group by product_id
      ) s
    ), '[]'::jsonb)
  );
$$;

-- Las funciones de trigger no tienen por qué poder llamarse por la API.
revoke execute on function public.amway_pedido_completar_costes() from public, anon, authenticated;
revoke execute on function public.amway_set_updated_at() from public, anon, authenticated;

-- Alta de administradores (el usuario se crea en Supabase → Authentication):
--   insert into public.amway_admins (email) values ('correo@ejemplo.com');
-- Token del servidor para registrar pedidos (su sha256, nunca el token):
--   insert into public.amway_config (clave, valor) values ('pedidos_token_sha256', '<sha256 hex>')
--   on conflict (clave) do update set valor = excluded.valor;

-- ============================================================
-- Roles, visitas y errores (panel de desarrollo)
-- ============================================================
-- Roles: 'gestor' (lleva la tienda) y 'desarrollador' (además ve informes,
-- visitas, errores y gestiona accesos). Ambos pasan amway_es_admin().
alter table public.amway_admins add column if not exists rol text not null default 'gestor'
  check (rol in ('gestor', 'desarrollador'));
alter table public.amway_admins add column if not exists nombre text;

create or replace function public.amway_es_desarrollador()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.amway_admins
    where email = lower(coalesce(auth.jwt() ->> 'email', '')) and rol = 'desarrollador');
$$;

create or replace function public.amway_mi_rol()
returns text language sql stable security definer set search_path = public
as $$ select rol from public.amway_admins where email = lower(coalesce(auth.jwt() ->> 'email', '')); $$;

drop policy if exists "amway_admins_select_self" on public.amway_admins;
create policy "amway_admins_select" on public.amway_admins for select to authenticated
  using (public.amway_es_admin());
drop policy if exists "amway_admins_write_dev" on public.amway_admins;
create policy "amway_admins_write_dev" on public.amway_admins for all to authenticated
  using (public.amway_es_desarrollador()) with check (public.amway_es_desarrollador());

-- Visitas: analítica propia, solo se registra con consentimiento de cookies.
create table if not exists public.amway_visitas (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  event_type text not null default 'pageview'
    check (event_type in ('pageview', 'add_to_cart', 'cart_open', 'checkout_start', 'whatsapp_click', 'solicitud', 'resena')),
  path text not null,
  label text,
  referrer text,
  source_category text not null default 'direct'
    check (source_category in ('google_ads', 'google_organic', 'social', 'referral', 'direct', 'other')),
  utm_source text,
  utm_medium text,
  utm_campaign text,
  device_type text check (device_type is null or device_type in ('mobile', 'tablet', 'desktop')),
  is_returning boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.amway_visitas enable row level security;
create policy "amway_visitas_dev" on public.amway_visitas for select to authenticated using (public.amway_es_desarrollador());
create policy "amway_visitas_dev_delete" on public.amway_visitas for delete to authenticated using (public.amway_es_desarrollador());
create index if not exists idx_amway_visitas_created_at on public.amway_visitas (created_at desc);
create index if not exists idx_amway_visitas_event on public.amway_visitas (event_type, created_at desc);
-- amway_registrar_visita(...) y amway_registrar_error(...): security definer,
-- con freno anti-abuso por sesión / por hora (ver migración amway_roles_visitas_errores).

create table if not exists public.amway_errores (
  id uuid primary key default gen_random_uuid(),
  mensaje text not null,
  detalle text,
  path text,
  user_agent text,
  created_at timestamptz not null default now()
);
alter table public.amway_errores enable row level security;
create policy "amway_errores_dev" on public.amway_errores for select to authenticated using (public.amway_es_desarrollador());
create policy "amway_errores_dev_delete" on public.amway_errores for delete to authenticated using (public.amway_es_desarrollador());

-- Envíos: nº de seguimiento y fecha de envío (para avisar al cliente).
alter table public.amway_pedidos add column if not exists seguimiento text check (seguimiento is null or char_length(seguimiento) <= 200);
alter table public.amway_pedidos add column if not exists enviado_at timestamptz;

-- ============================================================
-- Recogida en mano (día + hora) y pedidos web en efectivo
-- ============================================================
alter table public.amway_pedidos add column if not exists recogida_fecha date;
alter table public.amway_pedidos add column if not exists recogida_hora text
  check (recogida_hora is null or recogida_hora ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
create index if not exists idx_amway_pedidos_recogida on public.amway_pedidos (recogida_fecha)
  where recogida_fecha is not null;

-- Pago con tarjeta: igual que antes, más la recogida elegida en la cesta.
-- Los parámetros nuevos tienen default, así que las llamadas antiguas
-- (con nombre) siguen funcionando durante el despliegue.
drop function if exists public.amway_registrar_pedido_web(text, text, jsonb, numeric, numeric, text, text, text, text, text);
create or replace function public.amway_registrar_pedido_web(
  p_token text,
  p_stripe_session_id text,
  p_items jsonb,
  p_total_eur numeric,
  p_envio_eur numeric,
  p_metodo_pago text,
  p_cliente_nombre text,
  p_cliente_email text,
  p_cliente_telefono text,
  p_direccion text,
  p_recogida_fecha date default null,
  p_recogida_hora text default null,
  p_notas text default null
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_hash text;
  v_id uuid;
begin
  select valor into v_hash from public.amway_config where clave = 'pedidos_token_sha256';
  if v_hash is null or v_hash <> encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex') then
    raise exception 'no autorizado';
  end if;
  if p_stripe_session_id is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'pedido inválido';
  end if;

  select id into v_id from public.amway_pedidos where stripe_session_id = p_stripe_session_id;
  if v_id is not null then
    return v_id;
  end if;

  insert into public.amway_pedidos (
    origen, metodo_pago, estado, stripe_session_id, items, total_eur, envio_eur,
    cliente_nombre, cliente_email, cliente_telefono, direccion, recogida_fecha, recogida_hora, notas
  ) values (
    'web', coalesce(nullif(p_metodo_pago, ''), 'tarjeta'), 'pagado', p_stripe_session_id, p_items,
    p_total_eur, coalesce(p_envio_eur, 0),
    nullif(p_cliente_nombre, ''), nullif(p_cliente_email, ''), nullif(p_cliente_telefono, ''), nullif(p_direccion, ''),
    p_recogida_fecha, nullif(p_recogida_hora, ''), nullif(left(p_notas, 500), '')
  )
  on conflict (stripe_session_id) do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id from public.amway_pedidos where stripe_session_id = p_stripe_session_id;
  end if;
  return v_id;
end;
$$;

-- Pago en efectivo al recoger: el servidor Next.js (que recalcula los
-- precios) registra el pedido como 'pendiente' de pago. Mismo token que
-- los pagos con tarjeta, más un freno anti-spam.
create or replace function public.amway_registrar_pedido_recogida(
  p_token text,
  p_items jsonb,
  p_total_eur numeric,
  p_cliente_nombre text,
  p_cliente_telefono text,
  p_recogida_fecha date,
  p_recogida_hora text,
  p_notas text default null
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_hash text;
  v_id uuid;
  v_numero bigint;
begin
  select valor into v_hash from public.amway_config where clave = 'pedidos_token_sha256';
  if v_hash is null or v_hash <> encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex') then
    raise exception 'no autorizado';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or p_recogida_fecha is null then
    raise exception 'pedido inválido';
  end if;
  if char_length(coalesce(trim(p_cliente_nombre), '')) not between 1 and 100
     or char_length(coalesce(trim(p_cliente_telefono), '')) not between 6 and 30 then
    raise exception 'datos de contacto inválidos';
  end if;
  if (select count(*) from public.amway_pedidos
      where origen = 'web' and stripe_session_id is null and created_at > now() - interval '1 hour') >= 30 then
    raise exception 'demasiados pedidos';
  end if;

  insert into public.amway_pedidos (
    origen, metodo_pago, estado, items, total_eur, cliente_nombre, cliente_telefono,
    recogida_fecha, recogida_hora, notas
  ) values (
    'web', 'efectivo', 'pendiente', p_items, p_total_eur, trim(p_cliente_nombre), trim(p_cliente_telefono),
    p_recogida_fecha, p_recogida_hora, nullif(left(trim(coalesce(p_notas, '')), 500), '')
  )
  returning id, numero into v_id, v_numero;
  return jsonb_build_object('id', v_id, 'numero', v_numero);
end;
$$;

-- ============================================================
-- Asistente del botón de WhatsApp: eventos propios en la analítica
-- (abrir, temas consultados, valoraciones, productos añadidos…).
-- ============================================================
alter table public.amway_visitas drop constraint if exists amway_visitas_event_type_check;
alter table public.amway_visitas add constraint amway_visitas_event_type_check
  check (event_type in ('pageview', 'add_to_cart', 'cart_open', 'checkout_start', 'whatsapp_click', 'solicitud', 'resena', 'asistente'));

-- ============================================================
-- Control de recogidas y avisos push de pedidos nuevos
-- ============================================================
-- preparado_at: la gestora marca la bolsa como preparada para la recogida.
-- push_avisado_at: el aviso al móvil ya se envió (evita duplicados entre la
-- página de éxito y el webhook de Stripe).
alter table public.amway_pedidos add column if not exists preparado_at timestamptz;
alter table public.amway_pedidos add column if not exists push_avisado_at timestamptz;

-- Dispositivos con los avisos activados desde el panel (como
-- push_suscripciones de Arrantza, pero propio de esta tienda).
create table if not exists public.amway_push_suscripciones (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.amway_push_suscripciones enable row level security;

drop policy if exists "amway_push_select_propias" on public.amway_push_suscripciones;
create policy "amway_push_select_propias" on public.amway_push_suscripciones for select to authenticated
  using (public.amway_es_admin() and (email = lower(coalesce(auth.jwt() ->> 'email', '')) or public.amway_es_desarrollador()));
drop policy if exists "amway_push_delete_propias" on public.amway_push_suscripciones;
create policy "amway_push_delete_propias" on public.amway_push_suscripciones for delete to authenticated
  using (public.amway_es_admin() and (email = lower(coalesce(auth.jwt() ->> 'email', '')) or public.amway_es_desarrollador()));

create or replace function public.amway_guardar_suscripcion_push(
  p_endpoint text, p_p256dh text, p_auth text, p_user_agent text
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.amway_es_admin() then
    raise exception 'no autorizado';
  end if;
  if coalesce(p_endpoint, '') !~ '^https://' or coalesce(p_p256dh, '') = '' or coalesce(p_auth, '') = '' then
    raise exception 'suscripción inválida';
  end if;
  insert into public.amway_push_suscripciones (email, endpoint, p256dh, auth, user_agent)
  values (lower(auth.jwt() ->> 'email'), p_endpoint, p_p256dh, p_auth, left(p_user_agent, 400))
  on conflict (endpoint) do update
    set email = excluded.email, p256dh = excluded.p256dh, auth = excluded.auth,
        user_agent = excluded.user_agent, updated_at = now();
end;
$$;
revoke all on function public.amway_guardar_suscripcion_push(text, text, text, text) from public, anon;
grant execute on function public.amway_guardar_suscripcion_push(text, text, text, text) to authenticated;

create or replace function public.amway_token_servidor_valido(p_token text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.amway_config
    where clave = 'pedidos_token_sha256'
      and valor = encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex')
  );
$$;
revoke all on function public.amway_token_servidor_valido(text) from public, anon, authenticated;

-- El servidor Next.js (con el token de pedidos) reclama el aviso de un
-- pedido web: solo la primera llamada recibe el resumen y los destinos.
create or replace function public.amway_push_pedido(p_token text, p_pedido_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_pedido public.amway_pedidos;
begin
  if not public.amway_token_servidor_valido(p_token) then
    raise exception 'no autorizado';
  end if;

  update public.amway_pedidos set push_avisado_at = now()
  where id = p_pedido_id and origen = 'web' and push_avisado_at is null
  returning * into v_pedido;
  if v_pedido.id is null then
    return null;
  end if;

  return jsonb_build_object(
    'pedido', jsonb_build_object(
      'id', v_pedido.id, 'numero', v_pedido.numero, 'total_eur', v_pedido.total_eur,
      'metodo_pago', v_pedido.metodo_pago, 'estado', v_pedido.estado,
      'cliente_nombre', v_pedido.cliente_nombre,
      'recogida_fecha', v_pedido.recogida_fecha, 'recogida_hora', v_pedido.recogida_hora,
      'unidades', (select coalesce(sum((i ->> 'cantidad')::int), 0) from jsonb_array_elements(v_pedido.items) i)
    ),
    'destinos', coalesce((
      select jsonb_agg(jsonb_build_object('endpoint', s.endpoint, 'p256dh', s.p256dh, 'auth', s.auth))
      from public.amway_push_suscripciones s
      join public.amway_admins a on a.email = s.email
    ), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.amway_push_pedido(text, uuid) from public, authenticated;
grant execute on function public.amway_push_pedido(text, uuid) to anon;

-- Borra las suscripciones que el navegador ya ha dado de baja (404/410).
drop function if exists public.amway_push_caducadas(text, text[]);
create function public.amway_push_caducadas(p_token text, p_endpoints text[])
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_n integer;
begin
  if not public.amway_token_servidor_valido(p_token) then
    raise exception 'no autorizado';
  end if;
  delete from public.amway_push_suscripciones where endpoint = any (p_endpoints);
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;
revoke all on function public.amway_push_caducadas(text, text[]) from public, authenticated;
grant execute on function public.amway_push_caducadas(text, text[]) to anon;

-- Pedidos nuevos al instante en el panel (Realtime respeta la RLS: solo
-- los administradores los reciben).
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'amway_pedidos') then
    alter publication supabase_realtime add table public.amway_pedidos;
  end if;
end $$;

-- ============================================================
-- Asistente: «¿Cómo va mi pedido?». Solo responde si el número de pedido y
-- los últimos 9 dígitos del teléfono coinciden; no devuelve datos
-- personales. Freno: 5 fallos por pedido y hora, 300 fallos globales/hora.
-- La tabla de intentos no tiene políticas: solo la usa la función.
-- ============================================================
create table if not exists public.amway_consultas_pedido (
  id bigint generated always as identity primary key,
  numero bigint not null,
  acierto boolean not null,
  created_at timestamptz not null default now()
);
alter table public.amway_consultas_pedido enable row level security;
create index if not exists idx_amway_consultas_pedido on public.amway_consultas_pedido (numero, created_at desc);
create index if not exists idx_amway_consultas_pedido_fecha on public.amway_consultas_pedido (created_at);

create or replace function public.amway_estado_pedido(p_numero bigint, p_telefono text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_tel text := right(regexp_replace(coalesce(p_telefono, ''), '\D', '', 'g'), 9);
  v record;
  v_ok boolean;
begin
  if p_numero is null or length(v_tel) < 9 then
    return null;
  end if;

  delete from public.amway_consultas_pedido where created_at < now() - interval '1 day';
  if (select count(*) from public.amway_consultas_pedido
        where numero = p_numero and not acierto and created_at > now() - interval '1 hour') >= 5
     or (select count(*) from public.amway_consultas_pedido
        where not acierto and created_at > now() - interval '1 hour') >= 300 then
    return jsonb_build_object('bloqueado', true);
  end if;

  select numero, estado, metodo_pago, total_eur, recogida_fecha, recogida_hora, preparado_at, seguimiento
    into v
    from public.amway_pedidos
   where numero = p_numero
     and right(regexp_replace(coalesce(cliente_telefono, ''), '\D', '', 'g'), 9) = v_tel;
  v_ok := found;

  insert into public.amway_consultas_pedido (numero, acierto) values (p_numero, v_ok);
  if not v_ok then
    return null;
  end if;

  return jsonb_build_object(
    'numero', v.numero,
    'estado', v.estado,
    'metodo_pago', v.metodo_pago,
    'total_eur', v.total_eur,
    'recogida_fecha', v.recogida_fecha,
    'recogida_hora', v.recogida_hora,
    'preparado', v.preparado_at is not null,
    'seguimiento', v.seguimiento
  );
end;
$$;

revoke all on function public.amway_estado_pedido(bigint, text) from public;
grant execute on function public.amway_estado_pedido(bigint, text) to anon, authenticated;

-- ============================================================
-- Cuentas de cliente (opcionales). Se puede pedir sin cuenta igual que
-- siempre; quien se registra ve su historial, repite pedidos, cancela los
-- pendientes en efectivo y vincula pedidos antiguos (nº + teléfono).
-- Supabase Auth es compartido con otras webs: aquí solo existe el perfil
-- amway_clientes, y "borrar mis datos" nunca borra el usuario de Auth.
-- ============================================================
create table if not exists public.amway_clientes (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nombre text check (nombre is null or char_length(nombre) <= 100),
  telefono text check (telefono is null or char_length(telefono) <= 30),
  novedades boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.amway_clientes enable row level security;

drop trigger if exists amway_clientes_updated_at on public.amway_clientes;
create trigger amway_clientes_updated_at before update on public.amway_clientes
  for each row execute function public.amway_set_updated_at();

drop policy if exists "amway_clientes_select" on public.amway_clientes;
create policy "amway_clientes_select" on public.amway_clientes for select to authenticated
  using (user_id = auth.uid() or public.amway_es_admin());
drop policy if exists "amway_clientes_insert_propio" on public.amway_clientes;
create policy "amway_clientes_insert_propio" on public.amway_clientes for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists "amway_clientes_update_propio" on public.amway_clientes;
create policy "amway_clientes_update_propio" on public.amway_clientes for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.amway_pedidos add column if not exists cliente_id uuid
  references auth.users (id) on delete set null;
create index if not exists idx_amway_pedidos_cliente on public.amway_pedidos (cliente_id, created_at desc)
  where cliente_id is not null;

-- Registro de pedidos web: igual que antes, más la cuenta del cliente (el
-- servidor Next.js la comprueba con el token de sesión antes de pasarla).
drop function if exists public.amway_registrar_pedido_web(text, text, jsonb, numeric, numeric, text, text, text, text, text, date, text, text);
create or replace function public.amway_registrar_pedido_web(
  p_token text,
  p_stripe_session_id text,
  p_items jsonb,
  p_total_eur numeric,
  p_envio_eur numeric,
  p_metodo_pago text,
  p_cliente_nombre text,
  p_cliente_email text,
  p_cliente_telefono text,
  p_direccion text,
  p_recogida_fecha date default null,
  p_recogida_hora text default null,
  p_notas text default null,
  p_cliente_id uuid default null
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.amway_token_servidor_valido(p_token) then
    raise exception 'no autorizado';
  end if;
  if p_stripe_session_id is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'pedido inválido';
  end if;

  select id into v_id from public.amway_pedidos where stripe_session_id = p_stripe_session_id;
  if v_id is not null then
    return v_id;
  end if;

  insert into public.amway_pedidos (
    origen, metodo_pago, estado, stripe_session_id, items, total_eur, envio_eur,
    cliente_nombre, cliente_email, cliente_telefono, direccion, recogida_fecha, recogida_hora, notas, cliente_id
  ) values (
    'web', coalesce(nullif(p_metodo_pago, ''), 'tarjeta'), 'pagado', p_stripe_session_id, p_items,
    p_total_eur, coalesce(p_envio_eur, 0),
    nullif(p_cliente_nombre, ''), nullif(p_cliente_email, ''), nullif(p_cliente_telefono, ''), nullif(p_direccion, ''),
    p_recogida_fecha, nullif(p_recogida_hora, ''), nullif(left(p_notas, 500), ''),
    (select u.id from auth.users u where u.id = p_cliente_id)
  )
  on conflict (stripe_session_id) do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id from public.amway_pedidos where stripe_session_id = p_stripe_session_id;
  end if;
  return v_id;
end;
$$;

drop function if exists public.amway_registrar_pedido_recogida(text, jsonb, numeric, text, text, date, text, text);
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
  p_cliente_email text default null
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
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or p_recogida_fecha is null then
    raise exception 'pedido inválido';
  end if;
  if char_length(coalesce(trim(p_cliente_nombre), '')) not between 1 and 100
     or char_length(coalesce(trim(p_cliente_telefono), '')) not between 6 and 30 then
    raise exception 'datos de contacto inválidos';
  end if;
  if (select count(*) from public.amway_pedidos
      where origen = 'web' and stripe_session_id is null and created_at > now() - interval '1 hour') >= 30 then
    raise exception 'demasiados pedidos';
  end if;

  insert into public.amway_pedidos (
    origen, metodo_pago, estado, items, total_eur, cliente_nombre, cliente_telefono, cliente_email,
    recogida_fecha, recogida_hora, notas, cliente_id
  ) values (
    'web', 'efectivo', 'pendiente', p_items, p_total_eur, trim(p_cliente_nombre), trim(p_cliente_telefono),
    nullif(left(trim(coalesce(p_cliente_email, '')), 200), ''),
    p_recogida_fecha, p_recogida_hora, nullif(left(trim(coalesce(p_notas, '')), 500), ''),
    (select u.id from auth.users u where u.id = p_cliente_id)
  )
  returning id, numero into v_id, v_numero;
  return jsonb_build_object('id', v_id, 'numero', v_numero);
end;
$$;

-- Historial del cliente: sin costes internos ni campos del panel.
create or replace function public.amway_mis_pedidos()
returns jsonb
language sql stable security definer set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'numero', p.numero,
    'created_at', p.created_at,
    'estado', p.estado,
    'metodo_pago', p.metodo_pago,
    'total_eur', p.total_eur,
    'recogida_fecha', p.recogida_fecha,
    'recogida_hora', p.recogida_hora,
    'preparado', p.preparado_at is not null,
    'seguimiento', p.seguimiento,
    'notas', p.notas,
    'items', (
      select coalesce(jsonb_agg(i - 'coste_eur' order by ord), '[]'::jsonb)
      from jsonb_array_elements(p.items) with ordinality as t(i, ord)
    ),
    'puede_cancelar', p.estado = 'pendiente' and p.metodo_pago = 'efectivo' and p.preparado_at is null
  ) order by p.created_at desc), '[]'::jsonb)
  from public.amway_pedidos p
  where auth.uid() is not null and p.cliente_id = auth.uid();
$$;

-- El cliente cancela un pedido en efectivo que aún no está preparado.
create or replace function public.amway_cancelar_mi_pedido(p_numero bigint)
returns boolean
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'no autorizado';
  end if;
  update public.amway_pedidos
     set estado = 'cancelado',
         notas = left(concat_ws(chr(10), notas, 'Cancelado por el cliente desde su cuenta.'), 1000)
   where numero = p_numero and cliente_id = auth.uid()
     and estado = 'pendiente' and metodo_pago = 'efectivo' and preparado_at is null;
  return found;
end;
$$;

-- Vincula a la cuenta un pedido hecho sin sesión: mismo nº + teléfono y
-- mismo freno de intentos que la consulta del asistente.
create or replace function public.amway_vincular_pedido(p_numero bigint, p_telefono text)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_tel text := right(regexp_replace(coalesce(p_telefono, ''), '\D', '', 'g'), 9);
  v_ok boolean;
begin
  if auth.uid() is null then
    raise exception 'no autorizado';
  end if;
  if p_numero is null or length(v_tel) < 9 then
    return 'no';
  end if;

  delete from public.amway_consultas_pedido where created_at < now() - interval '1 day';
  if (select count(*) from public.amway_consultas_pedido
        where numero = p_numero and not acierto and created_at > now() - interval '1 hour') >= 5
     or (select count(*) from public.amway_consultas_pedido
        where not acierto and created_at > now() - interval '1 hour') >= 300 then
    return 'bloqueado';
  end if;

  update public.amway_pedidos set cliente_id = auth.uid()
   where numero = p_numero
     and (cliente_id is null or cliente_id = auth.uid())
     and right(regexp_replace(coalesce(cliente_telefono, ''), '\D', '', 'g'), 9) = v_tel;
  v_ok := found;

  insert into public.amway_consultas_pedido (numero, acierto) values (p_numero, v_ok);
  return case when v_ok then 'ok' else 'no' end;
end;
$$;

-- Borra el perfil y desvincula los pedidos (quedan en la contabilidad de la
-- tienda, sin cuenta). El usuario de Auth se conserva: es compartido.
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
end;
$$;

revoke all on function public.amway_mis_pedidos() from public, anon;
revoke all on function public.amway_cancelar_mi_pedido(bigint) from public, anon;
revoke all on function public.amway_vincular_pedido(bigint, text) from public, anon;
revoke all on function public.amway_borrar_mis_datos() from public, anon;
grant execute on function public.amway_mis_pedidos() to authenticated;
grant execute on function public.amway_cancelar_mi_pedido(bigint) to authenticated;
grant execute on function public.amway_vincular_pedido(bigint, text) to authenticated;
grant execute on function public.amway_borrar_mis_datos() to authenticated;

-- ============================================================
-- Datos de venta por línea y aviso de reposición.
-- amway_pedido_lineas: una fila por producto vendido (los pedidos guardan
-- las líneas en items jsonb). security_invoker: respeta el RLS de
-- amway_pedidos, así que solo la ve el panel.
-- dias_duracion: cuánto dura una unidad del producto; se usa para estimar
-- la reposición de quien solo lo ha comprado una vez.
-- ============================================================
alter table public.amway_productos add column if not exists dias_duracion integer
  check (dias_duracion is null or dias_duracion between 1 and 365);

create or replace view public.amway_pedido_lineas
with (security_invoker = true) as
select
  p.id as pedido_id,
  p.numero,
  p.cliente_id,
  p.created_at,
  (p.created_at at time zone 'Europe/Madrid')::date as dia,
  p.estado,
  p.origen,
  p.metodo_pago,
  t.ord::int as linea,
  nullif(t.i ->> 'product_id', '') as product_id,
  case when jsonb_typeof(t.i -> 'variant_index') = 'number' then (t.i ->> 'variant_index')::numeric::int else 0 end as variant_index,
  t.i ->> 'nombre' as nombre,
  nullif(t.i ->> 'formato', '') as formato,
  nullif(t.i ->> 'sabor', '') as sabor,
  case when jsonb_typeof(t.i -> 'cantidad') = 'number' then (t.i ->> 'cantidad')::numeric::int else 1 end as cantidad,
  case when jsonb_typeof(t.i -> 'precio_eur') = 'number' then (t.i ->> 'precio_eur')::numeric end as precio_eur,
  case when jsonb_typeof(t.i -> 'coste_eur') = 'number' then (t.i ->> 'coste_eur')::numeric end as coste_eur
from public.amway_pedidos p
cross join lateral jsonb_array_elements(case when jsonb_typeof(p.items) = 'array' then p.items else '[]'::jsonb end)
  with ordinality as t(i, ord);

revoke all on public.amway_pedido_lineas from public, anon;
grant select on public.amway_pedido_lineas to authenticated;

-- Productos que al cliente le toca reponer: ciclo = mediana de días entre
-- compras (con 2+ compras) o dias_duracion × unidades de la última compra.
-- Devuelve los que vencen en 14 días o están vencidos desde hace menos de
-- un ciclo (más allá, probablemente ya no lo usa).
create or replace function public.amway_mis_reposiciones()
returns jsonb
language sql stable security definer set search_path = public
as $$
  with lineas as (
    select l.product_id, l.variant_index, l.sabor, l.cantidad, l.dia, l.created_at, l.linea
    from public.amway_pedido_lineas l
    where auth.uid() is not null and l.cliente_id = auth.uid()
      and l.estado <> 'cancelado' and l.product_id is not null
  ),
  compras as (
    select product_id, dia, sum(cantidad) as unidades from lineas group by product_id, dia
  ),
  intervalos as (
    select product_id, dia, unidades, dia - lag(dia) over (partition by product_id order by dia) as dias
    from compras
  ),
  resumen as (
    select product_id,
      count(*)::int as compras,
      max(dia) as ultima,
      (array_agg(unidades order by dia desc))[1] as unidades_ultima,
      percentile_cont(0.5) within group (order by dias) filter (where dias is not null) as mediana
    from intervalos
    group by product_id
  ),
  ultima_linea as (
    select distinct on (product_id) product_id, variant_index, sabor
    from lineas
    order by product_id, created_at desc, linea
  ),
  estimado as (
    select r.product_id, u.variant_index, u.sabor, r.compras, r.ultima,
      case when r.mediana is not null then 'historial' else 'duracion' end as base,
      greatest(7, round(coalesce(r.mediana, pr.dias_duracion * r.unidades_ultima)))::int as ciclo
    from resumen r
    join ultima_linea u using (product_id)
    left join public.amway_productos pr on pr.product_id = r.product_id
    where coalesce(r.mediana, pr.dias_duracion * r.unidades_ultima) is not null
  ),
  avisos as (
    select e.*, e.ultima + e.ciclo as proxima,
      (e.ultima + e.ciclo) - (now() at time zone 'Europe/Madrid')::date as dias_restantes
    from estimado e
  )
  select coalesce(jsonb_agg(to_jsonb(a) order by a.dias_restantes), '[]'::jsonb)
  from avisos a
  where a.dias_restantes <= 14 and a.dias_restantes >= -a.ciclo;
$$;

revoke all on function public.amway_mis_reposiciones() from public, anon;
grant execute on function public.amway_mis_reposiciones() to authenticated;

-- ============================================================
-- Anuncios de la tienda (pop-up al entrar en la web)
-- ============================================================
-- Producto nuevo, evento en la tienda o aviso general. La web solo ve los
-- activos y dentro de sus fechas; un evento deja de mostrarse solo cuando
-- pasa su día. Las imágenes subidas van al bucket público amway-anuncios.

create table if not exists public.amway_anuncios (
  id uuid primary key default gen_random_uuid(),
  tipo text not null default 'aviso' check (tipo in ('producto', 'evento', 'aviso')),
  titulo text not null check (char_length(titulo) between 1 and 120),
  texto text check (char_length(texto) <= 600),
  product_id text check (char_length(product_id) <= 80),
  imagen_url text check (char_length(imagen_url) <= 500),
  boton_texto text check (char_length(boton_texto) <= 40),
  enlace text check (char_length(enlace) <= 500),
  evento_fecha date,
  evento_hora text check (evento_hora ~ '^\d{2}:\d{2}$'),
  evento_hora_fin text check (evento_hora_fin ~ '^\d{2}:\d{2}$'),
  evento_lugar text check (char_length(evento_lugar) <= 160),
  inicio timestamptz,
  fin timestamptz,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.amway_anuncios enable row level security;

drop trigger if exists amway_anuncios_updated_at on public.amway_anuncios;
create trigger amway_anuncios_updated_at before update on public.amway_anuncios
  for each row execute function public.amway_set_updated_at();

drop policy if exists "amway_anuncios_select_publico" on public.amway_anuncios;
create policy "amway_anuncios_select_publico"
  on public.amway_anuncios for select to anon, authenticated
  using (
    activo
    and (inicio is null or inicio <= now())
    and (fin is null or fin > now())
    and (evento_fecha is null or evento_fecha >= (now() at time zone 'Europe/Madrid')::date)
  );

drop policy if exists "amway_anuncios_admin" on public.amway_anuncios;
create policy "amway_anuncios_admin"
  on public.amway_anuncios for all to authenticated
  using (public.amway_es_admin()) with check (public.amway_es_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('amway-anuncios', 'amway-anuncios', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

drop policy if exists "amway_anuncios_imagenes_admin_insert" on storage.objects;
create policy "amway_anuncios_imagenes_admin_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'amway-anuncios' and public.amway_es_admin());
drop policy if exists "amway_anuncios_imagenes_admin_delete" on storage.objects;
create policy "amway_anuncios_imagenes_admin_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'amway-anuncios' and public.amway_es_admin());

-- Vídeo opcional en el anuncio (MP4/WebM, se reproduce en bucle y sin
-- sonido; la imagen hace de portada mientras carga).
alter table public.amway_anuncios add column if not exists video_url text check (char_length(video_url) <= 500);
update storage.buckets
   set file_size_limit = 31457280,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm']
 where id = 'amway-anuncios';

-- Panel de desarrollo → Accesos: último acceso y estado en Auth de cada
-- correo con permiso. Solo lectura y solo para desarrolladores.
create or replace function public.amway_actividad_admins()
returns table (email text, tiene_usuario boolean, confirmado boolean, ultimo_acceso timestamptz, usuario_desde timestamptz)
language sql stable security definer set search_path = public
as $$
  select a.email,
         u.id is not null,
         u.email_confirmed_at is not null,
         u.last_sign_in_at,
         u.created_at
  from public.amway_admins a
  left join auth.users u on lower(u.email) = a.email
  where public.amway_es_desarrollador();
$$;
revoke all on function public.amway_actividad_admins() from public, anon;
grant execute on function public.amway_actividad_admins() to authenticated;

-- Anuncios: cuánta gente ve cada pop-up y cuánta pulsa su botón (sesiones
-- distintas, solo visitantes que aceptan cookies). La gestora no lee
-- amway_visitas, así que se le da el recuento ya hecho.
alter table public.amway_visitas drop constraint if exists amway_visitas_event_type_check;
alter table public.amway_visitas add constraint amway_visitas_event_type_check
  check (event_type in ('pageview', 'add_to_cart', 'cart_open', 'checkout_start', 'whatsapp_click', 'solicitud', 'resena', 'asistente', 'anuncio_visto', 'anuncio_click'));

create or replace function public.amway_estadisticas_anuncios()
returns table (anuncio_id text, vistos bigint, clics bigint)
language sql stable security definer set search_path = public
as $$
  select v.label,
         count(distinct v.session_id) filter (where v.event_type = 'anuncio_visto'),
         count(distinct v.session_id) filter (where v.event_type = 'anuncio_click')
  from public.amway_visitas v
  where v.event_type in ('anuncio_visto', 'anuncio_click')
    and v.label is not null
    and public.amway_es_admin()
  group by v.label;
$$;
revoke all on function public.amway_estadisticas_anuncios() from public, anon;
grant execute on function public.amway_estadisticas_anuncios() to authenticated;

-- ============================================================
-- Pedidos: notas internas y nº de pedido con tarjeta
-- ============================================================
-- Notas de la gestora, separadas del comentario del cliente (`notas`, que
-- el cliente ve en su cuenta). amway_mis_pedidos no las devuelve.
alter table public.amway_pedidos add column if not exists notas_internas text;

create or replace function public.amway_cancelar_mi_pedido(p_numero bigint)
returns boolean
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'no autorizado';
  end if;
  update public.amway_pedidos
     set estado = 'cancelado',
         notas_internas = left(concat_ws(chr(10), notas_internas, 'Cancelado por el cliente desde su cuenta.'), 1000)
   where numero = p_numero and cliente_id = auth.uid()
     and estado = 'pendiente' and metodo_pago = 'efectivo' and preparado_at is null;
  return found;
end;
$$;

-- Nº de un pedido pagado con tarjeta (para la página de éxito). Solo el servidor.
create or replace function public.amway_numero_pedido_stripe(p_token text, p_stripe_session_id text)
returns bigint
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.amway_token_servidor_valido(p_token) then
    raise exception 'no autorizado';
  end if;
  return (select numero from public.amway_pedidos where stripe_session_id = p_stripe_session_id);
end;
$$;

-- ============================================================
-- Sin control de stock: Yuly lo tiene todo en tienda
-- ============================================================
drop trigger if exists amway_pedidos_stock on public.amway_pedidos;
drop function if exists public.amway_pedido_stock();
drop function if exists public.amway_mover_stock(jsonb, integer);
drop function if exists public.amway_stock_insuficiente(jsonb);
alter table public.amway_productos drop column if exists stock;

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
