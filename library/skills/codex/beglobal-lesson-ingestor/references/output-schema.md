# Output contract

Use this layout under the configured private root:

```text
courses/<course_id>/lessons/<lesson_id>/
├── page-metadata.json
├── lesson.manifest.json
├── ingestion-state.json
├── technical-sheet.md
├── analysis.md
├── use-case-links.json
├── approval.review.json
├── media/
├── resources/
├── transcript/
└── graphify/
    └── lesson.md
```

## Manifest minimum

The manifest records schema version, source system, normalized source URL, item IDs, access tier, rights status/scope, access evidence without credentials, assets with role/path/bytes/MIME/SHA-256, knowledge artifacts, pipeline version, and stage state.

## Stage state

Use these boolean keys:

```text
cataloged
access_verified
lessons_indexed
media_registered
content_extracted
analysis_created
technical_sheet
use_cases_linked
graphify_indexed
human_approved
```

`human_approved` is true only when an approval record names the approver, records the decision time, confirms the rights scope, and completes every required review item.

## Page metadata

Include stable IDs, normalized URL, course/module/lesson hierarchy, title, instructor, description, displayed duration, navigation order, resource inventory, page features, access observation, inspection time, and missing-field notes. Exclude raw cookies, credentials, headers, player manifests, signed URLs, and full session HTML.

## Validation record

Record whether every JSON file parses, every declared artifact exists, checksums match, premium files remain private, transient secrets are absent, and calculated stage progress matches the dashboard projection.
