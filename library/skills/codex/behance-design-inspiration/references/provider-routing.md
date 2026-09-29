# Behance provider routing

Use capability checks and current provider metadata. These services and Behance itself can change; re-check schemas, activity, pricing, and terms before production use.

## Recommended architecture

Use a hybrid read-only pipeline:

1. **Discovery:** indexed image/web search or `design-inspiration-mcp-server`.
2. **Direct project search:** a managed Behance search Actor when structured results or higher recall are needed.
3. **Deep ingestion:** project-detail extraction only for references selected by the user.
4. **Fallback:** a correctly encoded Behance URL for manual browsing.

This keeps routine inspiration searches cheap and fast while isolating the brittle direct-scraping step.

## Options evaluated on 2026-08-29

### `YonasValentin/design-inspiration-mcp-server` — preferred MCP for discovery

- Repository: https://github.com/YonasValentin/design-inspiration-mcp-server
- Searches Behance, Dribbble, Awwwards, Mobbin, and Pinterest through Serper with `site:` filters.
- Useful tools: `design_search_images`, `design_search_references`, `design_search_styles`, and `design_extract_tokens`.
- Returns structured image URLs and source links without automating Behance directly.
- Requires `SERPER_API_KEY`; token extraction additionally uses the `dembrandt` CLI.
- Limitation: search-engine coverage and ranking are not identical to Behance's own search.

Choose it when visual discovery and viewable image URLs matter more than exhaustive Behance metadata.

### `headlessagent/behance-search-scraper` on Apify — preferred managed direct search

- Actor: https://apify.com/headlessagent/behance-search-scraper
- Supports independent project, user, asset, and image queries.
- Returns project covers, owners, statistics, colors, dates, and source URLs.
- Its published implementation uses Behance's public GraphQL surface and does not require a Behance login.
- Community-maintained and usage-priced; inspect live pricing and schema before every run.

Choose it when the library needs structured Behance-native result cards or image metadata.

Example input shape:

```json
{
  "projectQueries": ["AI companion avatar mobile app"],
  "imageQueries": ["agent skills marketplace game UI"],
  "maxResults": 12
}
```

### `maximedupre/behance-dribbble-scraper` on Apify — useful cross-platform fallback

- Actor: https://apify.com/maximedupre/behance-dribbble-scraper
- Accepts search terms, direct project URLs, profiles, creative fields, tools, sorting, and limits.
- Useful when Behance and Dribbble should be compared in one dataset.
- Its public page advertised usage pricing from USD 2.70 per 1,000 items at evaluation time; re-check because pricing is mutable.

Choose it for cross-platform portfolio research, not as the default for Behance-only inspiration.

### `jupri/behance-scraper` on Apify — not recommended as default

- Actor/MCP configuration: https://apify.com/jupri/behance-scraper/api/mcp
- Broad scope: projects, assets, images, profiles, and jobs.
- The public page showed USD 25/month plus usage, no monthly active users, and older maintenance signals at evaluation time.

Reconsider only if its live schema or reliability becomes materially better than the alternatives.

### `Arnonfr/behance-mcp-server` — fork candidate, not production default

- Repository: https://github.com/Arnonfr/behance-mcp-server
- Exposes seven well-named Behance tools through stdio MCP and needs no API key.
- Uses Puppeteer plus generated Behance CSS class names; its package declares no real tests or linter.
- Direct scraping is sensitive to markup changes, rate limits, and browser resource usage.
- The evaluated implementation builds a query-parameter search URL while Behance also exposes path-form search URLs.

Use only after a live smoke test. A production fork should prefer stable data attributes or captured JSON/GraphQL responses, enforce a Behance host allowlist, validate all project URLs, limit result counts, add timeouts/backoff, return structured errors, and include fixture-based contract tests.

### `promisefemi/behance-downloader` — selected-project downloader only

- Repository: https://github.com/promisefemi/behance-downloader
- Go CLI/web app that downloads images from one Behance project URL.
- Last evaluated commit was from 2024; extraction depends on `#project-modules img` and has no meaningful test suite.
- Hosted UI: https://behance-downloader.fly.dev/

Do not use for discovery. If needed, self-host an audited fork and run it only on canonical `behance.net/gallery/` URLs chosen by the user.

### `Polyneue/behance-api` — obsolete for new work

- Repository: https://github.com/Polyneue/behance-api
- Node wrapper for the former public Behance API, last updated in 2020 and dependent on deprecated `request`.
- Requires the old Behance API-key registration flow.

Do not build a new MCP on it unless Adobe restores and documents the required public endpoints.

## No-provider fallback

Run:

```bash
python3 scripts/behance_query.py "AI companion avatar mobile app"
```

Use the returned `site_query` with an available web or image search tool. Give the user `behance_url` for manual exploration. In the evaluated environment, direct automated requests to Behance returned HTTP 400 while indexed project pages remained discoverable, so the URL is a navigation fallback rather than an extraction guarantee.

## Apify safety and cost checks

Before a run:

1. Fetch the Actor's live input schema and pricing.
2. Set a small explicit result limit, normally 6–12 for inspiration.
3. Estimate pay-per-event cost and disclose it.
4. Do not store cookies, Adobe credentials, or Apify tokens in the library or tool schema.
5. Save the dataset ID, run ID, query, capture time, and Actor version with imported results.

