-- Reseñas en Google: el panel apunta cuándo se pidió la reseña de cada
-- pedido para no olvidarse de nadie ni pedirla dos veces.
alter table public.amway_pedidos add column if not exists resena_pedida_at timestamptz;
