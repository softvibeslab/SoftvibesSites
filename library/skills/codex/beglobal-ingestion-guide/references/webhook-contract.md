# Contrato del webhook guiado

Base: `https://service.example.invalid/webhook/beglobal-premium`
Auth dashboard/agentes: header `X-BeGlobal-Trigger` (credencial `BeGlobal Dashboard Trigger`).
Auth runner: header `X-BeGlobal-Runner` (credencial `BeGlobal Local Runner`).
CORS: sólo `https://service.example.invalid`. Los agentes CLI no necesitan CORS.

## Endpoints nuevos

| Método | Ruta | Quién | Uso |
|---|---|---|---|
| POST | `/guide` | dashboard, agentes | Único punto de entrada guiado. `action` decide el paso. |
| OPTIONS | `/guide` | navegador | Preflight CORS, 204. |
| GET | `/guide/status?session_id=` | dashboard, agentes | Lectura sin mutar. |

Se conservan `/jobs`, `/jobs/status`, `/runner/health`, `/runner/next`, `/runner/events` y `/health`. El guiado escribe en la misma Data Table `beglobal_ingestion_jobs` cuando llega a `submit`.

## Request `POST /guide`

```json
{
  "session_id": "opcional; si falta, n8n crea uno (24 hex)",
  "action": "start | provide | submit | status | resume | approve | cancel",
  "data": { "campos parciales según el paso" },
  "channel": "cli | dashboard | telegram"
}
```

Header opcional `Idempotency-Key` (8-128 chars) sólo en `submit`; misma semántica que `/jobs`.

### Campos aceptados en `data`

| Campo | Paso | Regla |
|---|---|---|
| `item_url` | start | HTTPS estable de beglobalpro.org; se normaliza igual que en `validate_item_url.py`. |
| `owner` | rights | 1-120 chars sin control chars. |
| `rights_confirmed` | rights | Debe ser `true` literal. |
| `rights_scope` | rights | `analysis_internal` \| `private_reproduction` \| `controlled_download`. |
| `options.*` | options | Mismas seis claves y defaults que `/jobs`. |
| `confirm_download` | resume (disk_confirmation) | `true` para continuar; `false` cancela la descarga y deja `media_registered=false`. |
| `logged_in` | resume (access_required) | `true` cuando el usuario ya inició sesión en Chrome. |
| `rights_scope` | resume (scope_expansion) | Nuevo alcance; requiere `owner` de nuevo. |
| `approver`, `decision`, `notes` | approve | `decision` ∈ `approve` \| `reject` \| `return`. |

### Guardia de secretos

n8n rechaza con 400 y `error: "secret_in_payload"` cualquier cuerpo cuyas claves o valores contengan, sin distinguir mayúsculas: `password`, `cookie`, `authorization`, `bearer `, `session_token`, `.m3u8`, `signature=`, `x-amz-`, `token=`. El mensaje indica: "Inicia sesión directamente en el navegador; no pegues credenciales".

## Response

```json
{
  "session_id": "…",
  "step": "intake | rights | options | queued | processing | waiting_human | review | done | blocked | cancelled",
  "accepted": { "item_url": "…", "item_type": "lesson", "course_id": "…", "lesson_id": "1526", "owner": "…", "rights_scope": "…", "options": { } },
  "missing": [
    { "field": "owner", "type": "string", "required": true, "prompt": "¿Quién es la persona o rol responsable de esta ingesta?" }
  ],
  "next_action": "provide | submit | wait | resume | approve | none",
  "job": {
    "job_id": "…", "status": "queued", "stage": "queued", "progress": 0,
    "stage_state": { "cataloged": true, "access_verified": false, "…": false },
    "pending": null
  },
  "message": "texto corto para mostrar al usuario",
  "http_status": 200
}
```

`job.pending`, cuando existe:

```json
{
  "reason": "access_required | disk_confirmation | scope_expansion | approval | restricted",
  "prompt": "Abre https://platform.example.invalid/cursos/contenido/… en Chrome, inicia sesión y responde 'listo'.",
  "fields": [ { "field": "logged_in", "type": "boolean" } ],
  "facts": { "estimated_gib": 4.2, "duration_hours": 3.1, "free_gib": 118.5, "drm": false },
  "since": "2026-09-04T12:00:00Z"
}
```

`facts` sólo admite números, booleanos y strings cortos sin URLs. El runner es responsable de no incluir rutas locales ni referencias de reproducción.

## Notas de implementación (v2.0.0)

- Una sesión tiene **un solo job**; `resume`, `approve` y `return` no crean filas nuevas: cambian `kind`, `status=queued` y el JSON lateral (`resume_json` / `approval_json`) en la misma fila. `job_id = hash24(Idempotency-Key || "guide:" + session_id)`.
- `decision=return` produce `kind=rework`; `approve`/`reject` producen `kind=approval`.
- `start` acepta todos los campos de una vez (URL, owner, derechos, alcance, options); `missing` sólo lista lo que falte.
- `status` también sincroniza el `step` de la sesión con el estado real del job.
- El runner v2 envía `stage_state` en cada evento; n8n recalcula `progress` y descarta el número enviado.

## Máquina de estados de la sesión

```text
intake ──item_url válida──▶ rights ──owner+confirmed+scope──▶ options ──submit──▶ queued
queued ──runner claim──▶ processing ──evento waiting_human──▶ waiting_human ──resume──▶ queued
processing ──succeeded, human_approved=false──▶ review ──approve──▶ queued(kind=approval) ──succeeded──▶ done
processing ──failed/restricted──▶ blocked        review ──reject──▶ blocked        review ──return──▶ queued(kind=rework)
cualquiera ──cancel──▶ cancelled
```

## Eventos del runner (`POST /runner/events`) ampliados

```json
{
  "job_id": "…", "runner_id": "runner-1a2b3c4d",
  "status": "running | waiting_human | succeeded | failed",
  "stage": "download_media",
  "progress": 45,
  "stage_state": { "cataloged": true, "access_verified": true, "lessons_indexed": true, "media_registered": false, "…": false },
  "pending": { "reason": "disk_confirmation", "prompt": "…", "fields": [ ], "facts": { } },
  "message": "≤500 chars sin secretos"
}
```

n8n recalcula `progress` con los pesos oficiales (10/10/10/15/15/15/10/5/5/5) a partir de `stage_state` y descarta el valor enviado si no coincide en ±1.

## Claim del runner ampliado (`GET /runner/next`)

```json
{
  "job_id": "…",
  "kind": "ingest | resume | approval | rework",
  "request": { "…igual que hoy…" },
  "resume_data": { "confirm_download": true } ,
  "approval": { "approver": "Corporate", "decision": "approve", "notes": "…" },
  "claimed_at": "…"
}
```

## Ejemplos con curl

```bash
set -a; source .beglobal-n8n.env; set +a
B=https://service.example.invalid/webhook/beglobal-premium

curl -sS -X POST "$B/guide" -H "X-BeGlobal-Trigger: $BEGLOBAL_DASHBOARD_TOKEN" -H 'Content-Type: application/json' \
  -d '{"action":"start","data":{"item_url":"https://platform.example.invalid/cursos/contenido/<uuid>/1526"},"channel":"cli"}'

curl -sS -X POST "$B/guide" -H "X-BeGlobal-Trigger: $BEGLOBAL_DASHBOARD_TOKEN" -H 'Content-Type: application/json' \
  -d '{"session_id":"<id>","action":"provide","data":{"owner":"Roger","rights_confirmed":true,"rights_scope":"analysis_internal"}}'

curl -sS -X POST "$B/guide" -H "X-BeGlobal-Trigger: $BEGLOBAL_DASHBOARD_TOKEN" -H "Idempotency-Key: guide-<id>-1" -H 'Content-Type: application/json' \
  -d '{"session_id":"<id>","action":"submit"}'

curl -sS "$B/guide/status?session_id=<id>" -H "X-BeGlobal-Trigger: $BEGLOBAL_DASHBOARD_TOKEN"
```
