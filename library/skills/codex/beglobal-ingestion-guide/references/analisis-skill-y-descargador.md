# Análisis: skill `beglobal-lesson-ingestor` y `download_beglobal_hls.py`

Fecha: 2026-09-04. Fuentes revisadas: `~/.codex/skills/beglobal-lesson-ingestor/` (SKILL.md, references, scripts), `scripts/download_beglobal_hls.py`, `scripts/deploy_n8n_control_plane.py`, `docs/premium-knowledge-mediahub/N8N_CONTROL_PLANE_2026-09-04.md`.

## Qué hace bien la skill

- **Gate de derechos explícito**: `owner`, `rights_confirmed=true` y un `rights_scope` de tres valores antes de cualquier descarga. El mismo gate está replicado en `trigger_server.validate_job_payload` y en el nodo `Validate ingestion request` de n8n.
- **Frontera de datos clara**: n8n sólo guarda metadata; la Mac guarda originales, transcripts y análisis. `SENSITIVE_CHILD_ENV_NAMES` se retira del entorno del worker. `FORBIDDEN_ARTIFACT_VALUES` bloquea `.m3u8`, `cookie:`, `bearer ` en los JSON generados.
- **Reanudación por manifiesto**: `lesson.manifest.json` + SHA-256 evitan descargar dos veces; `ingestion-state.json` fija diez etapas booleanas con pesos definidos en `INGESTION_WORKFLOW.md`.
- **Protocolo de resultado del worker**: la línea `BEGLOBAL_JOB_OUTCOME={...}` permite que Codex reporte un resultado estructurado sin parsear texto libre.
- **Runner sólo saliente**: la Mac nunca abre puertos; reclama jobs por HTTPS con token propio (`X-BeGlobal-Runner`), distinto del token del dashboard.

## Huecos que impiden el modo guiado

| # | Hueco | Dónde | Impacto |
|---|---|---|---|
| 1 | Sólo existen `running/succeeded/failed`. Un job que necesita login o confirmación queda `failed` y hay que crearlo de nuevo. | `EVENT_VALIDATE_CODE` (n8n), `FINAL_STATUSES`, `parse_worker_outcome` | No hay forma de "pausar y reanudar" desde n8n. |
| 2 | El runner reporta 5% al inicio y 100% al final; no hay checkpoints intermedios. | `remote_runner.process_one` | El dashboard no ve etapas; el usuario no sabe qué falta. |
| 3 | El worker no puede pedir datos al usuario a mitad de ejecución (Codex `exec` es no interactivo). | `execute_job` / `build_prompt` | Toda pregunta debe salir como evento `waiting_human` y volver como `resume_data`. |
| 4 | `validate_ingestion.py` se menciona en `references/workflow.md` pero no existe ni en la skill ni en `scripts/`. | Skill y repo | La validación final depende de que Codex "haga el equivalente". |
| 5 | `remote_runner.py` no tiene tests; `trigger_server` sí. | Skill | Cambios al runner sin red de seguridad. |
| 6 | El runner no está instalado como servicio (launchd). Si la Mac reinicia, la cola se queda esperando. | Doc de n8n | Jobs guiados quedarían colgados sin aviso. |
| 7 | `queue_depth: null` en `/health`. | n8n | No se puede decir al usuario "hay N jobs delante". |

## Análisis de `download_beglobal_hls.py`

Qué hace: lee un CSV autorizado (`seccion, leccion, id_leccion, pagina, m3u8`), hace preflight del master HLS (variante de mayor bitrate, duración, segmentos, cifrado), rechaza DRM (`SAMPLE-AES`, keyformat no `identity`), calcula espacio, descarga con `ffmpeg -c copy` a `original.part.mp4`, valida con `ffprobe`, calcula SHA-256, y escribe los cuatro JSON del contrato más `validation-record.json`. Escribe `download-summary.json` por curso.

Fortalezas:

- Reanudable **por lección**: si `lesson.manifest.json` y `media/original.mp4` coinciden en SHA-256 y bytes, marca `skipped_valid` sin tocar la red.
- Cuarentena de `.part` y de finales inválidos con timestamp; nunca sobrescribe.
- Reserva de disco configurable (`--reserve-gib`, 5 GiB por defecto) y verificación previa con el estimado del preflight.
- `--preflight-only` permite estimar GiB y horas antes de comprometer disco. Esto es justo lo que el paso `disk_confirmation` del modo guiado necesita.
- Rechazo de playlists en vivo y de lotes con más de un curso.

Defectos y riesgos:

1. **`"Curso Amazon"` hardcodeado** en `page_metadata.course.title` y en `download-summary.json`. Contradice la regla de la skill ("no informado" para lo ausente; nunca hardcodear). Corregir con `--course-title` opcional y `no informado` por defecto.
2. **La URL de reproducción viaja como argumento de `ffmpeg`**. No se persiste, pero es visible en `ps` mientras dura la descarga. Riesgo local aceptable; documentarlo. Mitigación posible: escribir la media playlist a un archivo temporal 0600 en un directorio privado y borrarlo al terminar.
3. **Reanudación de grano grueso**: si ffmpeg muere a mitad de una lección de 2 h, el `.part` va a cuarentena y la lección se vuelve a bajar entera. No hay caché de segmentos. Aceptable para el volumen actual; anotar como mejora.
4. **El CSV de entrada contiene URLs firmadas** y vive fuera del contrato de la skill. Debe residir fuera del repo (por ejemplo `~/Private/beglobal/`) y borrarse o rotarse tras la descarga. `.gitignore` cubre `beglobal/dataset/premium/` pero no un CSV suelto en `scripts/` o raíz.
5. **`access_verified` se marca `true` sólo por haber descargado el HLS**. Es evidencia de acceso al CDN, no a la página autenticada. La skill exige "acceso observado" en la página; el downloader no la abre. Correcto para su alcance, pero el manifiesto debería decir `access_evidence: "hls_acquired"` en vez de sugerir inspección de página.
6. `ffprobe_media` exige stream de video; una lección sólo-audio fallaría como "does not contain video". Caso raro; permitirlo con flag.

## Conclusión para el diseño

El pipeline técnico ya es sólido y reanudable. Lo que falta para "que me vaya guiando" es un **estado `waiting_human` con `pending` estructurado y un `resume` con datos**, en n8n y en el runner, más un cliente mínimo que cualquier agente pueda invocar. No hace falta rehacer nada; se extiende el workflow existente con `--update-existing`.
