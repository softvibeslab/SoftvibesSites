# Plan: workflow guiado de ingesta en n8n

Fecha: 2026-09-04. Patrón: baby steps con validación por fase, igual que `N8N_CONTROL_PLANE_2026-09-04.md`.

## Estado (2026-09-04, tarde)

| Fase | Estado | Evidencia |
|---|---|---|
| 1 Contrato | Hecha con las tres propuestas por defecto (umbral 2 GiB / 20 %, aviso vía n8n→Telegram opcional, aprobación desde dashboard o chat) | `webhook-contract.md` |
| 2 n8n | **Publicada el 2026-09-04** (workflow `zrgiPe3bm7EIyiJL` v2.0.0, tabla de sesiones `1jaxmJWuBHWQQYhs`, seis columnas nuevas en `bHHOfnDntmirKKhH`) | `scripts/deploy_n8n_control_plane.py` v2.0.0 (87 nodos, 13 webhooks), `scripts/test_deploy_n8n_control_plane.py` (17 tests, incluye simulación del JS bajo Node) |
| 3 Runner y worker | Hecha | `~/.codex/skills/beglobal-lesson-ingestor/scripts/{trigger_server,remote_runner,validate_ingestion}.py`, `references/checkpoints.md`, `test_remote_runner.py` (9 tests), `test_trigger_bridge.py` (16) |
| 4 Cliente | Hecha | `scripts/beglobal_guide_client.py`, `scripts/test_beglobal_guide_client.py` (8 tests), symlinks `.claude/skills` y `.codex/skills` |
| 5 Avisos | No iniciada | — |
| 6 Prueba end-to-end | Primera pasada hecha: sesión `51c2bb35af5a620d5627ab58`, job `0bdf763bb962bb46fadc9450` sobre la lección 1526 llegó a `waiting_human / access_required` al 95 % con `pending` limpio; falta reanudar con acceso de navegador y probar `approve` | `/guide/status` en n8n |
| Descargador | Hecha | `--course-title`, `--allow-audio-only`, aviso si el CSV está dentro de Git, `access_evidence` explícito |

Runner v2 arrancado manualmente el 2026-09-04 (nohup, logs en `~/Library/Logs/beglobal-runner/`). El servicio launchd se probó y **macOS lo bloquea (TCC)**: un LaunchAgent no puede leer `~/Documents` sin que el intérprete tenga Acceso total al disco; el agente salía con código 126 `Operation not permitted`. Para usarlo hay que conceder Full Disk Access a `python3` y `bash` en Ajustes → Privacidad, o mover el workspace fuera de `~/Documents`. Mientras tanto el runner se relanza desde una terminal.

### Resultado de la primera prueba real (2026-09-04)

- `start → provide → submit → claim → running → waiting_human/access_required` funcionó de punta a punta; `resume` con `logged_in=true` volvió a encolar y el runner reejecutó con `kind=resume`.
- Bloqueo encontrado: en `codex exec` el worker no tenía navegador (`active_browser_available=false`), así que cada `resume` terminaba igual. Decisión del owner: MCP de Chrome para Codex. Se registró `chrome-devtools-mcp` con `--autoConnect` (sin telemetría); falta activar remote debugging en `chrome://inspect/#remote-debugging` una sola vez.
- Regresión encontrada y corregida: la segunda corrida bajó la lección piloto de 95 % a 40 % porque los cuatro assets estaban declarados con nombre suelto y vivían en la raíz del repo. Se movieron a `lessons/1526/{media,transcript,analysis.md}`, se reescribió el manifiesto (respaldo en `.backup-2026-09-04/`), se restauró el estado al 95 % y se reconstruyó la proyección local sin publicar.
- El worker, sin acceso al navegador, reescribe `access_status` y baja `access_verified`; hasta tener MCP operativo no conviene reanudar la sesión `51c2bb35af5a620d5627ab58`.
- 2026-09-13: `--autoConnect` quedó descartado. Chrome 144+ pide consentimiento por cada conexión y el worker se rinde antes de que el humano acepte (`/json/version` colgado, `list_pages` sin respuesta). Decisión del owner: **perfil de Chrome dedicado**. `scripts/start_beglobal_chrome.sh` abre Chrome con perfil privado en `~/.beglobal/chrome-profile` (700) y puerto 9223 solo en localhost; el MCP de Codex usa `--browserUrl http://127.0.0.1:9223`. El owner inicia sesión una vez en esa ventana.: `scripts/launchd/com.softvibes.beglobal-runner.plist` + `scripts/run_premium_runner_service.sh`.

### Cómo publicar (ya ejecutado el 2026-09-04; repetir sólo tras cambios en el aprovisionador)

```bash
python3 scripts/deploy_n8n_control_plane.py --dry-run > /dev/null && python3 -m unittest scripts.test_deploy_n8n_control_plane
N8N_API_KEY="<clave temporal creada en n8n>" python3 scripts/deploy_n8n_control_plane.py --update-existing
# revoca la clave en n8n al terminar
```

`--update-existing` ahora crea `beglobal_ingestion_sessions` si falta y añade a `beglobal_ingestion_jobs` las columnas `kind`, `session_id`, `stage_state_json`, `pending_json`, `resume_json` y `approval_json` vía `POST /data-tables/{id}/columns`. Si la API pública no expone ese endpoint, el script aborta con la lista exacta de columnas para añadirlas a mano.

Después: reiniciar el runner (`bash scripts/start_premium_ingestion_bridge.sh --remote`) para que use el protocolo v2, y ejecutar la Fase 6.

## Objetivo

Que un agente (Claude Code, Codex, Hermes) o el dashboard mande a **un solo webhook** lo que tenga, y n8n devuelva qué falta hasta encolar el job. Después, que el runner local pueda **pausar** un job pidiendo una acción humana y **reanudarlo** con los datos que el humano dé, sin recrear el job y sin que ningún secreto pase por n8n.

## Principios que no cambian

- n8n guarda metadata, estado, pendientes y decisiones. Nunca originales, transcripts, rutas locales ni URLs de reproducción.
- Los tokens siguen separados: `X-BeGlobal-Trigger` (dashboard y agentes), `X-BeGlobal-Runner` (Mac), `X-N8N-API-KEY` (sólo aprovisionamiento, temporal, revocada al terminar).
- El worker sigue siendo `$beglobal-lesson-ingestor` ejecutado por Codex en la Mac. Este plan no cambia la skill de ingesta salvo el protocolo de resultado.
- `human_approved` sólo lo escribe el runner en `approval.review.json` a partir de una decisión con aprobador nombrado.

## Fase 1 · Contrato (sin código)

Entregable: `references/webhook-contract.md` (ya escrito) revisado por el owner.

Decisiones a confirmar:

1. Umbral de `disk_confirmation`: proponer pedir confirmación cuando el estimado supere 2 GiB **o** el 20 % del espacio libre.
2. Canal de aviso para `waiting_human`: Telegram vía n8n (nodo nativo) o vía Hermes messaging. Propuesta: n8n manda el aviso; Hermes responde con `resume`.
3. Si `review` se cierra desde n8n o solo desde el dashboard `/trainning/`. Propuesta: ambos, mismo `action=approve`.

Criterio de salida: contrato aprobado y sin campos que transporten secretos.

## Fase 2 · n8n: sesiones y estados nuevos

Archivo: `scripts/deploy_n8n_control_plane.py` (extender `build_workflow`, nuevas constantes de código JS) y `scripts/test_deploy_n8n_control_plane.py`.

Pasos:

1. **Data Table `beglobal_ingestion_sessions`**: `session_id`, `step`, `accepted_json`, `missing_json`, `job_id`, `channel`, `created_at`, `updated_at`. Mantener el mismo patrón `data_table_node` con locator por nombre.
2. **Columnas nuevas en `beglobal_ingestion_jobs`**: `kind`, `session_id`, `stage_state_json`, `pending_json`, `resume_json`, `approval_json`. Añadirlas a `TABLE_COLUMNS` y a `resource_schema()`.
3. **Nodo `Guide router`** (Code): valida `action`, aplica la guardia de secretos, carga la sesión (o la crea en `start`), y devuelve `{ok, step, missing, accepted}`. Reutilizar la validación de `INTAKE_CODE` extrayéndola a una función compartida en JS para no duplicar reglas.
4. **Ramas por `action`**:
   - `start|provide`: merge de `accepted` + `data`, recalcular `missing`, upsert sesión.
   - `submit`: si `missing` vacío, construir la fila del job igual que `Insert ingestion job` (misma huella e idempotencia) con `kind=ingest`, ligar `session.job_id`, `step=queued`.
   - `status`: leer sesión + job, formatear.
   - `resume`: exigir `job.status=waiting_human`, validar `data` contra `pending.fields`, guardar `resume_json`, poner `status=queued, kind=resume, stage=resume_<reason>`.
   - `approve`: exigir `step=review`, validar `approver` y `decision`, crear job `kind=approval`.
   - `cancel`: `step=cancelled`; si hay job `queued`, marcarlo `failed/cancelled`.
5. **`/runner/events` ampliado**: aceptar `waiting_human`, `stage_state`, `pending`; recalcular `progress` con pesos; si `waiting_human`, mover la sesión a `waiting_human`; si `succeeded` y `stage_state.human_approved=false`, mover a `review`; si `succeeded` con `kind=approval`, mover a `done`.
6. **`/runner/next` ampliado**: reclamar `queued` de cualquier `kind`, devolver `kind`, `resume_data`, `approval`.
7. **`/health`**: rellenar `queue_depth` contando `queued`.
8. **Tests nuevos** en `test_deploy_n8n_control_plane.py`: rutas `/guide` y `/guide/status` únicas y con auth de dashboard; guardia de secretos presente en el JS; `waiting_human` aceptado en eventos; `progress` calculado desde `stage_state`; ninguna columna nueva permite rutas locales (test de nombres prohibidos: `path`, `url_playback`, `manifest_url`).
9. **Publicar** con `N8N_API_KEY` temporal y `--update-existing`; verificar en n8n que la tabla nueva y las columnas existen; revocar la clave. Ojo: el `--update-existing` actual no crea tablas ni columnas; hay que extenderlo para hacer ALTER de columnas y crear la tabla de sesiones si falta.

Criterio de salida: `--dry-run` produce JSON válido; `unittest` en verde; `curl` a `/guide` con `action=start` responde `missing=[owner, rights_confirmed, rights_scope]`; payload con `cookie:` responde 400 `secret_in_payload`.

## Fase 3 · Runner y worker: checkpoints y reanudación

Archivos: `~/.codex/skills/beglobal-lesson-ingestor/scripts/remote_runner.py`, `trigger_server.py`, `SKILL.md` de la skill, y un `test_remote_runner.py` nuevo.

Pasos:

1. **Protocolo de resultado**: `WORKER_OUTCOME` admite `status: waiting_human` con objeto `pending` (`reason`, `prompt`, `fields`, `facts`). `parse_worker_outcome` lo valida y rechaza `facts` con `http`, `/Users/`, `.m3u8`.
2. **`FINAL_STATUSES`** no incluye `waiting_human`. `execute_job` guarda `pending` en el job local; `remote_runner.process_one` lo envía como evento `waiting_human`.
3. **`build_prompt`** incluye `job_kind`, `resume_data` y `approval` cuando el claim los trae. Para `kind=approval`, el prompt ordena únicamente escribir `approval.review.json`, recalcular `ingestion-state.json` y reconstruir la proyección segura; nada de descargas.
4. **Progreso intermedio**: el runner lanza un hilo que cada 15 s lee `ingestion-state.json` del directorio de la lección (ruta derivada de `course_id/lesson_id`, nunca enviada) y manda `stage_state` como evento `running`. Así el porcentaje sale de evidencia material.
5. **Preflight de disco**: antes de descargar, el worker corre `download_beglobal_hls.py --preflight-only` (o el equivalente de la skill) y, si supera el umbral, termina con `waiting_human/disk_confirmation` y `facts={estimated_gib, duration_hours, free_gib}`. Con `resume_data.confirm_download=true` continúa.
6. **Acceso**: cuando la página muestre `Adquirir` o pida login, terminar con `waiting_human/access_required` en vez de `failed`. `failed` queda para errores técnicos y `restricted` para DRM.
7. **Servicio persistente**: plist de launchd `com.softvibes.beglobal-runner` que ejecute `start_premium_ingestion_bridge.sh --remote` con `EnvironmentVariables` cargadas desde `.beglobal-n8n.env` por un wrapper, `KeepAlive=true`, logs en `~/Library/Logs/beglobal-runner/`. Cierra el hueco 6 del análisis.
8. **`validate_ingestion.py`** en la skill: parsea JSON, resuelve rutas, compara checksums, busca valores prohibidos y recalcula el porcentaje. Cierra el hueco 4 y da al worker un comando concreto para la etapa 6.

Criterio de salida: test unitario que simula un claim `kind=resume` y verifica que el prompt contiene `resume_data`; ejecución `--once` contra n8n con un job de prueba en un curso ya accesible; evento `waiting_human` visible en la Data Table.

## Fase 4 · Cliente para agentes

Archivo nuevo: `scripts/beglobal_guide_client.py` (stdlib, sin dependencias).

- Subcomandos: `start`, `provide`, `submit`, `status`, `resume`, `approve`, `cancel`, `watch` (poll cada 30 s hasta `waiting_human|review|done|blocked`).
- Token sólo desde `BEGLOBAL_DASHBOARD_TOKEN`; error claro si falta; nunca se imprime.
- Salida JSON en stdout (para agentes) y resumen humano en stderr con `--human`.
- Aplica la misma guardia de secretos **antes** de enviar; si detecta uno, sale con código 3 y no hace la request.
- Test `scripts/test_beglobal_guide_client.py`: normalización de URL, guardia de secretos, parseo de respuesta, `watch` termina en estados finales.

Integración por runtime:

- Claude Code y Codex: symlinks ya creados en `.claude/skills/` y `.codex/skills/` hacia `.agents/skills/beglobal-ingestion-guide`. Para Codex global, además `ln -s <repo>/.agents/skills/beglobal-ingestion-guide ~/.codex/skills/beglobal-ingestion-guide`.
- Hermes: añadir `~/Documents/SoftvibesLab/BeGlobal/.agents/skills` a `skills.external_dirs` en `~/.hermes/config.yaml` (ruta absoluta, no `~`). Verificar con `hermes skills list`.

Criterio de salida: desde los tres runtimes, `start → provide → submit` produce un `job_id` idéntico al que muestra `/trainning/`.

## Fase 5 · Avisos al humano (opcional)

- Nodo Telegram en n8n disparado cuando la sesión entra en `waiting_human` o `review`, con `pending.prompt` y el `session_id`. Sin rutas ni URLs de reproducción.
- Hermes recibe el mensaje y, al contestar el usuario ("listo", "sí descarga", "aprobado por X"), llama al cliente con `resume`/`approve`.
- Alternativa sin Telegram: el dashboard `/trainning/` muestra el `pending` en la tarjeta del job.

## Fase 6 · Prueba end-to-end y registro

1. Lección de un curso ya accesible (por ejemplo `c417f6c0…/1526`, que ya tiene artefactos): `start → submit` debe terminar en `skipped_valid` y `review` sin descargar nada.
2. Lección de un curso que muestre `Adquirir`: debe terminar en `waiting_human/access_required`, no en `failed`.
3. Curso completo con estimado grande: debe pedir `disk_confirmation` con `facts` correctos; `confirm_download=false` deja `media_registered=false` y la sesión en `review` con nota.
4. `approve` con aprobador nombrado: `approval.review.json` escrito localmente, `human_approved=true`, proyección reconstruida, `publish_dashboard` sólo si se pidió.
5. Registrar todo en `docs/premium-knowledge-mediahub/N8N_GUIDED_INGESTION_2026-09-XX.md` con checksums y IDs de n8n, y actualizar `INGESTION_WORKFLOW.md` (sección "Trigger de la skill").

## Correcciones al descargador (paralelas, no bloqueantes)

1. `--course-title` opcional; por defecto `no informado`. Quitar `"Curso Amazon"`.
2. `access_evidence` explícito: `"hls_acquired"`.
3. Advertir si `--source-csv` está dentro de un repositorio Git (`git ls-files --error-unmatch`), y documentar que el CSV con URLs firmadas vive fuera del repo y se borra tras el lote.
4. Flag `--allow-audio-only` para lecciones sin stream de video.
5. Anotar en el docstring que la reanudación es por lección, no por segmento.

## Orden recomendado

Fase 1 hoy (sólo revisión). Fase 2 y Fase 3 pueden ir en paralelo porque comparten únicamente el contrato. Fase 4 depende de la 2. Fase 5 es opcional. Fase 6 cierra. Las correcciones del descargador pueden hacerse en cualquier momento.

## Riesgos

- `--update-existing` hoy no altera tablas: si se olvida extenderlo, el workflow nuevo falla en runtime por columnas inexistentes. Mitigación: test que compara `TABLE_COLUMNS` con el esquema remoto antes de publicar.
- Codex `exec` no puede pedir input: cualquier pregunta que el worker "haga" en texto libre se perdería. Mitigación: la skill de ingesta debe terminar siempre con `waiting_human` estructurado.
- Progreso inflado: si el runner manda `progress` sin `stage_state`, n8n debe rechazarlo. Mitigación: validación en `EVENT_VALIDATE_CODE`.
