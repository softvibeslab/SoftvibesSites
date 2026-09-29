---
name: behance-design-inspiration
description: Research Behance references for apps, websites, product interfaces, brands, and other visual design work; analyze selected projects, turn patterns into an original design direction, and maintain a provenance-aware inspiration library. Use when a design task would benefit from Behance discovery or when the user shares Behance links they like.
---

# Behance Design Inspiration

Use Behance as research evidence, not as a template library to copy. The outcome is a small, relevant reference set, a reasoned pattern analysis, and original design decisions tied to the product brief.

## Establish the search brief

Infer as much as possible from the active product context. Capture:

- artifact: mobile app, web app, landing page, dashboard, brand, illustration, or another format;
- audience and job to be done;
- priority flows or screens;
- desired emotional qualities and accessibility needs;
- technical constraints and existing brand tokens.

Ask only for information whose absence would materially change the search. Convert broad requests into 3–6 specific search phrases. Combine product type, interaction pattern, audience, and aesthetic; for example, `AI companion avatar mobile onboarding`, not `nice AI design`.

## Route discovery by available capability

Inspect the tools available in the current environment before choosing a provider. Read [references/provider-routing.md](references/provider-routing.md) when selecting, configuring, or troubleshooting a provider.

Use this order:

1. A callable design or Behance MCP with image and source-link output, such as `design_search_images`, `design_search_references`, or `search_behance_projects`.
2. Web and image search scoped to `site:behance.net/gallery`, which is the immediate no-install fallback.
3. An Apify Actor only when Apify is configured and its current pricing has been checked. Estimate cost before any paid run and obtain authorization when required by the active environment.
4. The encoded Behance search URL as a human-browsable fallback. Generate it with `scripts/behance_query.py`; do not treat successful URL construction as proof that automated extraction worked.

Prefer 6–12 high-signal candidates over a large undifferentiated dump. Preserve the exact project URL and creator attribution for every result. If an image URL is available, inspect the actual image rather than relying only on titles or snippets.

## Analyze selected projects

When the user shares a project URL or selects a candidate:

1. Resolve the canonical Behance gallery URL and project identity.
   - For a list of public project URLs, use `scripts/ingest_behance_links.py` to deduplicate tracking URLs and extract public metadata before analysis.
2. Inspect the visible screens or images. Use project-detail MCP tools or a managed scraper when available; use browser extraction only for public content and with conservative limits.
3. Separate observation from inference.
4. Record patterns across these dimensions:
   - information hierarchy and navigation;
   - layout, density, spacing, and responsive behavior;
   - color roles, typography roles, shape language, depth, and motion cues;
   - onboarding, empty states, feedback, progression, rewards, and social mechanics;
   - accessibility risks and usability tradeoffs;
   - what fits the active product and what does not.
5. Translate each useful pattern as `observed pattern → reason it works → original adaptation`. Never recommend copying a distinctive composition, illustration, logo, proprietary asset, or full screen.

For AgenticOS, explicitly test references against: avatar–agent relationship, knowledge transfer, missions, visible progress, skills, marketplace, Media Hub, community matching, human approval, provenance, and the mantra `Menos multitarea. Más flow.`

## Maintain durable project memory

The repository is the durable memory; do not claim that chat memory alone is permanent.

Look for `research/behance/<project>/inspiration-library.json`. If it does not exist and saving is in scope, create it using [references/library-schema.md](references/library-schema.md). Validate it with `scripts/validate_library.py`.

Keep three states distinct:

- `candidate`: discovered by search but not endorsed by the user;
- `favorite`: the user explicitly said they like it or asked to save it as a reference;
- `rejected`: reviewed and intentionally excluded, with a concise reason.

Never infer `favorite` from a search result. Infrastructure links, scraper repositories, and MCP catalogs belong in a provider-evaluation document, not in the design library.

Store source URLs and analysis by default. Download images only when necessary for internal visual analysis, retain creator and source attribution, and never reuse those images as product assets unless licensing explicitly permits it.

The ingestion script only reads public project pages and emits a metadata manifest. It does not grant a license to copy or redistribute the referenced work.

## Deliver the research

Return:

1. the search brief and queries used;
2. a compact gallery of candidates with title, creator when available, source link, and relevance;
3. a cross-reference pattern matrix rather than isolated summaries;
4. an original design direction with concrete UX and visual decisions;
5. rejected patterns or risks;
6. what was saved to the project library and what still needs explicit user selection.

When no extraction route works, provide the encoded Behance URL, explain the limitation precisely, and continue with indexed web results instead of presenting an empty result as success.
