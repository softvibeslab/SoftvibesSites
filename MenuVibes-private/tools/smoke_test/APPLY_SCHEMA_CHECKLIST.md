# Checklist para aplicar schema premium

Estado actual esperado antes de aplicar SQL: la anon key puede conectar a
Supabase, pero no puede crear tablas, funciones ni politicas. Para aplicar el
schema hace falta acceso de owner en Supabase SQL Editor, service tooling o una
conexion Postgres administrativa.

## Pasos

1. Abre Supabase SQL Editor del proyecto `https://supabase.rovicrm.com`.
2. Si la instalacion es nueva, corre primero `MenuVibes/whitelabel/base-tables.sql`.
3. Corre completo `MenuVibes/whitelabel/schema.sql`.
4. Si PostgREST no detecta funciones/tablas nuevas despues de unos segundos, corre:

```sql
notify pgrst, 'reload schema';
```

5. Valida desde este workspace:

```bash
node MenuVibes-private/tools/smoke_test/smoke-test.mjs --slug localito
```

Alternativa si tienes conexion Postgres administrativa:

```bash
SUPABASE_DB_URL='postgresql://postgres:<password>@<host>:5432/postgres?sslmode=require' \
MenuVibes-private/tools/smoke_test/apply-schema.sh
```

6. Crea o usa un tenant demo publicado con features premium activadas y valida:

```bash
node MenuVibes-private/tools/smoke_test/smoke-test.mjs --slug demo-premium --write
```

## Resultado aceptable antes de vender

- Cero `FAIL` en modo lectura.
- Cero `FAIL` en modo `--write` contra tenant demo.
- La anon key no lista negocios `borrador`.
- La anon key no lee filas de `usuarios`, `pedidos`, `cupones_canjeados`,
  `visitas_clientes`, `nps_respuestas` ni `acciones_resena`.
- Los RPC `cliente_register`, `cliente_login`, `cliente_resumen`,
  `registrar_visita_cliente`, `responder_nps_cliente`,
  `registrar_accion_resena_cliente` y `crear_pedido_cliente` aparecen en
  PostgREST.
