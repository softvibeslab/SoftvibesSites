-- ============================================================
--  MENUVIBES WHITELABEL — SCHEMA MULTI-TENANT
--  Ejecutar en: Supabase Dashboard > SQL Editor
--  Idempotente: se puede correr mas de una vez sin romper nada.
-- ============================================================

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- ── 1. NEGOCIOS (tenant raiz) ────────────────────────────────
create table if not exists negocios (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nombre text not null,
  whatsapp text,
  admin_user_id uuid references auth.users(id),
  estado text not null default 'borrador',        -- borrador | publicado
  origen text default 'manual',                   -- manual | scraping (Fase 2)
  origen_url text,                                -- URL de Maps/redes si vino de scraping
  created_at timestamptz default now()
);
-- Columnas nuevas por si la tabla ya existia (version anterior con CSVs)
alter table negocios add column if not exists slug text;
alter table negocios add column if not exists estado text default 'publicado';
alter table negocios add column if not exists origen text default 'manual';
alter table negocios add column if not exists origen_url text;
alter table negocios add column if not exists rating_google numeric;   -- rating actual en Google Maps (modulo Reputacion)
alter table negocios add column if not exists resenas_google int;      -- total de resenas en Google Maps
create unique index if not exists negocios_slug_idx on negocios (slug);

-- ── 2. PERFILES (roles de usuarios del dashboard) ────────────
create table if not exists perfiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  rol text not null default 'business_owner',     -- super_admin | business_owner | business_manager
  nombre text,
  created_at timestamptz default now()
);

-- ── 3. BRANDING (1:1 con negocio) ────────────────────────────
create table if not exists branding (
  negocio_id uuid primary key references negocios(id) on delete cascade,
  logo_url text,
  tagline text,
  color_primario text default '#FFD700',          -- --y  (acento)
  color_fondo text default '#0D0D0D',             -- --b  (fondo)
  color_superficie text default '#1A1A1A',        -- --d  (cards)
  color_texto text default '#FFFFFF',             -- --w
  fuente_titulos text default 'Bebas Neue',
  fuente_cuerpo text default 'Nunito',
  direccion text,
  ciudad text,
  horario_footer text,
  instagram text,
  instagram_url text,
  promo_texto text,
  promo_nombre text,
  promo_precio int default 0,
  wifi_ssid text,
  wifi_password text
);
-- Columnas nuevas por si la tabla ya existia
alter table branding add column if not exists wifi_ssid text;
alter table branding add column if not exists wifi_password text;
alter table branding add column if not exists hero_imagen_url text;
alter table branding add column if not exists bienvenida_activa boolean default true;
alter table branding add column if not exists bienvenida_titulo text;
alter table branding add column if not exists bienvenida_texto text;
alter table branding add column if not exists servicio_mesa boolean default true;
alter table branding add column if not exists servicio_delivery boolean default true;
alter table branding add column if not exists servicio_pickup boolean default true;
alter table branding add column if not exists google_maps_url text;
alter table branding add column if not exists google_place_id text;
alter table branding add column if not exists mapa_embed_url text;
alter table branding add column if not exists tripadvisor_url text;
alter table branding add column if not exists facebook_url text;
alter table branding add column if not exists tiktok_url text;
alter table branding add column if not exists website_url text;
update branding set
  bienvenida_activa = coalesce(bienvenida_activa, true),
  servicio_mesa = coalesce(servicio_mesa, true),
  servicio_delivery = coalesce(servicio_delivery, true),
  servicio_pickup = coalesce(servicio_pickup, true);

-- ── 4. FEATURES (flags 1:1 con negocio) ──────────────────────
create table if not exists features (
  negocio_id uuid primary key references negocios(id) on delete cascade,
  mostrar_fotos boolean default false,
  verificar_horario boolean default false,
  colapsar_secciones boolean default true,
  lealtad boolean default true,
  fidelizacion_premium boolean default false,
  nps_visitas boolean default false,
  resenas_premium boolean default false,
  agente_activo boolean default false,
  agente_orquestador boolean default false,
  agente_ventas boolean default false,
  agente_atencion boolean default false
);
alter table features add column if not exists fidelizacion_premium boolean default false;
alter table features add column if not exists nps_visitas boolean default false;
alter table features add column if not exists resenas_premium boolean default false;
alter table features add column if not exists agente_activo boolean default false;
alter table features add column if not exists agente_orquestador boolean default false;
alter table features add column if not exists agente_ventas boolean default false;
alter table features add column if not exists agente_atencion boolean default false;

-- ── 5. SECCIONES ─────────────────────────────────────────────
create table if not exists secciones (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id) on delete cascade,
  key text not null,                              -- identificador corto (desayuno, bebidas...)
  titulo text not null,
  badge text,
  nota text,
  horario_inicio text,                            -- "07:00"
  horario_fin text,                               -- "12:30"
  es_subseccion boolean default false,            -- antes columna "sm"
  colapsada boolean default false,
  orden int default 0,
  activo boolean default true,
  unique (negocio_id, key)
);
create index if not exists secciones_negocio_idx on secciones (negocio_id, orden);

-- ── 6. PRODUCTOS ─────────────────────────────────────────────
create table if not exists productos (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id) on delete cascade,
  seccion_id uuid references secciones(id) on delete set null,
  nombre text not null,
  descripcion text,
  precio int not null default 0,
  tag text,
  imagen_url text,
  has_papas boolean default false,
  precio_papas int,
  opciones text,                                  -- "Queso|Tocino|Piña"
  opciones_precio text,                           -- "10|15|0"
  opciones_label text,
  permitir_duplicar boolean default true,         -- antes "has_agregar"
  orden int default 0,
  activo boolean default true
);
create index if not exists productos_negocio_idx on productos (negocio_id, seccion_id, orden);

-- ── 7. NIVELES DE LEALTAD ────────────────────────────────────
create table if not exists niveles (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id) on delete cascade,
  pedidos int not null,
  descuento int not null
);

-- ── 8. MODULOS PREMIUM: VISITAS, NPS, BENEFICIOS Y RESENAS ────
create table if not exists beneficios_premium (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id) on delete cascade,
  tipo text not null default 'visita',             -- visita | nps | resena | post
  nombre text not null,
  descripcion text,
  descuento_pct int default 0,
  puntos int default 0,
  activo boolean default true,
  orden int default 0,
  created_at timestamptz default now()
);
create index if not exists beneficios_premium_negocio_idx on beneficios_premium (negocio_id, tipo, activo, orden);

create table if not exists visitas_clientes (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id) on delete cascade,
  usuario_id uuid references usuarios(id) on delete set null,
  nickname text,
  beneficio_id uuid references beneficios_premium(id) on delete set null,
  origen text default 'menu',
  created_at timestamptz default now()
);
create index if not exists visitas_clientes_negocio_idx on visitas_clientes (negocio_id, created_at desc);
create index if not exists visitas_clientes_usuario_idx on visitas_clientes (usuario_id, created_at desc);

create table if not exists nps_respuestas (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id) on delete cascade,
  visita_id uuid references visitas_clientes(id) on delete set null,
  usuario_id uuid references usuarios(id) on delete set null,
  nickname text,
  score int not null check (score between 0 and 10),
  comentario text,
  beneficio_id uuid references beneficios_premium(id) on delete set null,
  created_at timestamptz default now()
);
alter table nps_respuestas add column if not exists recuperacion_estado text default 'nuevo'; -- nuevo | contactado | resuelto | cerrado
alter table nps_respuestas add column if not exists recuperacion_notas text;
alter table nps_respuestas add column if not exists recuperacion_updated_at timestamptz;
alter table nps_respuestas add column if not exists recuperacion_by uuid references auth.users(id) on delete set null;
create index if not exists nps_respuestas_negocio_idx on nps_respuestas (negocio_id, created_at desc);
create index if not exists nps_respuestas_recuperacion_idx on nps_respuestas (negocio_id, recuperacion_estado, created_at desc);

create table if not exists canales_resena (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id) on delete cascade,
  plataforma text not null default 'Google Maps',
  url text not null,
  activo boolean default true,
  orden int default 0,
  created_at timestamptz default now()
);
create index if not exists canales_resena_negocio_idx on canales_resena (negocio_id, activo, orden);
update branding b set google_maps_url = coalesce(
  nullif(b.google_maps_url, ''),
  (select c.url from canales_resena c
   where c.negocio_id = b.negocio_id and lower(c.plataforma) like '%google%'
   order by c.orden, c.created_at limit 1)
);
update branding b set tripadvisor_url = coalesce(
  nullif(b.tripadvisor_url, ''),
  (select c.url from canales_resena c
   where c.negocio_id = b.negocio_id and lower(c.plataforma) like '%trip%'
   order by c.orden, c.created_at limit 1)
);

create table if not exists acciones_resena (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id) on delete cascade,
  visita_id uuid references visitas_clientes(id) on delete set null,
  usuario_id uuid references usuarios(id) on delete set null,
  nickname text,
  canal_id uuid references canales_resena(id) on delete set null,
  plataforma text,
  accion text default 'click',                    -- click | confirmado | post
  beneficio_id uuid references beneficios_premium(id) on delete set null,
  created_at timestamptz default now()
);
create index if not exists acciones_resena_negocio_idx on acciones_resena (negocio_id, created_at desc);

create table if not exists beneficio_redenciones (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id) on delete cascade,
  beneficio_id uuid references beneficios_premium(id) on delete set null,
  usuario_id uuid references usuarios(id) on delete set null,
  visita_id uuid references visitas_clientes(id) on delete set null,
  nps_id uuid references nps_respuestas(id) on delete set null,
  accion_resena_id uuid references acciones_resena(id) on delete set null,
  nickname text,
  origen text default 'premium',                  -- visita | nps | manual | premium
  codigo text not null,
  estado text default 'emitido',                  -- emitido | redimido | expirado | cancelado
  redimido_por uuid references auth.users(id) on delete set null,
  redimido_at timestamptz,
  notas text,
  expires_at timestamptz,
  created_at timestamptz default now()
);
alter table beneficio_redenciones add column if not exists negocio_id uuid references negocios(id) on delete cascade;
alter table beneficio_redenciones add column if not exists beneficio_id uuid references beneficios_premium(id) on delete set null;
alter table beneficio_redenciones add column if not exists usuario_id uuid references usuarios(id) on delete set null;
alter table beneficio_redenciones add column if not exists visita_id uuid references visitas_clientes(id) on delete set null;
alter table beneficio_redenciones add column if not exists nps_id uuid references nps_respuestas(id) on delete set null;
alter table beneficio_redenciones add column if not exists accion_resena_id uuid references acciones_resena(id) on delete set null;
alter table beneficio_redenciones add column if not exists nickname text;
alter table beneficio_redenciones add column if not exists origen text default 'premium';
alter table beneficio_redenciones add column if not exists codigo text;
alter table beneficio_redenciones add column if not exists estado text default 'emitido';
alter table beneficio_redenciones add column if not exists redimido_por uuid references auth.users(id) on delete set null;
alter table beneficio_redenciones add column if not exists redimido_at timestamptz;
alter table beneficio_redenciones add column if not exists notas text;
alter table beneficio_redenciones add column if not exists expires_at timestamptz;
alter table beneficio_redenciones add column if not exists created_at timestamptz default now();
create unique index if not exists beneficio_redenciones_codigo_idx on beneficio_redenciones (negocio_id, lower(codigo));
create index if not exists beneficio_redenciones_negocio_idx on beneficio_redenciones (negocio_id, estado, created_at desc);
create index if not exists beneficio_redenciones_usuario_idx on beneficio_redenciones (usuario_id, created_at desc);

create table if not exists resenas_externas (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id) on delete cascade,
  fuente text not null default 'Google Maps',      -- Google Maps | Tripadvisor | Manual
  autor text,
  rating numeric(2,1) default 5,
  texto text not null,
  fecha_texto text,
  url text,
  avatar_url text,
  destacado boolean default true,
  activo boolean default true,
  orden int default 0,
  created_at timestamptz default now()
);
create index if not exists resenas_externas_negocio_idx on resenas_externas (negocio_id, activo, destacado, orden);

-- ── 9. MULTI-TENANT EN TABLAS EXISTENTES ─────────────────────
-- usuarios / pedidos / cupones_canjeados ya existen en tu proyecto.
-- Se agrega negocio_id para aislar clientes finales por negocio.
alter table usuarios add column if not exists negocio_id uuid references negocios(id);
alter table pedidos add column if not exists negocio_id uuid references negocios(id);
alter table pedidos add column if not exists tipo_servicio text default 'mesa';
alter table pedidos add column if not exists mesa text;
alter table pedidos add column if not exists direccion_entrega text;
alter table pedidos add column if not exists hora_pickup text;
alter table pedidos add column if not exists cliente_nombre text;
alter table pedidos add column if not exists cliente_telefono text;
alter table pedidos add column if not exists contexto jsonb default '{}'::jsonb;
alter table pedidos add column if not exists codigo_confirmacion text;
alter table pedidos add column if not exists qr_token_hash text;
alter table pedidos add column if not exists confirmado_por uuid references auth.users(id) on delete set null;
alter table pedidos add column if not exists confirmado_at timestamptz;
alter table pedidos add column if not exists cancelado_at timestamptz;
alter table pedidos add column if not exists updated_at timestamptz default now();
alter table pedidos add column if not exists corte_id uuid;
alter table cupones_canjeados add column if not exists negocio_id uuid references negocios(id);
create index if not exists pedidos_negocio_idx on pedidos (negocio_id, created_at desc);
create index if not exists pedidos_servicio_idx on pedidos (negocio_id, tipo_servicio, created_at desc);
create index if not exists pedidos_estado_idx on pedidos (negocio_id, estado, created_at desc);
create unique index if not exists pedidos_codigo_confirmacion_idx on pedidos (negocio_id, codigo_confirmacion) where codigo_confirmacion is not null;
create unique index if not exists usuarios_negocio_nickname_idx on usuarios (negocio_id, lower(nickname));

-- ── 9B. OPERACION: STAFF, EVENTOS Y CORTES ──────────────────
create table if not exists negocio_staff (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rol text not null default 'mesero',             -- mesero | cocina | cajero | manager | owner
  nombre text,
  activo boolean default true,
  created_at timestamptz default now(),
  unique (negocio_id, user_id)
);
create index if not exists negocio_staff_negocio_idx on negocio_staff (negocio_id, rol, activo);
create index if not exists negocio_staff_user_idx on negocio_staff (user_id, activo);

create table if not exists pedido_eventos (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id) on delete cascade,
  pedido_id uuid not null references pedidos(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  evento text not null,
  estado_anterior text,
  estado_nuevo text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
create index if not exists pedido_eventos_pedido_idx on pedido_eventos (pedido_id, created_at desc);
create index if not exists pedido_eventos_negocio_idx on pedido_eventos (negocio_id, created_at desc);

create table if not exists cortes_caja (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id) on delete cascade,
  abierto_por uuid references auth.users(id) on delete set null,
  cerrado_por uuid references auth.users(id) on delete set null,
  fecha_apertura timestamptz default now(),
  fecha_cierre timestamptz,
  total_ventas int default 0,
  total_efectivo int default 0,
  total_tarjeta int default 0,
  total_transferencia int default 0,
  total_cancelado int default 0,
  notas text,
  estado text default 'abierto',                  -- abierto | cerrado
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists cortes_caja_negocio_idx on cortes_caja (negocio_id, estado, fecha_apertura desc);

alter table pedidos
  drop constraint if exists pedidos_corte_id_fkey;
alter table pedidos
  add constraint pedidos_corte_id_fkey foreign key (corte_id) references cortes_caja(id) on delete set null;

-- ── 10. HELPERS DE AUTORIZACION ──────────────────────────────
create or replace function es_super_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where user_id = auth.uid() and rol = 'super_admin');
$$;

create or replace function es_dueno(nid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from negocios where id = nid and admin_user_id = auth.uid());
$$;

create or replace function negocio_publicado(nid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from negocios where id = nid and estado = 'publicado');
$$;

create or replace function puede_gestionar_negocio(nid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select es_super_admin() or es_dueno(nid);
$$;

create or replace function es_staff_negocio(nid uuid, roles text[] default array['mesero','cocina','cajero','manager','owner']) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from negocio_staff s
    where s.negocio_id = nid
      and s.user_id = auth.uid()
      and s.activo = true
      and s.rol = any(roles)
  );
$$;

create or replace function puede_operar_pedidos(nid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select puede_gestionar_negocio(nid) or es_staff_negocio(nid, array['mesero','cocina','cajero','manager','owner']);
$$;

-- ── 11. RLS ─────────────────────────────────────────────────
alter table negocios  enable row level security;
alter table perfiles  enable row level security;
alter table branding  enable row level security;
alter table features  enable row level security;
alter table secciones enable row level security;
alter table productos enable row level security;
alter table niveles   enable row level security;
alter table beneficios_premium enable row level security;
alter table visitas_clientes enable row level security;
alter table nps_respuestas enable row level security;
alter table canales_resena enable row level security;
alter table acciones_resena enable row level security;
alter table resenas_externas enable row level security;
alter table beneficio_redenciones enable row level security;
alter table negocio_staff enable row level security;
alter table pedido_eventos enable row level security;
alter table cortes_caja enable row level security;

-- Reemplazar politicas permisivas heredadas de base-tables.sql.
drop policy if exists usuarios_anon on usuarios;
drop policy if exists pedidos_anon_rw on pedidos;
drop policy if exists cupones_anon_rw on cupones_canjeados;

-- Lectura publica limitada: el menu anonimo solo debe ver negocios publicados.
drop policy if exists negocios_read  on negocios;
drop policy if exists branding_read  on branding;
drop policy if exists features_read  on features;
drop policy if exists secciones_read on secciones;
drop policy if exists productos_read on productos;
drop policy if exists niveles_read   on niveles;
drop policy if exists beneficios_premium_read on beneficios_premium;
drop policy if exists canales_resena_read on canales_resena;
drop policy if exists resenas_externas_read on resenas_externas;
create policy negocios_read on negocios for select
  using (estado = 'publicado' or es_super_admin() or admin_user_id = auth.uid());
create policy branding_read on branding for select
  using (negocio_publicado(negocio_id) or puede_gestionar_negocio(negocio_id));
create policy features_read on features for select
  using (negocio_publicado(negocio_id) or puede_gestionar_negocio(negocio_id));
create policy secciones_read on secciones for select
  using (negocio_publicado(negocio_id) or puede_gestionar_negocio(negocio_id));
create policy productos_read on productos for select
  using (negocio_publicado(negocio_id) or puede_gestionar_negocio(negocio_id));
create policy niveles_read on niveles for select
  using (negocio_publicado(negocio_id) or puede_gestionar_negocio(negocio_id));
create policy beneficios_premium_read on beneficios_premium for select
  using (negocio_publicado(negocio_id) or puede_gestionar_negocio(negocio_id));
create policy canales_resena_read on canales_resena for select
  using (negocio_publicado(negocio_id) or puede_gestionar_negocio(negocio_id));
create policy resenas_externas_read on resenas_externas for select
  using (negocio_publicado(negocio_id) or puede_gestionar_negocio(negocio_id));

-- Escritura: dueno del negocio o super admin
drop policy if exists negocios_write  on negocios;
create policy negocios_write on negocios for all
  using (es_super_admin() or admin_user_id = auth.uid())
  with check (es_super_admin() or admin_user_id = auth.uid());

drop policy if exists branding_write on branding;
create policy branding_write on branding for all
  using (es_super_admin() or es_dueno(negocio_id))
  with check (es_super_admin() or es_dueno(negocio_id));

drop policy if exists features_write on features;
create policy features_write on features for all
  using (es_super_admin() or es_dueno(negocio_id))
  with check (es_super_admin() or es_dueno(negocio_id));

drop policy if exists secciones_write on secciones;
create policy secciones_write on secciones for all
  using (es_super_admin() or es_dueno(negocio_id))
  with check (es_super_admin() or es_dueno(negocio_id));

drop policy if exists productos_write on productos;
create policy productos_write on productos for all
  using (es_super_admin() or es_dueno(negocio_id))
  with check (es_super_admin() or es_dueno(negocio_id));

drop policy if exists niveles_write on niveles;
create policy niveles_write on niveles for all
  using (es_super_admin() or es_dueno(negocio_id))
  with check (es_super_admin() or es_dueno(negocio_id));

drop policy if exists beneficios_premium_write on beneficios_premium;
create policy beneficios_premium_write on beneficios_premium for all
  using (es_super_admin() or es_dueno(negocio_id))
  with check (es_super_admin() or es_dueno(negocio_id));

drop policy if exists canales_resena_write on canales_resena;
create policy canales_resena_write on canales_resena for all
  using (es_super_admin() or es_dueno(negocio_id))
  with check (es_super_admin() or es_dueno(negocio_id));

drop policy if exists resenas_externas_write on resenas_externas;
create policy resenas_externas_write on resenas_externas for all
  using (es_super_admin() or es_dueno(negocio_id))
  with check (es_super_admin() or es_dueno(negocio_id));

-- Datos sensibles/operativos: el cliente final opera via RPC security definer.
drop policy if exists usuarios_owner_read on usuarios;
drop policy if exists pedidos_owner_read on pedidos;
drop policy if exists pedidos_owner_update on pedidos;
drop policy if exists cupones_owner_read on cupones_canjeados;
create policy usuarios_owner_read on usuarios for select
  using (puede_gestionar_negocio(negocio_id));
create policy pedidos_owner_read on pedidos for select
  using (puede_gestionar_negocio(negocio_id) or puede_operar_pedidos(negocio_id));
create policy pedidos_owner_update on pedidos for update
  using (puede_gestionar_negocio(negocio_id) or es_staff_negocio(negocio_id, array['cajero','manager','owner']))
  with check (puede_gestionar_negocio(negocio_id) or es_staff_negocio(negocio_id, array['cajero','manager','owner']));
create policy cupones_owner_read on cupones_canjeados for select
  using (puede_gestionar_negocio(negocio_id));

drop policy if exists negocio_staff_read on negocio_staff;
drop policy if exists negocio_staff_write on negocio_staff;
drop policy if exists pedido_eventos_read on pedido_eventos;
drop policy if exists cortes_caja_read on cortes_caja;
drop policy if exists cortes_caja_write on cortes_caja;
create policy negocio_staff_read on negocio_staff for select
  using (puede_gestionar_negocio(negocio_id) or user_id = auth.uid());
create policy negocio_staff_write on negocio_staff for all
  using (puede_gestionar_negocio(negocio_id))
  with check (puede_gestionar_negocio(negocio_id));
create policy pedido_eventos_read on pedido_eventos for select
  using (puede_gestionar_negocio(negocio_id) or puede_operar_pedidos(negocio_id));
create policy cortes_caja_read on cortes_caja for select
  using (puede_gestionar_negocio(negocio_id) or es_staff_negocio(negocio_id, array['cajero','manager','owner']));
create policy cortes_caja_write on cortes_caja for all
  using (puede_gestionar_negocio(negocio_id) or es_staff_negocio(negocio_id, array['cajero','manager','owner']))
  with check (puede_gestionar_negocio(negocio_id) or es_staff_negocio(negocio_id, array['cajero','manager','owner']));

-- El negocio puede leer sus datos premium; el cliente solo inserta/consulta via RPC.
drop policy if exists visitas_clientes_public_read on visitas_clientes;
drop policy if exists visitas_clientes_public_insert on visitas_clientes;
drop policy if exists nps_respuestas_public_read on nps_respuestas;
drop policy if exists nps_respuestas_public_insert on nps_respuestas;
drop policy if exists acciones_resena_public_read on acciones_resena;
drop policy if exists acciones_resena_public_insert on acciones_resena;
drop policy if exists visitas_clientes_owner_read on visitas_clientes;
drop policy if exists nps_respuestas_owner_read on nps_respuestas;
drop policy if exists nps_respuestas_owner_update on nps_respuestas;
drop policy if exists acciones_resena_owner_read on acciones_resena;
drop policy if exists beneficio_redenciones_read on beneficio_redenciones;
drop policy if exists beneficio_redenciones_update on beneficio_redenciones;
create policy visitas_clientes_owner_read on visitas_clientes for select
  using (puede_gestionar_negocio(negocio_id));
create policy nps_respuestas_owner_read on nps_respuestas for select
  using (puede_gestionar_negocio(negocio_id));
create policy nps_respuestas_owner_update on nps_respuestas for update
  using (puede_gestionar_negocio(negocio_id))
  with check (puede_gestionar_negocio(negocio_id));
create policy acciones_resena_owner_read on acciones_resena for select
  using (puede_gestionar_negocio(negocio_id));
create policy beneficio_redenciones_read on beneficio_redenciones for select
  using (puede_gestionar_negocio(negocio_id) or puede_operar_pedidos(negocio_id));
create policy beneficio_redenciones_update on beneficio_redenciones for update
  using (puede_gestionar_negocio(negocio_id) or es_staff_negocio(negocio_id, array['mesero','cajero','manager','owner']))
  with check (puede_gestionar_negocio(negocio_id) or es_staff_negocio(negocio_id, array['mesero','cajero','manager','owner']));

-- Perfiles: cada quien lee el suyo; super admin lee todos
drop policy if exists perfiles_read on perfiles;
create policy perfiles_read on perfiles for select
  using (user_id = auth.uid() or es_super_admin());
drop policy if exists perfiles_admin_write on perfiles;
create policy perfiles_admin_write on perfiles for all
  using (es_super_admin()) with check (es_super_admin());

-- ── 12. STORAGE (imagenes de logos y productos) ─────────────
insert into storage.buckets (id, name, public)
values ('menuvibes', 'menuvibes', true)
on conflict (id) do nothing;

drop policy if exists menuvibes_public_read on storage.objects;
create policy menuvibes_public_read on storage.objects
  for select using (
    bucket_id = 'menuvibes'
    and (
      exists (select 1 from negocios where slug = split_part(name, '/', 1) and estado = 'publicado')
      or es_super_admin()
      or exists (select 1 from negocios where slug = split_part(name, '/', 1) and admin_user_id = auth.uid())
    )
  );

drop policy if exists menuvibes_auth_write on storage.objects;
create policy menuvibes_auth_write on storage.objects
  for insert with check (
    bucket_id = 'menuvibes'
    and (
      es_super_admin()
      or exists (select 1 from negocios where slug = split_part(name, '/', 1) and admin_user_id = auth.uid())
    )
  );

drop policy if exists menuvibes_auth_update on storage.objects;
create policy menuvibes_auth_update on storage.objects
  for update using (
    bucket_id = 'menuvibes'
    and (
      es_super_admin()
      or exists (select 1 from negocios where slug = split_part(name, '/', 1) and admin_user_id = auth.uid())
    )
  );

drop policy if exists menuvibes_auth_delete on storage.objects;
create policy menuvibes_auth_delete on storage.objects
  for delete using (
    bucket_id = 'menuvibes'
    and (
      es_super_admin()
      or exists (select 1 from negocios where slug = split_part(name, '/', 1) and admin_user_id = auth.uid())
    )
  );

-- ── 13. RPC PUBLICOS CONTROLADOS PARA CLIENTES FINALES ───────
create or replace function cliente_register(
  p_negocio_id uuid,
  p_nickname text,
  p_password_hash text
) returns table(id uuid, nickname text)
language plpgsql security definer set search_path = public as $$
declare
  v_nick text := lower(trim(p_nickname));
  v_id uuid;
begin
  if not negocio_publicado(p_negocio_id) then
    raise exception 'Negocio no publicado';
  end if;
  if length(v_nick) < 3 or length(coalesce(p_password_hash, '')) < 32 then
    raise exception 'Datos invalidos';
  end if;

  insert into usuarios (nickname, password_hash, negocio_id)
  values (v_nick, p_password_hash, p_negocio_id)
  returning usuarios.id into v_id;

  return query select v_id, v_nick;
end;
$$;

create or replace function cliente_login(
  p_negocio_id uuid,
  p_nickname text,
  p_password_hash text
) returns table(id uuid, nickname text)
language sql stable security definer set search_path = public as $$
  select u.id, u.nickname
  from usuarios u
  where u.negocio_id = p_negocio_id
    and u.nickname = lower(trim(p_nickname))
    and u.password_hash = p_password_hash
    and negocio_publicado(p_negocio_id)
  limit 1;
$$;

create or replace function cliente_resumen(
  p_negocio_id uuid,
  p_usuario_id uuid
) returns table(pedidos_count int, visitas_count int, cupones text[])
language sql stable security definer set search_path = public as $$
  select
    (select count(*)::int from pedidos p where p.negocio_id = p_negocio_id and p.usuario_id = p_usuario_id),
    (select count(*)::int from visitas_clientes v where v.negocio_id = p_negocio_id and v.usuario_id = p_usuario_id),
    coalesce(
      (select array_agg(c.cupon_codigo) from cupones_canjeados c where c.negocio_id = p_negocio_id and c.usuario_id = p_usuario_id),
      array[]::text[]
    )
  where negocio_publicado(p_negocio_id);
$$;

create or replace function emitir_redencion_beneficio(
  p_negocio_id uuid,
  p_usuario_id uuid,
  p_nickname text,
  p_beneficio_id uuid,
  p_origen text default 'premium',
  p_visita_id uuid default null,
  p_nps_id uuid default null,
  p_accion_resena_id uuid default null
) returns table(id uuid, codigo text)
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_codigo text;
  v_try int;
begin
  if p_beneficio_id is null then
    return;
  end if;

  if not exists (
    select 1
    from beneficios_premium b
    where b.id = p_beneficio_id
      and b.negocio_id = p_negocio_id
      and b.activo = true
  ) then
    return;
  end if;

  for v_try in 1..16 loop
    v_codigo := 'BEN-' || upper(substr(encode(extensions.gen_random_bytes(4), 'hex'), 1, 6));
    exit when not exists (
      select 1
      from beneficio_redenciones r
      where r.negocio_id = p_negocio_id
        and lower(r.codigo) = lower(v_codigo)
    );
  end loop;

  insert into beneficio_redenciones (
    negocio_id, beneficio_id, usuario_id, visita_id, nps_id, accion_resena_id,
    nickname, origen, codigo, estado, expires_at
  )
  values (
    p_negocio_id, p_beneficio_id, p_usuario_id, p_visita_id, p_nps_id, p_accion_resena_id,
    p_nickname, coalesce(nullif(p_origen, ''), 'premium'), v_codigo, 'emitido', now() + interval '30 days'
  )
  returning beneficio_redenciones.id into v_id;

  return query select v_id, v_codigo;
end;
$$;

revoke all on function emitir_redencion_beneficio(uuid, uuid, text, uuid, text, uuid, uuid, uuid) from public;

drop function if exists registrar_visita_cliente(uuid, uuid, text, uuid);
create or replace function registrar_visita_cliente(
  p_negocio_id uuid,
  p_usuario_id uuid,
  p_nickname text,
  p_beneficio_id uuid default null
) returns table(
  id uuid,
  already_registered boolean,
  redencion_codigo text,
  beneficio_nombre text,
  beneficio_descripcion text,
  descuento_pct int,
  puntos int
)
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_redencion_codigo text;
  v_beneficio_nombre text;
  v_beneficio_descripcion text;
  v_descuento_pct int;
  v_puntos int;
begin
  if not negocio_publicado(p_negocio_id) then
    raise exception 'Negocio no publicado';
  end if;
  if not exists (select 1 from usuarios u where u.id = p_usuario_id and u.negocio_id = p_negocio_id) then
    raise exception 'Cliente invalido';
  end if;

  select v.id into v_id
  from visitas_clientes v
  where v.negocio_id = p_negocio_id
    and v.usuario_id = p_usuario_id
    and v.created_at >= date_trunc('day', now())
  order by v.created_at desc
  limit 1;

  if v_id is not null then
    return query select v_id, true, null::text, null::text, null::text, null::int, null::int;
    return;
  end if;

  insert into visitas_clientes (negocio_id, usuario_id, nickname, beneficio_id, origen)
  values (p_negocio_id, p_usuario_id, p_nickname, p_beneficio_id, 'menu')
  returning visitas_clientes.id into v_id;

  if p_beneficio_id is not null then
    select b.nombre, b.descripcion, b.descuento_pct, b.puntos
      into v_beneficio_nombre, v_beneficio_descripcion, v_descuento_pct, v_puntos
    from beneficios_premium b
    where b.id = p_beneficio_id
      and b.negocio_id = p_negocio_id
      and b.activo = true;

    if v_beneficio_nombre is not null then
      select r.codigo into v_redencion_codigo
      from emitir_redencion_beneficio(
        p_negocio_id, p_usuario_id, p_nickname, p_beneficio_id, 'visita', v_id, null, null
      ) r
      limit 1;
    end if;
  end if;

  return query select v_id, false, v_redencion_codigo, v_beneficio_nombre, v_beneficio_descripcion, v_descuento_pct, v_puntos;
end;
$$;

drop function if exists responder_nps_cliente(uuid, uuid, uuid, text, int, text, uuid);
create or replace function responder_nps_cliente(
  p_negocio_id uuid,
  p_visita_id uuid,
  p_usuario_id uuid,
  p_nickname text,
  p_score int,
  p_comentario text default '',
  p_beneficio_id uuid default null
) returns table(
  id uuid,
  already_answered boolean,
  redencion_codigo text,
  beneficio_nombre text,
  beneficio_descripcion text,
  descuento_pct int,
  puntos int
)
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_redencion_codigo text;
  v_beneficio_nombre text;
  v_beneficio_descripcion text;
  v_descuento_pct int;
  v_puntos int;
begin
  if not negocio_publicado(p_negocio_id) then
    raise exception 'Negocio no publicado';
  end if;
  if p_score < 0 or p_score > 10 then
    raise exception 'NPS invalido';
  end if;
  if not exists (
    select 1 from visitas_clientes v
    where v.id = p_visita_id and v.negocio_id = p_negocio_id and v.usuario_id = p_usuario_id
  ) then
    raise exception 'Visita invalida';
  end if;

  select n.id into v_id
  from nps_respuestas n
  where n.visita_id = p_visita_id
  limit 1;

  if v_id is not null then
    return query select v_id, true, null::text, null::text, null::text, null::int, null::int;
    return;
  end if;

  insert into nps_respuestas (negocio_id, visita_id, usuario_id, nickname, score, comentario, beneficio_id)
  values (p_negocio_id, p_visita_id, p_usuario_id, p_nickname, p_score, p_comentario, p_beneficio_id)
  returning nps_respuestas.id into v_id;

  if p_beneficio_id is not null then
    select b.nombre, b.descripcion, b.descuento_pct, b.puntos
      into v_beneficio_nombre, v_beneficio_descripcion, v_descuento_pct, v_puntos
    from beneficios_premium b
    where b.id = p_beneficio_id
      and b.negocio_id = p_negocio_id
      and b.activo = true;

    if v_beneficio_nombre is not null then
      select r.codigo into v_redencion_codigo
      from emitir_redencion_beneficio(
        p_negocio_id, p_usuario_id, p_nickname, p_beneficio_id, 'nps', p_visita_id, v_id, null
      ) r
      limit 1;
    end if;
  end if;

  return query select v_id, false, v_redencion_codigo, v_beneficio_nombre, v_beneficio_descripcion, v_descuento_pct, v_puntos;
end;
$$;

create or replace function registrar_accion_resena_cliente(
  p_negocio_id uuid,
  p_visita_id uuid,
  p_usuario_id uuid,
  p_nickname text,
  p_canal_id uuid,
  p_plataforma text,
  p_accion text default 'click',
  p_beneficio_id uuid default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  if not negocio_publicado(p_negocio_id) then
    raise exception 'Negocio no publicado';
  end if;
  if not exists (select 1 from canales_resena c where c.id = p_canal_id and c.negocio_id = p_negocio_id and c.activo = true) then
    raise exception 'Canal invalido';
  end if;

  insert into acciones_resena (negocio_id, visita_id, usuario_id, nickname, canal_id, plataforma, accion, beneficio_id)
  values (p_negocio_id, p_visita_id, p_usuario_id, p_nickname, p_canal_id, p_plataforma, p_accion, p_beneficio_id)
  returning acciones_resena.id into v_id;

  return v_id;
end;
$$;

create or replace function redimir_beneficio_codigo(
  p_negocio_id uuid,
  p_codigo text,
  p_notas text default null
) returns table(
  id uuid,
  codigo text,
  estado text,
  beneficio_nombre text,
  nickname text,
  redimido_at timestamptz
)
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_estado text;
  v_expires_at timestamptz;
begin
  if not puede_gestionar_negocio(p_negocio_id)
     and not es_staff_negocio(p_negocio_id, array['mesero','cajero','manager','owner']) then
    raise exception 'No autorizado';
  end if;

  select r.id, r.estado, r.expires_at into v_id, v_estado, v_expires_at
  from beneficio_redenciones r
  where r.negocio_id = p_negocio_id
    and lower(r.codigo) = lower(trim(p_codigo))
  limit 1;

  if v_id is null then
    raise exception 'Codigo no encontrado';
  end if;

  if v_estado <> 'emitido' then
    raise exception 'Codigo ya usado o inactivo';
  end if;

  if v_expires_at is not null and v_expires_at < now() then
    update beneficio_redenciones
    set estado = 'expirado'
    where beneficio_redenciones.id = v_id;
    raise exception 'Codigo expirado';
  end if;

  update beneficio_redenciones
  set estado = 'redimido',
      redimido_por = auth.uid(),
      redimido_at = now(),
      notas = nullif(p_notas, '')
  where beneficio_redenciones.id = v_id;

  return query
  select r.id, r.codigo, r.estado, coalesce(b.nombre, 'Beneficio') as beneficio_nombre,
         r.nickname, r.redimido_at
  from beneficio_redenciones r
  left join beneficios_premium b on b.id = r.beneficio_id
  where r.id = v_id;
end;
$$;

drop function if exists crear_pedido_cliente(uuid, uuid, text, jsonb, int, text, int);
drop function if exists crear_pedido_cliente(uuid, uuid, text, jsonb, int, text, int, text, text, text, text, text, text, jsonb);
create or replace function crear_pedido_cliente(
  p_negocio_id uuid,
  p_usuario_id uuid,
  p_nickname text,
  p_items jsonb,
  p_total int,
  p_cupon_aplicado text default null,
  p_descuento_pct int default 0,
  p_tipo_servicio text default 'mesa',
  p_mesa text default null,
  p_direccion_entrega text default null,
  p_hora_pickup text default null,
  p_cliente_nombre text default null,
  p_cliente_telefono text default null,
  p_contexto jsonb default '{}'::jsonb
) returns table(id uuid, codigo_confirmacion text, qr_token text)
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_codigo text;
  v_token text;
  v_estado text;
  v_try int;
begin
  if not negocio_publicado(p_negocio_id) then
    raise exception 'Negocio no publicado';
  end if;
  if p_usuario_id is not null and not exists (select 1 from usuarios u where u.id = p_usuario_id and u.negocio_id = p_negocio_id) then
    raise exception 'Cliente invalido';
  end if;

  v_token := encode(extensions.gen_random_bytes(24), 'hex');
  v_estado := case
    when coalesce(nullif(p_tipo_servicio, ''), 'mesa') = 'mesa' then 'pendiente_confirmacion'
    else 'pendiente'
  end;

  for v_try in 1..12 loop
    v_codigo := 'MV-' || lpad((floor(random() * 1000000))::int::text, 6, '0');
    exit when not exists (
      select 1 from pedidos p
      where p.negocio_id = p_negocio_id and p.codigo_confirmacion = v_codigo
    );
  end loop;

  insert into pedidos (
    negocio_id, usuario_id, nickname, items, total, cupon_aplicado, descuento_pct,
    tipo_servicio, mesa, direccion_entrega, hora_pickup, cliente_nombre, cliente_telefono, contexto,
    estado, codigo_confirmacion, qr_token_hash, updated_at
  )
  values (
    p_negocio_id, p_usuario_id, p_nickname, p_items, p_total, p_cupon_aplicado, p_descuento_pct,
    coalesce(nullif(p_tipo_servicio, ''), 'mesa'), nullif(p_mesa, ''), nullif(p_direccion_entrega, ''),
    nullif(p_hora_pickup, ''), nullif(p_cliente_nombre, ''), nullif(p_cliente_telefono, ''),
    coalesce(p_contexto, '{}'::jsonb),
    v_estado, v_codigo, encode(extensions.digest(v_token, 'sha256'), 'hex'), now()
  )
  returning pedidos.id into v_id;

  insert into pedido_eventos (negocio_id, pedido_id, evento, estado_nuevo, metadata)
  values (
    p_negocio_id,
    v_id,
    'pedido_creado',
    v_estado,
    jsonb_build_object('tipo_servicio', coalesce(nullif(p_tipo_servicio, ''), 'mesa'))
  );

  if p_usuario_id is not null and p_cupon_aplicado is not null and p_cupon_aplicado <> '' then
    insert into cupones_canjeados (negocio_id, usuario_id, nickname, cupon_codigo, descuento_pct, pedido_id)
    values (p_negocio_id, p_usuario_id, p_nickname, p_cupon_aplicado, p_descuento_pct, v_id);
  end if;

  return query select v_id, v_codigo, v_token;
end;
$$;

create or replace function leer_pedido_qr(
  p_negocio_id uuid,
  p_codigo_confirmacion text,
  p_qr_token text
) returns table(
  id uuid,
  codigo_confirmacion text,
  estado text,
  tipo_servicio text,
  cliente_nombre text,
  cliente_telefono text,
  items jsonb,
  total int,
  created_at timestamptz,
  confirmado_at timestamptz
)
language plpgsql security definer set search_path = public as $$
begin
  if not puede_operar_pedidos(p_negocio_id) then
    raise exception 'No autorizado';
  end if;

  return query
  select p.id, p.codigo_confirmacion, p.estado, p.tipo_servicio, p.cliente_nombre, p.cliente_telefono,
         p.items, p.total, p.created_at, p.confirmado_at
  from pedidos p
  where p.negocio_id = p_negocio_id
    and p.codigo_confirmacion = p_codigo_confirmacion
    and p.qr_token_hash = encode(extensions.digest(p_qr_token, 'sha256'), 'hex')
  limit 1;
end;
$$;

create or replace function confirmar_pedido_qr(
  p_negocio_id uuid,
  p_codigo_confirmacion text,
  p_qr_token text
) returns table(id uuid, estado text, confirmado_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_estado text;
begin
  if not es_staff_negocio(p_negocio_id, array['mesero','cajero','manager','owner']) and not puede_gestionar_negocio(p_negocio_id) then
    raise exception 'No autorizado';
  end if;

  select p.id, p.estado into v_id, v_estado
  from pedidos p
  where p.negocio_id = p_negocio_id
    and p.codigo_confirmacion = p_codigo_confirmacion
    and p.qr_token_hash = encode(extensions.digest(p_qr_token, 'sha256'), 'hex')
  limit 1;

  if v_id is null then
    raise exception 'Pedido no encontrado';
  end if;

  update pedidos p
  set estado = 'confirmado',
      confirmado_por = auth.uid(),
      confirmado_at = coalesce(p.confirmado_at, now()),
      updated_at = now()
  where p.id = v_id;

  insert into pedido_eventos (negocio_id, pedido_id, actor_user_id, evento, estado_anterior, estado_nuevo)
  values (p_negocio_id, v_id, auth.uid(), 'pedido_confirmado_qr', v_estado, 'confirmado');

  return query select p.id, p.estado, p.confirmado_at
  from pedidos p
  where p.id = v_id;
end;
$$;

create or replace function cambiar_estado_pedido(
  p_pedido_id uuid,
  p_estado text,
  p_metodo_pago text default null
) returns table(id uuid, estado text, updated_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare
  v_negocio_id uuid;
  v_estado text;
begin
  select p.negocio_id, p.estado into v_negocio_id, v_estado
  from pedidos p
  where p.id = p_pedido_id;

  if v_negocio_id is null then
    raise exception 'Pedido no encontrado';
  end if;
  if not puede_operar_pedidos(v_negocio_id) then
    raise exception 'No autorizado';
  end if;
  if p_estado not in ('pendiente','pendiente_confirmacion','confirmado','en_preparacion','listo','entregado','cancelado') then
    raise exception 'Estado invalido';
  end if;

  update pedidos p
  set estado = p_estado,
      metodo_pago = coalesce(nullif(p_metodo_pago, ''), p.metodo_pago),
      cancelado_at = case when p_estado = 'cancelado' then coalesce(p.cancelado_at, now()) else p.cancelado_at end,
      updated_at = now()
  where p.id = p_pedido_id;

  insert into pedido_eventos (negocio_id, pedido_id, actor_user_id, evento, estado_anterior, estado_nuevo, metadata)
  values (v_negocio_id, p_pedido_id, auth.uid(), 'pedido_estado_actualizado', v_estado, p_estado,
          jsonb_build_object('metodo_pago', p_metodo_pago));

  return query select p.id, p.estado, p.updated_at
  from pedidos p
  where p.id = p_pedido_id;
end;
$$;

create or replace function vincular_staff_por_email(
  p_negocio_id uuid,
  p_email text,
  p_rol text default 'mesero',
  p_nombre text default null
) returns uuid
language plpgsql security definer set search_path = public, auth as $$
declare
  v_user_id uuid;
  v_id uuid;
begin
  if not puede_gestionar_negocio(p_negocio_id) then
    raise exception 'No autorizado';
  end if;
  if p_rol not in ('mesero','cocina','cajero','manager','owner') then
    raise exception 'Rol invalido';
  end if;

  select u.id into v_user_id
  from auth.users u
  where lower(u.email) = lower(p_email)
    and u.deleted_at is null
  limit 1;

  if v_user_id is null then
    raise exception 'Usuario auth no encontrado';
  end if;

  insert into negocio_staff (negocio_id, user_id, rol, nombre, activo)
  values (p_negocio_id, v_user_id, p_rol, coalesce(nullif(p_nombre, ''), p_email), true)
  on conflict (negocio_id, user_id)
  do update set rol = excluded.rol, nombre = excluded.nombre, activo = true
  returning negocio_staff.id into v_id;

  return v_id;
end;
$$;

grant execute on function cliente_register(uuid, text, text) to anon, authenticated;
grant execute on function cliente_login(uuid, text, text) to anon, authenticated;
grant execute on function cliente_resumen(uuid, uuid) to anon, authenticated;
grant execute on function registrar_visita_cliente(uuid, uuid, text, uuid) to anon, authenticated;
grant execute on function responder_nps_cliente(uuid, uuid, uuid, text, int, text, uuid) to anon, authenticated;
grant execute on function registrar_accion_resena_cliente(uuid, uuid, uuid, text, uuid, text, text, uuid) to anon, authenticated;
grant execute on function redimir_beneficio_codigo(uuid, text, text) to authenticated;
grant execute on function crear_pedido_cliente(uuid, uuid, text, jsonb, int, text, int, text, text, text, text, text, text, jsonb) to anon, authenticated;
grant execute on function leer_pedido_qr(uuid, text, text) to authenticated;
grant execute on function confirmar_pedido_qr(uuid, text, text) to authenticated;
grant execute on function cambiar_estado_pedido(uuid, text, text) to authenticated;
grant execute on function vincular_staff_por_email(uuid, text, text, text) to authenticated;

-- ============================================================
--  DESPUES DE CORRER ESTO:
--  1. Crea tu usuario en Authentication > Users (o usa el actual)
--  2. Hazte super admin:
--     insert into perfiles (user_id, rol, nombre)
--     values ('<TU-USER-UUID>', 'super_admin', 'Roger')
--     on conflict (user_id) do update set rol = 'super_admin';
--  3. Abre dashboard.html y crea tu primer negocio.
-- ============================================================


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
