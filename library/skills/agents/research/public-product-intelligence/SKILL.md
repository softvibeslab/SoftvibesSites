---
name: public-product-intelligence
description: Build an evidence-backed knowledge base about a public digital product from its website, docs, repositories, and market sources. Use for requests combining ethical scraping, wiki construction, competitive benchmark, market analysis, business model, public architecture reconstruction, and a build/partner/skip plan.
---

# Public Product Intelligence

Turn a public product footprint into a decision-grade corpus. Do not confuse a crawl with research: extraction, normalization, verification, analysis, and recommendation are separate stages.

## Operating principles

- Respect `robots.txt`, public access boundaries, rate limits, copyright, and terms. Never evade authentication or technical controls.
- Treat first-party copy as evidence of positioning. It is not independent proof of adoption, performance, revenue, or quality.
- Separate `observed`, `documented`, and `inferred` architecture; attach confidence to every inference.
- Preserve raw evidence separately from normalized entities and analytical notes.
- Prefer primary sources; triangulate important claims with independent sources.
- Design the smallest research plan that can change a product decision. Do not crawl unrelated pages “for completeness.”

## Workflow

### 1. Frame the decision

Write the decision the research must support: build, differentiate, partner, acquire, or skip. Define users, geography, time horizon, and what evidence would change the answer.

### 2. Discover the public surface

1. Fetch `robots.txt` and sitemap(s).
2. Count URLs by route/template family.
3. Identify official docs, changelogs, repositories, social channels, stores, and public APIs.
4. Fetch one representative URL from every route family before the full crawl.
5. Derive the extraction schema from those samples.

For the detailed corpus pattern, read `references/public-product-intelligence-corpus.md`.

### 3. Capture evidence

For each public URL retain:

- canonical URL, HTTP status, content type, fetch time, and content hash;
- raw HTML or Markdown;
- title, description, headings, JSON-LD, Open Graph, and links;
- structured facts relevant to the product: catalog items, categories, prices, turnaround, channels, CTAs, examples, limitations;
- crawl errors, redirects, duplicates, and missing templates.

Use low concurrency and bounded retries. Do not collect personal data unless it is essential, public, and lawful.

### 4. Normalize entities

Create explicit entities such as `Source`, `Claim`, `CatalogItem`, `Category`, `Price`, `UseCase`, `Competitor`, `Repository`, and `ArchitectureComponent`. Put source URLs and dates on the record, not only in prose.

### 5. Verify claims

Maintain a claim ledger. Mark every material statement as:

- `first-party claim`;
- `independently corroborated`;
- `contradicted`;
- `not verifiable from public evidence`.

Record contradictions instead of averaging them away. Vendor-authored comparison pages are positioning evidence, not neutral benchmarks.

### 6. Map the market

Define the category before sizing it. Separate:

1. direct products solving the same job with a similar delivery model;
2. adjacent products;
3. enabling platforms/protocols;
4. horizontal software substitutes;
5. human/service substitutes.

Use consistent benchmark dimensions: buyer, job, offering, supply model, input channel, pricing, risk allocation, discovery, routing, quality controls, context/memory, delivery, developer UX, payments, trust, distribution, and defensibility.

Size the market with at least two methods. Prefer bottom-up formulas with explicit assumptions over a broad “AI market” headline.

### 7. Model the business

Cover both value creation and marketplace mechanics:

- buyer and supplier sides;
- activation and recurring use;
- transaction frequency and ticket;
- take rate or gross margin;
- inference/tool cost, failed-output cost, support, fraud, and refunds;
- liquidity, fill rate, routing success, acceptance rate, rerun rate;
- CAC, retention, LTV, and contribution margin;
- cold start, adverse selection, reputation, and flywheels.

If numbers are unavailable, create editable conservative/base/high scenarios and label assumptions.

### 8. Reconstruct public architecture

Investigate client channels, identity, catalog/discovery, task intake, classifier/router, queue, workers, tools/models, progress streaming, artifact storage, evaluation, review/acceptance, ledger/settlement, SDK/API/webhooks/protocols, observability, moderation, security, and privacy.

Never present an inferred stack as fact. Public repositories may lag production.

### 9. Propose the minimum alternative

Do not copy code, brand, or protected content. Solve the underlying job.

A new two-sided marketplace is rarely the lazy first step. Start with a curated first-party catalog and add open supply, public reputation, complex settlement, or on-chain components only after demand, quality, and liquidity are demonstrated.

### 10. Build the wiki

Use a source-linked structure:

- executive summary and thesis;
- product and journeys;
- market and competitors;
- business model and economics;
- architecture and security;
- evidence, claims, and sources;
- decisions, MVP, and roadmap.

Every analytical note should link to evidence. The wiki must remain understandable without the originating chat.

## Deliverables

- crawl manifest and structured dataset;
- catalog/taxonomy of the target product;
- claim ledger and contradiction report;
- market definition, TAM/SAM/SOM, trends, and ICP/JTBD;
- competitive map, benchmark matrix, and priority profiles;
- business model canvas and unit-economics scenarios;
- public architecture diagrams with confidence labels;
- risk register;
- executive recommendation: build, differentiate, partner, or skip;
- minimum MVP and measurable roadmap.

## Quality gates

- Every sitemap URL is attempted or explicitly excluded.
- Every route family has a manually reviewed sample.
- Material numbers carry source, date, and assumptions.
- Claims, observations, and inferences are visibly distinct.
- Direct competitors and substitutes are not mixed into one ranking.
- The recommendation states what not to build and what evidence would reverse it.

## Pitfalls

- Crawling everything before understanding templates.
- Treating SEO page counts or “online” labels as evidence of active supply.
- Repeating vendor comparisons as independent findings.
- Using one speculative market-size report as TAM.
- Drawing production architecture directly from an old public repository.
- Building protocol, blockchain, or marketplace complexity before it solves a measured constraint.
