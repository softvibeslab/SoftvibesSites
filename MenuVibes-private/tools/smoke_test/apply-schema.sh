#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
SCHEMA_FILE="${SCHEMA_FILE:-$ROOT/MenuVibes/whitelabel/schema.sql}"
SMOKE_SCRIPT="$ROOT/MenuVibes-private/tools/smoke_test/smoke-test.mjs"
SLUG="${SLUG:-localito}"

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  cat >&2 <<'EOF'
Falta SUPABASE_DB_URL.

Pasa una conexion Postgres administrativa, por ejemplo:

SUPABASE_DB_URL='postgresql://postgres:<password>@<host>:5432/postgres?sslmode=require' \
MenuVibes-private/tools/smoke_test/apply-schema.sh

La anon key o service_role key no sirven para aplicar DDL/RLS/RPC por REST.
EOF
  exit 2
fi

if [[ ! -f "$SCHEMA_FILE" ]]; then
  echo "No existe schema: $SCHEMA_FILE" >&2
  exit 2
fi

echo "Applying schema: $SCHEMA_FILE"

if command -v psql >/dev/null 2>&1; then
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "$SCHEMA_FILE"
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -c "notify pgrst, 'reload schema';"
elif command -v docker >/dev/null 2>&1; then
  docker run --rm \
    -e "SUPABASE_DB_URL=$SUPABASE_DB_URL" \
    -v "$SCHEMA_FILE:/schema.sql:ro" \
    postgres:16-alpine \
    sh -lc 'psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f /schema.sql && psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -c "notify pgrst, '\''reload schema'\'';"'
else
  echo "No encontre psql ni docker para aplicar el schema." >&2
  exit 2
fi

echo
echo "Running smoke test for slug=$SLUG"
node "$SMOKE_SCRIPT" --slug "$SLUG"
