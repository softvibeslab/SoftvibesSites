-- ============================================================
--  MENUVIBES — TABLAS BASE (clientes finales, pedidos, cupones)
--  Correr ANTES de schema.sql en una instalacion fresca.
-- ============================================================

create table if not exists usuarios (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  password_hash text not null,
  created_at timestamptz default now()
);

create table if not exists pedidos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references usuarios(id),
  nickname text,
  items jsonb,
  total int default 0,
  cupon_aplicado text,
  descuento_pct int default 0,
  estado text default 'pendiente',      -- pendiente | confirmado | cancelado
  metodo_pago text,                     -- efectivo | tarjeta | transferencia
  created_at timestamptz default now()
);

create table if not exists cupones_canjeados (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references usuarios(id),
  nickname text,
  cupon_codigo text,
  descuento_pct int,
  pedido_id uuid references pedidos(id),
  canjeado_at timestamptz default now()
);

-- RLS temporal de bootstrap: permite que una instalacion fresca no falle
-- antes de correr schema.sql. schema.sql reemplaza estas politicas por RPC
-- controlados y lectura limitada por negocio publicado.
alter table usuarios enable row level security;
alter table pedidos enable row level security;
alter table cupones_canjeados enable row level security;

drop policy if exists usuarios_anon on usuarios;
create policy usuarios_anon on usuarios for all using (true) with check (true);

drop policy if exists pedidos_anon_rw on pedidos;
create policy pedidos_anon_rw on pedidos for all using (true) with check (true);

drop policy if exists cupones_anon_rw on cupones_canjeados;
create policy cupones_anon_rw on cupones_canjeados for all using (true) with check (true);
