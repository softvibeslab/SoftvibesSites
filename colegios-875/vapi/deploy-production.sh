#!/usr/bin/env bash
set -euo pipefail

if [[ -f "vapi/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "vapi/.env"
  set +a
fi

ASSISTANT_ID="${VAPI_ASSISTANT_ID:-944b05bf-4dd4-4e07-b979-40e4bfccc9bb}"

if [[ -z "${VAPI_API_KEY:-}" ]]; then
  echo "Falta VAPI_API_KEY. Crea vapi/.env con:" >&2
  echo "VAPI_API_KEY=tu_llave_privada" >&2
  echo "VAPI_ASSISTANT_ID=$ASSISTANT_ID" >&2
  exit 1
fi

echo "Deploy productivo Vapi"
echo "Assistant ID: $ASSISTANT_ID"

bash vapi/create-query-tool.sh

query_tool_id="$(node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync('vapi/.last-query-tool.json','utf8')); if(!data.id){ console.error(JSON.stringify(data,null,2)); process.exit(1); } console.log(data.id)")"

echo "Actualizando assistant con Query Tool: $query_tool_id"
VAPI_ASSISTANT_ID="$ASSISTANT_ID" VAPI_QUERY_TOOL_ID="$query_tool_id" bash vapi/update-existing-assistant.sh

echo
echo "Deploy Vapi terminado en producción."
