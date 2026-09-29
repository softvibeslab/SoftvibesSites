# Registro local del piloto

La herramienta no busca, no puntúa con IA, no envía mensajes y no conecta servicios. Mantiene SQLite con transacciones, anuncios versionados y eventos identificados para que reintentar una operación no duplique sus resultados. Requiere solo Python 3.10+.

En los ejemplos, ejecuta desde la raíz de RogerVibes. Si estás en otra carpeta, sustituye `--root .` por la ruta absoluta. Resuelve el script desde la carpeta donde está instalada esta skill; en este equipo:

```bash
python3 ~/.codex/skills/gig-pilot/scripts/pipeline.py --root . init
python3 ~/.codex/skills/gig-pilot/scripts/pipeline.py --root . list --limit 10
python3 ~/.codex/skills/gig-pilot/scripts/pipeline.py --root . summary
```

## Importar anuncios

Escribe un JSON con un objeto o lista de objetos y pasa `import --file <ruta>`. Los JSON de trabajo se guardan dentro de `source_jobs/squad/pilot/` o en un directorio temporal. Ejemplo **ficticio, solo para ilustrar el contrato**:

```json
{
  "platform": "workana",
  "external_id": "demo-001",
  "url": "https://example.com/project/demo-001",
  "title": "Corregir aislamiento de sesiones de una app",
  "client": "Cliente de ejemplo",
  "retrieval": "pasted",
  "posting": "Texto completo del anuncio proporcionado por el usuario.",
  "budget": {"amount": null, "currency": null},
  "source_note": "Pegado por Roger; sin verificación del portal"
}
```

Usa el ID estable del anuncio siempre que esté disponible. Si no existe, omite `external_id`: se usa la URL normalizada, conservando parámetros de identidad y eliminando solo fragmento y tracking conocido. Para un anuncio pegado sin URL, asigna una sola vez un ID `manual-` más un hash del contenido y conserva ese ID al actualizarlo. No uses empresa+título como identidad. Para fuentes distintas del mismo anuncio, conserva ambos registros hasta comprobar que son el mismo proyecto; no fusiones por semejanza.

Una vez creado un registro, conserva su convención de identidad (ID o URL); el CLI rechaza una URL ya asociada a otra clave para que no se duplique silenciosamente. `show <key>` permite recuperar la identidad original. Si el cliente y el título coinciden pero el ID del proyecto cambia, son oportunidades distintas.

Valores de `retrieval`: `fetched`, `pasted`, `unavailable`. Los dos primeros requieren `posting`; el último permite guardar una pista inaccesible. Volver a importar una pista inaccesible conserva el texto ya archivado y los eventos anteriores. Un anuncio modificado invalida la evaluación. `show` devuelve también snapshots anteriores con fecha de captura.

## Guardar evaluación

Ejecuta `evaluate <key> --file <ruta>`. El agente decide con evidencia; el script valida el contrato y calcula el puntaje. Las respuestas y razones siguen el orden de las cinco preguntas de SKILL.md:

```json
{
  "answers": ["yes", "yes", "yes", "yes", "unknown"],
  "reasons": [
    "Cita del problema descrito en el anuncio",
    "El aislamiento puede verificarse con dos sesiones de prueba",
    "Servicio canónico rescue-audit",
    "Caso propio pertinente y artefacto localizado",
    "El cliente no se ha pronunciado sobre auditoría inicial"
  ],
  "blockers": [],
  "service_id": "rescue-audit",
  "case_ids": ["wappy"],
  "evidence": ["Ruta o enlace al artefacto efectivamente revisado"],
  "flags": ["Presupuesto desconocido"],
  "next_action": "Preparar borrador con pregunta sobre alcance y auditoría inicial"
}
```

El ejemplo explica el formato, no acredita un caso real. El script no valida IDs contra el YAML ni la veracidad del razonamiento: corresponde al agente leer el canónico y las fuentes. Una evaluación no crea por sí sola un evento de envío o cierre. `list` devuelve filas compactas ordenadas para revisión, no un digest ya verificado: el agente excluye descartes, oportunidades cerradas o ya trabajadas y verifica vigencia antes de recomendar.

## Registrar hechos

Ejecuta `record <key> --file <ruta>` con:

```json
{
  "event_id": "workana-demo-001-envio-1",
  "stage": "sent",
  "occurred_at": "2026-09-17T10:00:00-05:00",
  "evidence": "Roger confirmó el envío; versión local proposal-20260917-0950.md"
}
```

Usa la fecha real del hecho, con zona horaria. El ejemplo no es un evento real. Si Roger solo da una fecha, conserva esa precisión en `evidence` y usa medianoche local como convención de registro, sin presentarla como hora conocida. Si la fecha importa y no está indicada, pregunta; no uses la fecha del borrador como fecha de envío. Reutiliza `event_id` para reintentos del mismo hecho; contenido distinto con el mismo ID se rechaza.

Etapas admitidas: `drafted`, `sent`, `replied`, `call`, `audit_paid`, `implementation`, `retainer`, `testimonial`, `lost`, `no_response`, `withdrawn`, `expired`. Un hecho posterior puede reabrir una oportunidad. El registro conserva todas las etapas reportadas, sin inventar las intermedias. Los borradores posteriores no sustituyen el estado comercial ya alcanzado. No existe borrado/corrección de eventos en esta primera versión: antes de registrar, identifica bien el anuncio y el hecho; si hay un error ya guardado, informa y prepara una corrección explícita fuera del flujo normal.

Para recordatorios, consulta `last_event_at`, evidencia y próxima acción. Muestra días sin actividad registrada; no los llames automáticamente días sin respuesta del cliente. Preparar un recordatorio no equivale a enviarlo.

## Métricas y archivos

`summary` cuenta oportunidades únicas por etapa alguna vez confirmada. Una venta luego perdida conserva sus etapas previas. Las tasas de respuesta y auditoría pagada usan la intersección con oportunidades con evento `sent`, nunca los borradores. Sin envíos devuelve `null`; presenta “sin datos”. `outcomes_without_recorded_send` señala historias incompletas que no deben rellenarse por inferencia. Estas tasas describen esta muestra, no estiman probabilidades futuras.

La base queda en `source_jobs/squad/pilot/pipeline.sqlite3`, los digests en `pilot/digests/`, y borradores/versiones en `pilot/opportunities/<key>/`. `init` crea un `.gitignore` local para excluir datos comerciales nuevos del seguimiento Git; eso no cifra archivos ni retira archivos que ya estuvieran versionados. No guardes credenciales en el registro.

El diseño toma ideas de `ai-job-search` (triage, archivo y resultados); la implementación de este helper es propia. No depende de ejecutar sus comandos ni de copiar su perfil.
