#!/usr/bin/env bash
set -euo pipefail

if [[ -f "vapi/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "vapi/.env"
  set +a
fi

ASSISTANT_ID="${VAPI_ASSISTANT_ID:-944b05bf-4dd4-4e07-b979-40e4bfccc9bb}"
QUERY_TOOL_ID="${VAPI_QUERY_TOOL_ID:-${1:-}}"
PROMPT_FILE="${PROMPT_FILE:-vapi/assistant-prompt.md}"
ASSISTANT_NAME="${ASSISTANT_NAME:-Colegios 875 - Asesor de Ventas}"
FIRST_MESSAGE="${FIRST_MESSAGE:-Hola, gracias por llamar a Colegios 875. Soy el asistente de Aura Residences. ¿Te interesa conocer departamentos, garden houses o agendar un recorrido VR en oficinas?}"
TRANSCRIBER_LANGUAGE="${TRANSCRIBER_LANGUAGE:-es}"
OUTPUT_FILE="${OUTPUT_FILE:-vapi/.last-assistant-update.json}"

if [[ -z "${VAPI_API_KEY:-}" ]]; then
  echo "Falta VAPI_API_KEY. Ejemplo: export VAPI_API_KEY='tu_llave_privada'" >&2
  exit 1
fi

if [[ -z "$QUERY_TOOL_ID" ]]; then
  echo "Falta VAPI_QUERY_TOOL_ID o pásalo como argumento." >&2
  echo "Ejemplo: VAPI_QUERY_TOOL_ID='tool_id' bash vapi/update-existing-assistant.sh" >&2
  exit 1
fi

if [[ ! -f "$PROMPT_FILE" ]]; then
  echo "No existe el prompt: $PROMPT_FILE" >&2
  exit 1
fi

assistant_response="$(mktemp)"
patch_payload="$(mktemp)"
patch_response="$(mktemp)"
trap 'rm -f "$assistant_response" "$patch_payload" "$patch_response"' EXIT

echo "Leyendo assistant existente: $ASSISTANT_ID"
curl -sS --fail --location "https://api.vapi.ai/assistant/$ASSISTANT_ID" \
  --header "Authorization: Bearer $VAPI_API_KEY" > "$assistant_response"

node - "$assistant_response" "$patch_payload" "$PROMPT_FILE" "$QUERY_TOOL_ID" "$FIRST_MESSAGE" "$ASSISTANT_NAME" "$TRANSCRIBER_LANGUAGE" <<'NODE'
const fs = require("fs");
const [assistantPath, outPath, promptPath, queryToolId, firstMessage, assistantName, transcriberLanguage] = process.argv.slice(2);
const assistant = JSON.parse(fs.readFileSync(assistantPath, "utf8"));
const prompt = fs.readFileSync(promptPath, "utf8");
const model = assistant.model && typeof assistant.model === "object" ? { ...assistant.model } : {};
const transcriber = assistant.transcriber && typeof assistant.transcriber === "object"
  ? { ...assistant.transcriber, language: transcriberLanguage }
  : { provider: "deepgram", model: "nova-3", language: transcriberLanguage };

model.provider = model.provider || "openai";
model.model = model.model || "gpt-4o";
model.temperature = model.temperature ?? 0.2;

const existingMessages = Array.isArray(model.messages) ? model.messages : [];
const nonSystemMessages = existingMessages.filter((message) => message.role !== "system");
model.messages = [{ role: "system", content: prompt }, ...nonSystemMessages];

const toolIds = Array.isArray(model.toolIds) ? [...model.toolIds] : [];
if (!toolIds.includes(queryToolId)) toolIds.push(queryToolId);
model.toolIds = toolIds;

fs.writeFileSync(outPath, JSON.stringify({
  name: assistantName,
  firstMessage,
  model,
  transcriber
}, null, 2));
NODE

echo "Actualizando assistant con prompt y Query Tool..."
curl -sS --fail --location --request PATCH "https://api.vapi.ai/assistant/$ASSISTANT_ID" \
  --header "Content-Type: application/json" \
  --header "Authorization: Bearer $VAPI_API_KEY" \
  --data @"$patch_payload" > "$patch_response"

cp "$patch_response" "$OUTPUT_FILE"
echo "Assistant actualizado. Respuesta guardada en: $OUTPUT_FILE"
node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); console.log(JSON.stringify({id:data.id,name:data.name,updatedAt:data.updatedAt},null,2));" "$patch_response"
