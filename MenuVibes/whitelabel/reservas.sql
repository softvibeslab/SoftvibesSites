-- ============================================================
--  MENUVIBES — MÓDULO RESERVAS (aditivo, idempotente)
--  Correr una vez en Supabase. No toca pedidos/lealtad/etc.
--  Patrón calcado de pedidos: RPC security definer para crear,
--  RLS de lectura/actualización para dueño y staff.
-- ============================================================

-- ── 1. Tabla ────────────────────────────────────────────────
create table if not exists reservas (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid references negocios(id),
  user_id uuid references usuarios(id),           -- cliente logueado (opcional)
  cliente_nombre text,
  cliente_telefono text,
  personas int default 2,
  fecha date,
  hora text,                                       -- 'HH:MM'
  zona text,                                       -- terraza / interior / barra (opcional)
  mesa text,                                        -- asignada por staff
  notas text,
  estado text default 'solicitada',                -- solicitada|confirmada|sentada|no_show|cancelada
  canal text default 'menu',                       -- menu | whatsapp | manual
  codigo_confirmacion text,
  confirmado_por uuid references auth.users(id) on delete set null,
  confirmado_at timestamptz,
  cancelado_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists reservas_negocio_fecha_idx on reservas(negocio_id, fecha);

-- ── 2. Flags de configuración en branding ───────────────────
alter table branding add column if not exists servicio_reserva boolean default false;
alter table branding add column if not exists reserva_horario text;              -- '13:00-22:00'
alter table branding add column if not exists reserva_max_personas int default 12;
alter table branding add column if not exists reserva_anticipacion_hrs int default 2;

-- ── 3. RLS ──────────────────────────────────────────────────
alter table reservas enable row level security;

drop policy if exists reservas_staff_read on reservas;
drop policy if exists reservas_staff_update on reservas;

-- Lectura: solo dueño/staff del negocio (las reservas son privadas).
create policy reservas_staff_read on reservas for select
  using (puede_gestionar_negocio(negocio_id) or puede_operar_pedidos(negocio_id));

-- Actualización directa (respaldo; el flujo normal usa el RPC).
create policy reservas_staff_update on reservas for update
  using (puede_gestionar_negocio(negocio_id) or puede_operar_pedidos(negocio_id))
  with check (puede_gestionar_negocio(negocio_id) or puede_operar_pedidos(negocio_id));
-- Nota: el público NO tiene policy de insert/select. Crea vía RPC security definer.

-- ── 4. RPC: crear reserva (cliente anónimo o logueado) ──────
create or replace function crear_reserva_cliente(
  p_negocio_id uuid,
  p_cliente_nombre text,
  p_cliente_telefono text,
  p_personas int,
  p_fecha date,
  p_hora text,
  p_notas text default null,
  p_zona text default null,
  p_user_id uuid default null,
  p_canal text default 'menu'
) returns table(id uuid, codigo_confirmacion text)
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_codigo text;
  v_try int;
  v_habilitado boolean;
begin
  if not negocio_publicado(p_negocio_id) then
    raise exception 'Negocio no publicado';
  end if;

  select coalesce(b.servicio_reserva, false) into v_habilitado
  from branding b where b.negocio_id = p_negocio_id;
  if not coalesce(v_habilitado, false) then
    raise exception 'Reservas no habilitadas para este negocio';
  end if;

  if coalesce(p_personas, 0) < 1 then
    raise exception 'Numero de personas invalido';
  end if;
  if p_fecha is null or p_fecha < current_date then
    raise exception 'Fecha invalida';
  end if;
  if coalesce(nullif(trim(p_cliente_nombre), ''), '') = '' then
    raise exception 'Falta el nombre';
  end if;

  for v_try in 1..12 loop
    v_codigo := 'MV-R-' || lpad((floor(random() * 1000000))::int::text, 6, '0');
    exit when not exists (
      select 1 from reservas r
      where r.negocio_id = p_negocio_id and r.codigo_confirmacion = v_codigo
    );
  end loop;

  insert into reservas (
    negocio_id, user_id, cliente_nombre, cliente_telefono, personas,
    fecha, hora, zona, notas, estado, canal, codigo_confirmacion, updated_at
  ) values (
    p_negocio_id, p_user_id, trim(p_cliente_nombre), nullif(trim(p_cliente_telefono), ''), p_personas,
    p_fecha, nullif(trim(p_hora), ''), nullif(trim(p_zona), ''), nullif(trim(p_notas), ''),
    'solicitada', coalesce(nullif(p_canal, ''), 'menu'), v_codigo, now()
  ) returning reservas.id into v_id;

  return query select v_id, v_codigo;
end;
$$;

-- ── 5. RPC: cambiar estado (staff / dueño) ──────────────────
create or replace function cambiar_estado_reserva(
  p_reserva_id uuid,
  p_estado text,
  p_mesa text default null
) returns table(id uuid, estado text, updated_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare
  v_negocio_id uuid;
begin
  select r.negocio_id into v_negocio_id from reservas r where r.id = p_reserva_id;
  if v_negocio_id is null then
    raise exception 'Reserva no encontrada';
  end if;
  if not puede_operar_pedidos(v_negocio_id) then
    raise exception 'No autorizado';
  end if;
  if p_estado not in ('solicitada','confirmada','sentada','no_show','cancelada') then
    raise exception 'Estado invalido';
  end if;

  update reservas r
  set estado = p_estado,
      mesa = coalesce(nullif(p_mesa, ''), r.mesa),
      confirmado_por = case when p_estado = 'confirmada' then auth.uid() else r.confirmado_por end,
      confirmado_at  = case when p_estado = 'confirmada' then coalesce(r.confirmado_at, now()) else r.confirmado_at end,
      cancelado_at   = case when p_estado = 'cancelada'  then coalesce(r.cancelado_at, now())  else r.cancelado_at end,
      updated_at = now()
  where r.id = p_reserva_id;

  return query select r.id, r.estado, r.updated_at from reservas r where r.id = p_reserva_id;
end;
$$;

-- ── 6. Permisos de ejecución (anon crea, staff gestiona) ────
grant execute on function crear_reserva_cliente(uuid, text, text, int, date, text, text, text, uuid, text) to anon, authenticated;
grant execute on function cambiar_estado_reserva(uuid, text, text) to authenticated;
