-- ============================================================
-- Días de cierre del local (festivos, vacaciones) e índice por nº de pedido
-- ============================================================
-- Independiente de 20261007_auditoria_prelanzamiento.sql: se puede aplicar
-- antes o después. Solo objetos amway_* (Supabase compartido).

-- Días en los que no se puede recoger aunque sean laborables. La cesta y
-- el servidor (validarPedidoWeb) los leen con amway_cierres_publicos();
-- la gestora los edita desde el panel (pestaña Hoy).
create table if not exists public.amway_cierres (
  fecha date primary key,
  motivo text check (motivo is null or char_length(motivo) <= 120),
  created_at timestamptz not null default now()
);
alter table public.amway_cierres enable row level security;

drop policy if exists "amway_cierres_admin" on public.amway_cierres;
create policy "amway_cierres_admin" on public.amway_cierres for all to authenticated
  using (public.amway_es_admin()) with check (public.amway_es_admin());

-- Solo las fechas (sin motivo) de hoy a 90 días: lo que necesita el
-- calendario de recogida, que ofrece como mucho 60 días.
create or replace function public.amway_cierres_publicos()
returns jsonb
language sql stable security definer set search_path = public
as $$
  select coalesce(jsonb_agg(to_char(fecha, 'YYYY-MM-DD') order by fecha), '[]'::jsonb)
  from public.amway_cierres
  where fecha between (now() at time zone 'Europe/Madrid')::date
                  and (now() at time zone 'Europe/Madrid')::date + 90;
$$;
revoke all on function public.amway_cierres_publicos() from public;
grant execute on function public.amway_cierres_publicos() to anon, authenticated;

-- Festivos nacionales que caen en laborable de aquí a enero. Los
-- autonómicos y locales (Euskadi, Barakaldo) los añade la gestora.
insert into public.amway_cierres (fecha, motivo) values
  ('2026-10-12', 'Fiesta Nacional de España'),
  ('2026-12-08', 'Inmaculada Concepción'),
  ('2026-12-25', 'Navidad'),
  ('2027-01-01', 'Año Nuevo'),
  ('2027-01-06', 'Reyes')
on conflict (fecha) do nothing;

-- Nº de pedido: lo usan la consulta del asistente, vincular y cancelar
-- pedidos (hasta ahora con recorrido completo de la tabla). Unique además
-- garantiza que dos pedidos nunca compartan número.
create unique index if not exists idx_amway_pedidos_numero on public.amway_pedidos (numero);
