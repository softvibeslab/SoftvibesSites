# MenuVibes smoke test

Herramienta privada para validar que Supabase ya tiene el schema premium,
RLS endurecido y RPC publicos controlados antes de activar clientes.

## Uso rapido

Desde la raiz del workspace:

```bash
node MenuVibes-private/tools/smoke_test/smoke-test.mjs --slug localito
```

La herramienta lee `supabase_url` y `supabase_key` desde
`MenuVibes/whitelabel/menu.html`. Tambien puedes pasar:

```bash
SUPABASE_URL="https://..." SUPABASE_ANON_KEY="..." \
node MenuVibes-private/tools/smoke_test/smoke-test.mjs --slug demo-premium
```

## Prueba con escritura

Solo en tenant demo:

```bash
node MenuVibes-private/tools/smoke_test/smoke-test.mjs --slug demo-premium --write
```

Esto crea un cliente sintetico, registra una visita y contesta NPS. Si el tenant
tiene un canal de resena activo, tambien registra el click de salida. Para incluir
un pedido sintetico de total cero:

```bash
node MenuVibes-private/tools/smoke_test/smoke-test.mjs --slug demo-premium --write --write-order
```

## Que valida

- `menu.html` filtra negocios con `estado = publicado`.
- La anon key no ve negocios en borrador.
- Tablas publicas base responden.
- Tablas sensibles no exponen filas a anon.
- Tablas premium existen.
- Columnas premium existen en `features`.
- RPC premium existen en PostgREST.
- En modo `--write`, el flujo cliente visita/NPS funciona de punta a punta.

Si falla con `PGRST202` o `PGRST205`, el SQL premium no esta aplicado o
PostgREST no ha recargado el schema.

## Aplicar schema con conexion admin

Si tienes una conexion Postgres administrativa:

```bash
SUPABASE_DB_URL='postgresql://postgres:<password>@<host>:5432/postgres?sslmode=require' \
MenuVibes-private/tools/smoke_test/apply-schema.sh
```

El script aplica `MenuVibes/whitelabel/schema.sql`, recarga el schema de
PostgREST y corre el smoke test.

Nota: la anon key y la service_role key no bastan para crear tablas, funciones
o politicas por REST. Hace falta SQL Editor, Supabase CLI con acceso al proyecto
o una URL Postgres administrativa.
