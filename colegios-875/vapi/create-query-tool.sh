#!/usr/bin/env bash
set -euo pipefail

if [[ -f "vapi/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "vapi/.env"
  set +a
fi

KB_FILE="${1:-vapi/knowledge-base/colegios-875-sales-kb.md}"
TOOL_NAME="${TOOL_NAME:-colegios-875-search}"
KB_NAME="${KB_NAME:-colegios-875-sales-kb}"
KB_DESCRIPTION="${KB_DESCRIPTION:-Información oficial de ventas de Colegios 875: proyecto, tipologías, inclusión, accesibilidad, recorrido 360, realidad aumentada, recorrido VR y contacto.}"
OUTPUT_FILE="${OUTPUT_FILE:-vapi/.last-query-tool.json}"

if [[ -z "${VAPI_API_KEY:-}" ]]; then
  echo "Falta VAPI_API_KEY. Ejemplo: export VAPI_API_KEY='tu_llave_privada'" >&2
  exit 1
fi

if [[ ! -f "$KB_FILE" ]]; then
  echo "No existe la base de conocimiento: $KB_FILE" >&2
  exit 1
fi

upload_response="$(mktemp)"
tool_payload="$(mktemp)"
tool_response="$(mktemp)"
trap 'rm -f "$upload_response" "$tool_payload" "$tool_response"' EXIT

echo "Subiendo base de conocimiento: $KB_FILE"
curl -sS -X POST "https://api.vapi.ai/file" \
  -H "Authorization: Bearer $VAPI_API_KEY" \
  -F "file=@${KB_FILE};type=text/markdown" > "$upload_response"

file_id="$(node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); if(!data.id){ console.error(JSON.stringify(data,null,2)); process.exit(1); } console.log(data.id)" "$upload_response")"
echo "File ID: $file_id"

node -e '
const fs = require("fs");
const [out, type, toolName, kbName, description, fileId] = process.argv.slice(1);
fs.writeFileSync(out, JSON.stringify({
  type,
  function: { name: toolName },
  knowledgeBases: [{
    provider: "google",
    name: kbName,
    description,
    fileIds: [fileId]
  }]
}, null, 2));
' "$tool_payload" "query" "$TOOL_NAME" "$KB_NAME" "$KB_DESCRIPTION" "$file_id"

echo "Creando Query Tool: $TOOL_NAME"
curl -sS --location "https://api.vapi.ai/tool/" \
  --header "Content-Type: application/json" \
  --header "Authorization: Bearer $VAPI_API_KEY" \
  --data @"$tool_payload" > "$tool_response"

echo "Respuesta de Vapi:"
node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); console.log(JSON.stringify(data,null,2));" "$tool_response"
cp "$tool_response" "$OUTPUT_FILE"

tool_id="$(node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); if(data.id) console.log(data.id);" "$tool_response")"
if [[ -n "$tool_id" ]]; then
  echo
  echo "Query Tool guardado en: $OUTPUT_FILE"
  echo "Siguiente paso:"
  echo "export VAPI_QUERY_TOOL_ID=\"$tool_id\""
  echo "bash vapi/update-existing-assistant.sh"
fi
