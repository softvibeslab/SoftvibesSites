# Ingestion workflow

## 1. Normalize and preflight

Run `scripts/validate_item_url.py ITEM_URL`. Confirm owner, rights scope, output root, requested options, disk space, and available tools. Create or load the item manifest.

## 2. Inspect the authenticated page

Open the stable URL in the user's active browser context. Capture sanitized, structured metadata rather than session-bearing HTML. Record the item type, IDs, course/module/lesson hierarchy, text fields, duration, instructor, resources, and the observed access result.

If the item is a course, create a lesson queue from links actually observed. Do not silently process every child item; apply the rights and access gate to each one.

## 3. Acquire authorized assets

For each video, audio, PDF, document, image, template, or link:

1. record its role and stable source page;
2. obtain the asset only if allowed by the declared scope;
3. keep any runtime playback reference in memory;
4. write to private storage;
5. compute SHA-256 and technical metadata;
6. deduplicate by checksum;
7. quarantine incomplete or invalid downloads.

## 4. Extract and analyze

Transcribe media with segment timestamps and create JSON, TXT, VTT, and SRT when applicable. Extract text/OCR and page citations for documents. Produce a structured analysis covering summary, learning objectives, concepts, process, tools, resources, examples, risks, claims, evaluation, and possible applications.

## 5. Materialize knowledge

Render the technical sheet, lesson manifest, use-case candidates, normalized Graphify Markdown, and ingestion state. Important recommendations require a timestamp or page citation. Connections to pilot cases are `INFERRED` until approved.

## 6. Validate and hand off

Run `scripts/validate_ingestion.py LESSON_DIR --write` (bundled with this skill) and fix every reported problem, or perform the equivalent checks: parse JSON, resolve referenced paths, compare checksums, confirm forbidden values are absent, and verify the percentage derives only from existing evidence.

Update the safe dashboard projection if requested. Do not treat a completed worker job as Corporate approval.

## Hosted control plane

When n8n coordinates the queue, keep execution on the authorized workstation:

1. let the dashboard create a metadata-only job in n8n;
2. let `scripts/remote_runner.py` poll n8n over outbound HTTPS;
3. revalidate and materialize the claimed job in the private local store;
4. execute the same ingestion worker locally;
5. return only status, stage, percentage, the ten stage booleans, runner ID, a bounded message and, when paused, the sanitized `pending` object.

Jobs may be paused (`waiting_human`) and resumed (`kind=resume`) or closed by Corporate (`kind=approval` / `kind=rework`) through the guided webhook; see [checkpoints.md](checkpoints.md).

Load the runner credential from `BEGLOBAL_N8N_RUNNER_TOKEN`. Never place the n8n API key, MCP token, dashboard trigger token, or runner token in Git, command-line arguments, job JSON, prompts, or logs. Keep originals and all premium knowledge artifacts outside n8n.
