---
name: website-intelligence
description: Build an auditable knowledge base from a public product or company website, then use it for product, market, competitor, business-model, and architecture analysis. Use for requests combining site scraping/crawling with a wiki, benchmark, executive report, or build plan.
---

# Website Intelligence

Turn a public website into a reproducible evidence corpus and a decision-grade wiki. This skill joins four concerns that must stay connected: respectful crawling, structured extraction, claim verification, and strategic synthesis.

## Operating rule

Raw pages are evidence, not conclusions. Marketing copy stays labeled as a first-party claim until independent sources corroborate it.

## Workflow

### 1. Frame the decision

Write the underlying decision and 3–5 falsifiable questions before crawling. Examples: build vs partner, category position, defensibility, or architecture choice.

### 2. Inventory before extraction

1. Fetch `robots.txt` and sitemap(s).
2. Count URLs by path family to identify templates.
3. Check guessed routes such as `/docs`; never infer they exist from product copy.
4. Define scope, rate limit, user agent, and excluded authenticated/private surfaces.

### 3. Build a two-layer corpus

- Evidence layer: immutable page snapshots plus URL, timestamp, status, content type, canonical, hash, links, JSON-LD and clean text.
- Analysis layer: normalized entities such as products, agents, tasks, prices, use cases, comparisons, claims and sources.

Prefer JSON-LD and stable metadata over brittle nested selectors. Use stdlib for static HTML when sufficient; use a rendering service/browser only for content that truly requires JavaScript.

### 4. Generate the wiki

Create an index and thematic areas for Product, Market, Competition, Business Model, Architecture, Evidence and Decisions. Every analytical note links back to source records. Keep raw capture separate from LLM-authored synthesis.

### 5. Validate before analysis

Leave one executable check covering:

- sitemap count equals corpus count;
- every allowed page has status, timestamp and hash;
- required datasets exist;
- extracted text is non-empty or the failure is explicit;
- entity totals match page-family inventory after excluding collection roots.

### 6. Research beyond the target site

Classify alternatives before comparing them:

1. direct marketplaces/products;
2. adjacent infrastructure or protocols;
3. builders and operator platforms;
4. horizontal software substitutes;
5. human/service substitutes.

Use current primary sources for every competitor. Do not use the target company's comparison pages as neutral evidence.

### 7. Synthesize for action

Produce, as required: executive report, category definition, benchmark, TAM/SAM/SOM with formulas and assumptions, Business Model Canvas, unit economics, public architecture with confidence levels, risks, MVP, and build/partner/differentiate/skip recommendation.

## Phase communication

Long investigations do not continue between chat turns unless a real tracked background process or scheduled job was launched. At each boundary report:

- completed and verified;
- currently running, if anything;
- next but not running.

Never use “sigue” in a way that implies unattended work is active.

## Quality gates

- 100% of sitemap URLs attempted.
- Failures are preserved, not dropped.
- Claims, facts and inferences are separate fields.
- Important external claims are triangulated.
- Technical reconstruction labels confidence high/medium/low.
- Counts and calculations come from runnable tooling.
- The wiki remains useful without the original chat.

## Minimal artifacts

```text
<root>/
├── 00 - Plan.md
├── 01 - Índice.md
├── Producto/
├── Mercado/
├── Competencia/
├── Negocio/
├── Arquitectura/
├── Evidencia/{Páginas,Datasets}/
└── scripts/{capture,extract,validate}.py
```

## Pitfalls

- Event sites may embed complete speaker/session data in script JSON while visible cards show only summaries. Preserve that JSON, validate every relation, and distinguish featured guests without assigned sessions.
- Checkpoint each researched person's dossier and source attempts immediately. After a batch timeout, inspect files before repeating work; split remaining people into smaller batches. Dossier coverage is not independent corroboration: record those separately.
- For an event-agent handoff, run a real chat acceptance test against the corpus, including a normal schedule question and unresolved cases such as TBC titles and unscheduled guests. Preserve the response; do not pass an agent that invents missing details.

- A collection root (`/agents/`) is a page but not an agent entity.
- Repeated FAQs inflate raw claim counts; preserve source claims, then deduplicate semantically during synthesis.
- A repository may be public but stale relative to production.
- On-chain, A2A, SDK, user-count, timing and revenue statements remain claims until evidence supports them.
- Do not start with a marketplace architecture when a curated first-party catalog can test demand with less complexity.

## References

- `references/sitemap-to-wiki-corpus.md` — detailed capture, extraction, Obsidian layout and validation pattern.
