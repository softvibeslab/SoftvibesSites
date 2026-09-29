# Inspiration library schema

The library stores decisions and provenance, not a mirror of Behance.

Default location:

```text
research/behance/<project>/inspiration-library.json
```

Minimum shape:

```json
{
  "schema_version": "1.0",
  "collection": {
    "id": "agenticos",
    "name": "AgenticOS design inspiration",
    "purpose": "Reference patterns for the AgenticOS product experience",
    "updated_at": "2026-08-29"
  },
  "search_seeds": [
    {
      "query": "AI companion avatar mobile app",
      "behance_url": "https://www.behance.net/search/projects/AI%20companion%20avatar%20mobile%20app",
      "status": "active"
    }
  ],
  "items": [
    {
      "id": "behance-123456789",
      "status": "candidate",
      "liked_by_user": false,
      "title": "Example project",
      "creator": "Creator name",
      "source_url": "https://www.behance.net/gallery/123456789/Example-project",
      "captured_at": "2026-08-29",
      "discovered_by": {
        "provider": "web-search",
        "query": "AI companion avatar mobile app"
      },
      "product_fit": ["avatar", "onboarding"],
      "observations": [],
      "adaptations": [],
      "risks": [],
      "notes": ""
    }
  ]
}
```

## Invariants

- `source_url` is the canonical public Behance gallery URL and is unique.
- `status` is `candidate`, `favorite`, or `rejected`.
- `favorite` requires `liked_by_user: true`.
- Every observation is traceable to a visible screen, image, or published project description.
- `adaptations` describe original product decisions; they do not instruct copying.
- Preserve `creator`, capture date, discovery provider, and query.
- Store provider/repository links elsewhere; they are not design items.
- Do not download or redistribute project assets without a compatible license.

Run `scripts/validate_library.py <path>` after updates.

