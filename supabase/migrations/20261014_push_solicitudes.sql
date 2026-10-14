-- Aviso al móvil de la gestora cuando llega una solicitud (producto que no
-- está en la web o desistimiento), igual que con los pedidos web.
-- Es idempotente: se puede ejecutar más de una vez.

alter table public.amway_solicitudes add column if not exists push_avisado_at timestamptz;
-- Las que ya había no se avisan.
update public.amway_solicitudes set push_avisado_at = created_at where push_avisado_at is null;

-- El servidor Next.js (con el token de pedidos) reclama las solicitudes
-- recientes sin avisar: las marca de forma atómica, así que cada una se
-- avisa una sola vez aunque la ruta se llame varias veces.
create or replace function public.amway_push_solicitudes(p_token text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_solicitudes jsonb;
begin
  if not public.amway_token_servidor_valido(p_token) then
    raise exception 'no autorizado';
  end if;

  with reclamadas as (
    update public.amway_solicitudes set push_avisado_at = now()
    where push_avisado_at is null and created_at > now() - interval '15 minutes'
    returning id, tipo, producto_nombre, nombre, pedido_numero, created_at
  )
  select jsonb_agg(jsonb_build_object(
    'id', id, 'tipo', tipo, 'producto_nombre', producto_nombre,
    'nombre', nombre, 'pedido_numero', pedido_numero
  ) order by created_at)
  into v_solicitudes from reclamadas;

  if v_solicitudes is null then
    return null;
  end if;

  return jsonb_build_object(
    'solicitudes', v_solicitudes,
    'destinos', coalesce((
      select jsonb_agg(jsonb_build_object('endpoint', s.endpoint, 'p256dh', s.p256dh, 'auth', s.auth))
      from public.amway_push_suscripciones s
      join public.amway_admins a on a.email = s.email
    ), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.amway_push_solicitudes(text) from public, authenticated;
grant execute on function public.amway_push_solicitudes(text) to anon;
