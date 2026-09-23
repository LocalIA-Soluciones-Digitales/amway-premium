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
-- sin clave usa el precio de catálogo. stock null = sin control de stock.

create table if not exists public.amway_productos (
  product_id text primary key check (char_length(product_id) between 1 and 80),
  precios_eur jsonb not null default '{}'::jsonb,
  costes_eur jsonb not null default '{}'::jsonb,
  agotado boolean not null default false,
  oculto boolean not null default false,
  stock integer check (stock is null or stock >= 0),
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

-- Mueve el stock de los productos de un pedido (signo -1 descuenta, +1
-- repone). Solo toca productos con stock controlado; al llegar a 0 los
-- marca agotados, y al reponer por encima de 0 los vuelve a activar.
create or replace function public.amway_mover_stock(p_items jsonb, p_signo integer)
returns void language plpgsql security definer set search_path = public
as $$
declare
  v_item jsonb;
begin
  for v_item in select * from jsonb_array_elements(p_items) loop
    update public.amway_productos
      set stock = greatest(0, stock + p_signo * coalesce((v_item ->> 'cantidad')::integer, 0)),
          agotado = case
            when greatest(0, stock + p_signo * coalesce((v_item ->> 'cantidad')::integer, 0)) = 0 then true
            when p_signo > 0 then false
            else agotado
          end
      where product_id = v_item ->> 'product_id' and stock is not null;
  end loop;
end;
$$;
revoke execute on function public.amway_mover_stock(jsonb, integer) from public, anon, authenticated;

create or replace function public.amway_pedido_stock()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.estado <> 'cancelado' then
      perform public.amway_mover_stock(new.items, -1);
    end if;
  elsif tg_op = 'UPDATE' then
    if old.estado <> 'cancelado' and new.estado = 'cancelado' then
      perform public.amway_mover_stock(old.items, 1);
    elsif old.estado = 'cancelado' and new.estado <> 'cancelado' then
      perform public.amway_mover_stock(new.items, -1);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists amway_pedidos_stock on public.amway_pedidos;
create trigger amway_pedidos_stock after insert or update of estado on public.amway_pedidos
  for each row execute function public.amway_pedido_stock();

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
    check (categoria in ('mercancia', 'envios', 'publicidad', 'comisiones', 'material', 'otros')),
  importe_eur numeric(10, 2) not null check (importe_eur >= 0),
  notas text,
  created_at timestamptz not null default now()
);
alter table public.amway_gastos enable row level security;

drop policy if exists "amway_gastos_admin" on public.amway_gastos;
create policy "amway_gastos_admin"
  on public.amway_gastos for all to authenticated
  using (public.amway_es_admin()) with check (public.amway_es_admin());

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
-- agotados/ocultos y la valoración media por producto. Nunca costes ni
-- stock exacto. stable → se puede llamar por GET (cacheable por Next).

create or replace function public.amway_catalogo_publico()
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'productos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', product_id,
        'precios', precios_eur,
        'agotado', agotado or (stock is not null and stock <= 0),
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
revoke execute on function public.amway_pedido_stock() from public, anon, authenticated;
revoke execute on function public.amway_set_updated_at() from public, anon, authenticated;

-- Alta de administradores (el usuario se crea en Supabase → Authentication):
--   insert into public.amway_admins (email) values ('correo@ejemplo.com');
-- Token del servidor para registrar pedidos (su sha256, nunca el token):
--   insert into public.amway_config (clave, valor) values ('pedidos_token_sha256', '<sha256 hex>')
--   on conflict (clave) do update set valor = excluded.valor;
