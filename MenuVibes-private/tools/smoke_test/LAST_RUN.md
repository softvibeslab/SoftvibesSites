# Ultima corrida smoke test

Fecha: 2026-07-10

## Estado final

Resultado final: **OK**.

- Supabase vivo actualizado con `MenuVibes/whitelabel/schema.sql`.
- RLS endurecido: la anon key ya no ve negocios en `borrador`.
- RLS sensible: la anon key no recibio filas de `usuarios`, `pedidos` ni
  `cupones_canjeados`.
- Tablas premium creadas y visibles segun politica publica:
  - `beneficios_premium`
  - `canales_resena`
  - `visitas_clientes`
  - `nps_respuestas`
  - `acciones_resena`
- RPC premium disponibles en PostgREST:
  - `cliente_register`
  - `cliente_login`
  - `cliente_resumen`
  - `registrar_visita_cliente`
  - `responder_nps_cliente`
  - `registrar_accion_resena_cliente`
  - `crear_pedido_cliente`
- Frontend actualizado en `/var/www/menuvibes`.

## Comandos validados

Lectura contra tenant real:

```bash
node MenuVibes-private/tools/smoke_test/smoke-test.mjs --slug localito
```

Resultado: `25 ok, 0 warn, 0 fail, 0 skip`.

Prueba completa contra tenant demo:

```bash
node MenuVibes-private/tools/smoke_test/smoke-test.mjs --slug demo-premium --write --write-order
```

Resultado: `31 ok, 0 warn, 0 fail, 0 skip`.

## Tenant demo

Tenant creado/publicado:

- Slug: `demo-premium`
- Nombre: `MenuVibes Demo Premium`
- URL: `https://menu.rovicrm.com/menu.html?n=demo-premium`

Incluye:

- Features premium activadas.
- 3 beneficios premium demo.
- 2 canales de resena demo.
- 1 seccion y 2 productos demo.

## Backups en VPS

- Schema antes de aplicar cambios:
  `/root/backups/menuvibes/schema-before-20260710-083526.sql`
- Frontend antes de desplegar:
  `/root/backups/menuvibes/frontend-20260710-084043/`

## Nota tecnica

Durante la prueba se encontro y corrigio una referencia ambigua `id` en los RPC
PL/pgSQL. El fix quedo en `MenuVibes/whitelabel/schema.sql` y fue reaplicado en
Supabase vivo.
