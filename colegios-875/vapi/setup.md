# Setup Vapi - Colegios 875

## Archivos incluidos
- `assistant-prompt.md`: prompt maestro para el agente de ventas.
- `knowledge-base/colegios-875-sales-kb.md`: base de conocimiento lista para subir a Vapi.
- `assistant-config.template.json`: configuración base del assistant.

## Flujo recomendado en Vapi

### Opción rápida por CLI
Si ya tienes tu llave privada de Vapi como variable de entorno, corre:
```bash
export VAPI_API_KEY="TU_API_KEY_PRIVADA"
bash vapi/create-query-tool.sh
```

Esto sube `vapi/knowledge-base/colegios-875-sales-kb.md` y crea el Query Tool `colegios-875-search`. Después copia el `id` del tool y adjúntalo al assistant.

Si vas a actualizar el assistant existente `944b05bf-4dd4-4e07-b979-40e4bfccc9bb`, después corre:
```bash
export VAPI_QUERY_TOOL_ID="ID_DEL_QUERY_TOOL"
bash vapi/update-existing-assistant.sh
```

Para hacer todo en una sola corrida productiva:
```bash
cp vapi/.env.example vapi/.env
# Editar vapi/.env y poner la llave privada real.
bash vapi/deploy-production.sh
```

### 1. Subir la base de conocimiento
Desde Dashboard:
1. Ir a Files.
2. Upload File.
3. Subir `vapi/knowledge-base/colegios-875-sales-kb.md`.
4. Copiar el `fileId`.

Por API:
```bash
export VAPI_API_KEY="TU_API_KEY_PRIVADA"

curl -X POST "https://api.vapi.ai/file" \
  -H "Authorization: Bearer $VAPI_API_KEY" \
  -F "file=@vapi/knowledge-base/colegios-875-sales-kb.md"
```

### 2. Crear Query Tool
Reemplaza `FILE_ID_AQUI`:
```bash
curl --location "https://api.vapi.ai/tool/" \
  --header "Content-Type: application/json" \
  --header "Authorization: Bearer $VAPI_API_KEY" \
  --data '{
    "type": "query",
    "function": {
      "name": "colegios-875-search"
    },
    "knowledgeBases": [
      {
        "provider": "google",
        "name": "colegios-875-sales-kb",
        "description": "Información oficial de ventas de Colegios 875: proyecto, tipologías, inclusión, accesibilidad, recorrido 360, realidad aumentada, recorrido VR y contacto.",
        "fileIds": ["FILE_ID_AQUI"]
      }
    ]
  }'
```

### 3. Crear Assistant
Puedes hacerlo en Dashboard pegando:
- Prompt: `assistant-prompt.md`.
- Model: OpenAI `gpt-4o`, temperatura `0.2`.
- Transcriber: Deepgram Nova 3, idioma español.
- Voice: una voz Vapi disponible en tu cuenta.
- Tools: Query Tool `colegios-875-search`, transfer call y end call.

Si lo hacemos por API, primero conviene confirmar la voz y si usarás transferencia directa, SMS, CRM o calendario.

### 4. Adjuntar teléfono
En Vapi:
1. Phone Numbers.
2. Comprar o conectar número.
3. Asignarlo al assistant.
4. Probar llamada.

## Qué necesito para dejarlo funcionando por MCP/CLI/API

### Obligatorio
- `VAPI_API_KEY` privada.
- Confirmar si quieres crear assistant nuevo o actualizar uno existente.
- Número telefónico real para transferencias comerciales.
- Voz preferida o permiso para elegir una voz disponible.
- Idioma principal: español, inglés o bilingüe.

### Comercial
- Precios por tipología.
- Disponibilidad vigente.
- Metrajes.
- Dirección exacta.
- Fecha de entrega.
- Enganche, apartado y formas de pago.
- Horarios reales para citas VR.
- Responsable comercial o WhatsApp real.

### Integraciones opcionales
- CRM: HubSpot, GoHighLevel, Pipedrive, Airtable, Google Sheets, etc.
- Calendario: Google Calendar, Calendly o agenda propia.
- Webhook para guardar leads.
- WhatsApp Business API o endpoint para enviar mensajes.
- MCP o CLI de Vapi si ya lo tienes instalado.

## Recomendación operativa inicial
Lanzar primero con:
- Assistant de ventas.
- Knowledge base.
- Captura verbal de lead.
- Transferencia o promesa de WhatsApp.

Después agregar:
- Webhook de lead.
- Agenda real de citas.
- SMS/WhatsApp automático con landing.
- Evaluación de llamadas y score de calidad.
