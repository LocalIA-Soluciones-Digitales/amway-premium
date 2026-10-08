-- Pendiente de aplicar en Supabase (SQL Editor). Es idempotente: se puede ejecutar más de una vez.

-- La migración 20261007 borró amway_productos.stock, pero en producción
-- seguía la versión antigua de amway_catalogo_publico() que la leía (las
-- funciones SQL no se revalidan al borrar una columna). Desde entonces la
-- llamada responde 400 «column "stock" does not exist» y la tienda sirve el
-- catálogo base: sin los precios del panel, sin agotados/ocultos y sin
-- valoraciones. Misma definición que en amway_schema.sql.
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
