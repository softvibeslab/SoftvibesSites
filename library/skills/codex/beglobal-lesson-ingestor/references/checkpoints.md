# Human checkpoints and job kinds

## Outcome line

End the final response with exactly one line, no code fence:

```text
BEGLOBAL_JOB_OUTCOME={"status":"succeeded|failed|waiting_human","stage":"...","message":"...","stage_state":{...},"pending":{...}}
```

- `stage_state`: all ten booleans from `ingestion-state.json` (`cataloged`, `access_verified`, `lessons_indexed`, `media_registered`, `content_extracted`, `analysis_created`, `technical_sheet`, `use_cases_linked`, `graphify_indexed`, `human_approved`). n8n recomputes the percentage from these weights (10/10/10/15/15/15/10/5/5/5) and ignores any other number.
- `succeeded` requires `stage="complete"`. It does not mean approved: `human_approved` stays `false` until Corporate decides.
- `failed` is only for technical errors that no human action can unblock.
- `waiting_human` requires `pending`.

## `pending`

```json
{"reason":"access_required|disk_confirmation|scope_expansion|restricted",
 "prompt":"short instruction for the human (no paths, no playback URLs, no tokens)",
 "fields":[{"field":"confirm_download","type":"boolean","required":true}],
 "facts":{"estimated_gib":4.2,"duration_hours":3.1,"free_gib":118.5,"drm":false}}
```

| reason | when | expected answer in `resume_data` |
|---|---|---|
| `access_required` | the dedicated Chrome (`scripts/start_beglobal_chrome.sh`) is not running, is not signed in, or the page shows login, `Adquirir` or an entitlement wall | `logged_in=true` |
| `disk_confirmation` | preflight estimate above 2 GiB or above 20 % of free space | `confirm_download=true|false` |
| `scope_expansion` | the declared `rights_scope` does not cover a needed action | new `rights_scope`, `owner`, `rights_confirmed=true` |
| `restricted` | DRM (`SAMPLE-AES`, non-identity keyformat) or paywall | none; the job cannot be resumed |

`facts` accepts numbers, booleans and short strings only. The runner rejects any prompt or fact containing `http`, `/Users/`, `.m3u8`, `cookie`, `bearer`, `authorization` or `token=`, and the job would then be marked as a protocol error, so keep them clean.

Preflight for `disk_confirmation`: run `download_beglobal_hls.py --preflight-only` (or the equivalent HLS inspection) before acquiring media, and pause when the estimate crosses the threshold.

## Job kinds

| kind | input | what to do |
|---|---|---|
| `ingest` | request only | full pipeline for the item |
| `resume` | `resume_data` with `reason` and the answer | continue from existing artifacts; if `confirm_download=false`, skip media, keep `media_registered=false`, finish every other stage |
| `approval` | `approval` with `approver`, `decision` (`approve`/`reject`), `notes` | write `approval.review.json` (approver, decision, notes, `decision_time`), set `human_approved` accordingly in `ingestion-state.json` and the manifest, run `validate_ingestion.py --write`, rebuild the safe projection when `update_dashboard=true`, publish only when `publish_dashboard=true` |
| `rework` | `approval` with `decision=return` and `notes` | revise analysis, technical sheet and use-case links per the notes; keep originals untouched and `human_approved=false` |

Never create a job, change `rights_scope` or approve on your own initiative; those decisions arrive from the control plane.
