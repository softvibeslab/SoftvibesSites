---
name: beglobal-lesson-ingestor
description: Ingest an authorized BeGlobal Pro course or lesson URL through the user's active browser session, inventory the complete page and resources, register permitted media privately, extract and analyze its content, and generate a traceable technical sheet and manifests. Use for individual BeGlobal catalog items or dashboard-triggered ingestion jobs; do not use for public scraping, credential handling, entitlement bypass, or DRM circumvention.
---

# BeGlobal Lesson Ingestor

Turn one stable BeGlobal Pro item URL into a resumable premium knowledge package. The URL is always an input; never hardcode the pilot lesson.

## Inputs

Accept natural-language inputs or a trigger job containing:

- `item_url` (required): stable `https://platform.example.invalid/cursos/...` course or lesson URL;
- `owner` (required for downloads): person or role accountable for the ingestion;
- `rights_confirmed` and `rights_scope` (required for downloads or processing);
- `download_media`, `download_resources`, `analysis_level`, `run_graphify`, `update_dashboard`, and `publish_dashboard` options.

Validate and normalize the URL with `scripts/validate_item_url.py`. Strip query parameters and fragments so session or signed values never enter manifests.

## Route the work

Read [references/rights-policy.md](references/rights-policy.md) before any browser or download action. Read [references/workflow.md](references/workflow.md) for acquisition and processing. Read [references/output-schema.md](references/output-schema.md) when creating or validating artifacts.

When invoked by the Training dashboard, the loopback bridge already validates the job envelope. Revalidate it anyway; dashboard authorization is evidence, not a substitute for source entitlement.

For a hosted n8n trigger, use the outbound-only runner in `scripts/remote_runner.py`. Keep the n8n API/MCP credential separate from the runtime runner token, load the runner token only from `BEGLOBAL_N8N_RUNNER_TOKEN`, and persist only safe job metadata in n8n. Never send local artifact paths, originals, transcripts, browser data, or playback references to the control plane.

## Browser access

In `codex exec` there is no built-in browser. Use the `chrome-devtools` MCP server (configured globally in `~/.codex/config.toml` with `--browserUrl http://127.0.0.1:9223`). It attaches to a dedicated Chrome window with its own private profile that the owner starts with `scripts/start_beglobal_chrome.sh` from the workspace and signs into once; there are no consent dialogs on that instance. Use only navigation, snapshot and screenshot tools on `beglobalpro.org` pages; never use network or storage tools to read cookies, headers or media manifests. If `list_pages` fails or the lesson is not signed in there, finish with `waiting_human` / `access_required` and a `pending.prompt` that tells the owner to run `scripts/start_beglobal_chrome.sh <item_url>` and sign in; do not claim the page was inspected.

## Required behavior

1. Reuse the user's active browser session. If login is required, ask the user to enter credentials directly in the browser; never request, echo, copy, or persist them.
2. Confirm the item is actually accessible and record only observed courses, modules, lessons, resources, and entitlement evidence.
3. Inventory the whole page, not only the player: title, description, instructor, navigation, duration, attachments, PDFs, templates, links, and available actions.
4. Download only assets explicitly covered by the recorded rights scope. Keep playback URLs in memory and never write cookies, authorization headers, session tokens, or signed URLs.
5. Refuse DRM/paywall bypass. Record `restricted` or `access_required` and stop that asset cleanly.
6. Resume from `lesson.manifest.json`; reuse matching checksums and never download a valid original twice.
7. Inspect originals and resources with MIME detection, byte size, SHA-256, and format-specific metadata. For media, include duration, streams, codecs, resolution, and frame rate.
8. Produce timestamped transcripts/subtitles for media and page-aware extraction/OCR for documents when requested.
9. Generate analysis and the complete technical sheet from `assets/technical-sheet-template.md`. Write `no informado` for absent facts; do not infer missing metadata.
10. Mark extracted statements, inferred use-case connections, and ambiguous relations distinctly. Never approve the lesson automatically.
11. If `run_graphify=true`, invoke the available Graphify workflow on the normalized premium corpus and keep its output physically separate from public graphs.
12. If `update_dashboard=true`, rebuild the safe local catalog projection from material artifacts. Publish to Hostinger only when `publish_dashboard=true` was explicitly selected and the public payload contains no premium media, transcript, credentials, or temporary URLs.

## Job kinds and human checkpoints

Dashboard and agent jobs arrive with a `job_kind`: `ingest` (default), `resume`, `approval` or `rework`. Read [references/checkpoints.md](references/checkpoints.md) for the exact rules. In short:

- When a human action can unblock the job (login, disk confirmation, wider rights scope), finish with `status=waiting_human` and a structured `pending` object instead of failing. `restricted` (DRM, paywall) is also reported as `waiting_human` but cannot be resumed.
- `resume` jobs carry `resume_data` with the human answer; continue from existing artifacts and never repeat materialized stages.
- `approval` jobs only write `approval.review.json`, update `human_approved`, recompute validation and rebuild the safe projection. `rework` jobs revise knowledge artifacts according to `approval.notes` and leave `human_approved=false`.
- Always report `stage_state` (the ten booleans) in the outcome line so n8n can derive the percentage from material evidence.
- Run `scripts/validate_ingestion.py LESSON_DIR --write` before declaring `succeeded`.

## Completion contract

Finish only when the manifest and validation record agree with the files on disk. Report completed, skipped, restricted, and pending-human stages separately. A successful technical pipeline may remain below 100% while rights or Corporate approval is pending.

The loopback dashboard bridge lives in `scripts/trigger_server.py`. It binds only to `127.0.0.1`, requires a short-lived token, checks the dashboard Origin, stores jobs under the selected workspace, and invokes Codex without shell interpolation when execution mode is enabled. The hosted alternative in `scripts/remote_runner.py` makes outbound HTTPS requests to n8n, preserves the server job ID locally, revalidates every job, and returns only status, progress, stage, and a bounded message.
