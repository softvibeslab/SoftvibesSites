# Access and rights policy

## Required gate

Technical access does not establish download, reuse, publication, or redistribution rights. Before downloading or processing, require:

- an accountable `owner`;
- `rights_confirmed=true`;
- one explicit scope: `analysis_internal`, `private_reproduction`, or `controlled_download`;
- an accessible source in the user's own authorized session.

## Credentials and transient data

- Prefer the active Chrome/browser session.
- If authentication expired, pause while the user logs in directly.
- Never ask the user to paste a password, cookie, bearer token, authorization header, session token, or signed media URL into the prompt, dashboard job, manifests, logs, or reports.
- Remove query strings and fragments from persistent source URLs.
- Keep discovered playback URLs in memory only.

## Stop conditions

Stop the affected item and record a reason when access is denied, entitlement is absent, login requires user action, rights are not confirmed, media is DRM-protected, the file fails integrity checks, or available disk space is insufficient.

Do not broaden authorization from one lesson to another. A course or catalog listing may be inventoried, but each protected item still needs observed access and the recorded scope.

## Publication

Originals, transcripts, extracted documents, analyses, technical sheets, and Graphify results inherit `premium` unless a Corporate approval record explicitly says otherwise. Public dashboard projections may expose only safe metadata and percentage/status fields.
