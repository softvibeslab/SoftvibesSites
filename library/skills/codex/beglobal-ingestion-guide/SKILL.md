---
name: beglobal-ingestion-guide
description: Guía paso a paso la ingesta privada de un curso o lección de BeGlobal Pro a través del webhook guiado de n8n. Usar cuando el usuario comparta una URL de beglobalpro.org y pida ingestarla, cuando pregunte "qué falta" para un job de ingesta, o cuando haya que reanudar, confirmar descarga o aprobar una lección. No maneja credenciales, cookies ni URLs de reproducción.
version: 1.0.0
platforms: [macos]
metadata:
  hermes:
    tags: [beglobal, n8n, ingesta, premium, webhook, codex, hermes, claude]
    related_skills: [beglobal-lesson-ingestor, brain-ingest, graphify]
---

# BeGlobal Ingestion Guide

Cliente conversacional del control plane `BeGlobal · Premium Ingestion Control Plane` en n8n. El agente (Claude Code, Codex o Hermes) manda lo que el usuario ya dio a un único webhook, n8n responde qué falta, y el agente sólo pregunta eso. Cuando el job queda en cola, el runner local de la Mac ejecuta `$beglobal-lesson-ingestor` y reporta checkpoints que vuelven por el mismo webhook.

Estado: **publicado y operativo desde el 2026-09-04** (n8n v2.0.0, runner v2, cliente). Primera prueba real: la lección piloto quedó en `waiting_human / access_required`; antes de reanudar un `access_required`, asegúrate de que el Chrome dedicado esté abierto y con sesión iniciada: `bash scripts/start_beglobal_chrome.sh <item_url>`. Sin navegador el worker vuelve a pausar. Lee [references/plan-n8n-guiado.md](references/plan-n8n-guiado.md) antes de tocar n8n o el runner. El contrato del webhook está en [references/webhook-contract.md](references/webhook-contract.md). El análisis de la skill y del descargador que motivó este diseño está en [references/analisis-skill-y-descargador.md](references/analisis-skill-y-descargador.md).

## Cuándo usarla

- El usuario pega una URL `https://platform.example.invalid/cursos/...` y quiere ingestarla.
- El usuario pregunta por el estado de un job o por "qué falta".
- El runner dejó un job en `waiting_human` (login, confirmación de disco, ampliación de alcance, aprobación Corporate) y hay que reanudarlo.

Si el control plane no está disponible, no improvises la ingesta a mano: reporta el bloqueo y sugiere el modo loopback de `$beglobal-lesson-ingestor`.

## Reglas duras

1. Nunca pidas ni reenvíes contraseñas, cookies, bearer tokens, encabezados de autorización ni URLs `.m3u8` o firmadas. Si el usuario las pega, no las mandes al webhook; pídele que inicie sesión directamente en Chrome.
2. El token del dashboard se lee sólo de `BEGLOBAL_DASHBOARD_TOKEN` (fuente: `.beglobal-n8n.env`, permisos 0600). No lo imprimas ni lo pongas en argumentos de línea de comandos.
3. Normaliza la URL con `python3 ~/.codex/skills/beglobal-lesson-ingestor/scripts/validate_item_url.py URL` antes de enviarla. Sin query ni fragment.
4. Un job `waiting_human` no es un fallo. Explica al usuario qué acción física necesita y reanuda con `action=resume` sólo cuando lo confirme.
5. Nunca marques `human_approved`. La aprobación va por `action=approve` con nombre del aprobador y se materializa localmente por el runner.

## Flujo del agente

```text
1. start    → envía item_url             → n8n responde missing=[owner, rights_confirmed, rights_scope]
2. provide  → envía lo que el usuario dio → n8n responde missing restante u options por defecto
3. submit   → confirma options           → n8n crea el job (status=queued) y devuelve job_id
4. status   → consulta cada 30-60 s      → progreso por etapas; si waiting_human, muestra pending.prompt
5. resume   → tras la acción humana      → job vuelve a queued con resume_data
6. approve  → decisión Corporate         → job de tipo approval; runner escribe approval.review.json
```

Cliente de referencia (`scripts/beglobal_guide_client.py`, stdlib; recuerda la última sesión en `~/.beglobal/guide-session`):

```bash
set -a; source .beglobal-n8n.env; set +a
python3 scripts/beglobal_guide_client.py --human start --item-url "https://platform.example.invalid/cursos/contenido/<uuid>/<n>"
python3 scripts/beglobal_guide_client.py --human provide --owner "Roger" --scope analysis_internal --confirm-rights
python3 scripts/beglobal_guide_client.py --human submit
python3 scripts/beglobal_guide_client.py --human watch            # sale al llegar a waiting_human, review, done o blocked
python3 scripts/beglobal_guide_client.py --human resume --confirm-download yes   # o --logged-in, o --scope X --owner Y --confirm-rights
python3 scripts/beglobal_guide_client.py --human approve --approver "Corporate" --decision approve --notes "Ficha revisada"
```

`--session <id>` fuerza una sesión concreta. Códigos de salida: 0 ok, 1 error remoto, 2 configuración, 3 secreto detectado (no se envió nada). Si prefieres `curl`, el contrato está en el documento del webhook.

## Cómo interpretar la respuesta

- `missing[]`: pregunta al usuario **sólo** esos campos, con el `prompt` que trae n8n. Una pregunta por turno si el canal es chat (Hermes/Telegram); todas juntas si es terminal.
- `job.pending`: acción humana. `reason` ∈ `access_required | disk_confirmation | scope_expansion | approval | restricted`. Reproduce `prompt` y espera.
- `job.progress`: porcentaje derivado de `stage_state`, no de tiempo transcurrido. Si sube sin que exista evidencia material, algo está mal.
- `step=blocked`: DRM, entitlement ausente o rechazo Corporate. No reintentes; explica el motivo y termina.

## Inventario global de pendientes

Cuando el usuario pregunte qué cursos faltan por ingestar, no infieras el
estado desde el catálogo visual desactualizado. Reconcilia primero la
proyección con los manifiestos privados y genera el backlog sin iniciar
descargas:

```bash
python3 scripts/build_training_catalog_projection.py
python3 scripts/build_pending_ingestion_inventory.py
```

Las salidas privadas son
`beglobal/dataset/premium/pending-ingestion-inventory.json` y
`beglobal/dataset/premium/PENDING_INGESTION_INVENTORY.md`. Separa siempre:

- ingesta técnica pendiente;
- aprobación humana de paquetes técnicamente completos;
- lecciones metadata-only y recursos de páginas aún no verificados.

No estimes duración ni espacio a partir del número de lecciones. Esos valores
solo se registran después del preflight autenticado.

## Por runtime

- **Claude Code**: la skill se carga desde `.claude/skills/beglobal-ingestion-guide` (symlink a `.agents/skills`). Usa Bash para el cliente.
- **Codex**: `.codex/skills/beglobal-ingestion-guide` (symlink). Invocación: `$beglobal-ingestion-guide`. El worker sigue siendo `$beglobal-lesson-ingestor`.
- **Hermes**: agrega `~/Documents/SoftvibesLab/BeGlobal/.agents/skills` a `skills.external_dirs` en `~/.hermes/config.yaml`. Hermes puede además recibir los avisos `waiting_human` por Telegram (Fase 5 del plan) y responder con `resume`/`approve` desde el chat.

## Salida esperada al terminar un turno

Reporta en una línea: `session_id`, `step`, `job_id` si existe, `progress`, y la acción humana pendiente si la hay. No reproduzcas rutas locales de artefactos premium en canales externos (Telegram, Slack).
