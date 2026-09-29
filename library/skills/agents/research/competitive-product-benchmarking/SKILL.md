---
name: competitive-product-benchmarking
description: "Build evidence-backed product and marketplace benchmarks: classify direct, adjacent, substitute, and historical competitors; normalize workflows, pricing, trust, payments, APIs, channels, and adoption; verify current state from first-party sources; derive positioning and product opportunities. Use for competitor matrices, landscape maps, marketplace comparisons, and strategic product benchmarking. Not for public-equity moat analysis."
---

# Competitive Product Benchmarking

Produce a decision-grade benchmark from current first-party evidence. The job is not to collect logos; it is to compare how alternatives solve the same customer job and where the reference product can win.

## 1. Define the reference workflow

Write the baseline in one sentence, then normalize every candidate against the same fields:

- customer job / promised outcome;
- discovery;
- execution;
- pricing unit;
- acceptance, review, and dispute flow;
- payment, escrow, settlement, and payout;
- identity, reputation, and proof of work;
- API, SDK, MCP, or protocol support;
- adoption channel;
- current availability.

Do not compare feature lists without a common transaction or user journey.

## 2. Build the candidate set

Classify candidates before deep research:

- **Direct:** reproduces the end-to-end job and transaction flow.
- **Adjacent:** owns a major layer such as discovery, runtime, distribution, identity, payments, or protocol, but not the complete workflow.
- **Substitute:** satisfies the same job through another executor or delivery model.
- **Historical / not currently verified:** indexed evidence exists, but the live first-party product is gone, redirects elsewhere, or cannot be reconciled.

Include human or manual substitutes when they compete for the same budget. A technically similar platform is not automatically a direct competitor.

## 3. Evidence ladder

Use the highest available rung and stop when it supports the claim:

1. Live first-party product, docs, pricing, terms, or support page.
2. Dated first-party announcement, explicitly labeled historical when appropriate.
3. First-party repository, protocol spec, or on-chain methodology.
4. Independent secondary evidence, clearly labeled.
5. Search snippets only as discovery leads, never as sufficient current-state proof.

For every important assertion, record one of:

- **Confirmed fact** — supported by a live first-party source.
- **Vendor claim** — stated by the provider but not independently audited.
- **Inference** — analyst conclusion from cited facts.
- **Not publicly verified** — evidence is absent, stale, conflicting, or inaccessible.

Never fill missing prices, fees, adoption metrics, or policy details from memory.

## 4. Current-state validation

Before treating a source as current:

1. Open the canonical URL.
2. Follow redirects and inspect the final domain, product name, and page content.
3. Compare the live page with the search claim.
4. Check whether a dated announcement is still reflected in current docs or pricing.
5. Probe all final citations before delivery.

A `200` response after an unexpected redirect is not validation of the original product. A `403` from anti-bot protection is unresolved by a simple probe; retry with browser rendering or anti-bot fetch rather than declaring the source dead.

See `references/current-state-validation.md` for the reusable QA pattern.

## 5. Minimum output

1. Reference product and date of research.
2. Executive conclusion.
3. Classification table.
4. Normalized benchmark matrix.
5. Structured profile for each P0 candidate:
   - confirmed offer;
   - pricing/monetization;
   - trust and transaction flow;
   - technical surface;
   - limits of comparability;
   - strategic implication.
6. Positioning map using two decision-relevant axes.
7. Opportunities in `P0 now`, `P1 after validation`, and `avoid for now`.
8. QA section:
   - high-confidence facts;
   - vendor claims;
   - inference;
   - not verified / do not claim.
9. Numbered first-party sources.

## 6. Strategic synthesis

Prefer opportunities that simplify the buyer journey or strengthen trust:

- package outcomes, not technical components;
- make price and acceptance criteria explicit;
- connect reputation to completed, accepted work;
- use existing channels before building a new destination;
- reuse established payment rails before inventing settlement infrastructure;
- delay open marketplaces, tokens, universal frameworks, and custom escrow until demand proves the need.

Separate `validated gap` from `interesting possibility`. Recommend the smallest product move that can test the gap.

## 7. QA checklist

- [ ] Research date is explicit.
- [ ] Every exact price or fee has a live first-party citation or is labeled historical.
- [ ] Redirect targets were semantically inspected.
- [ ] Launch posts are not presented as current policy without revalidation.
- [ ] Claims, facts, inferences, and unknowns are separated.
- [ ] Direct, adjacent, substitute, and historical classifications use the same rule.
- [ ] Broken canonical URLs were repaired.
- [ ] Sources cited were actually fetched in this session.
- [ ] No credentials, tokens, or private data appear in the report.
- [ ] The final recommendation names what to do now and what was deliberately skipped.

## Pitfalls

- A crawler can report success while returning unrelated redirect content.
- Search indexes can preserve pricing after a product disappears.
- “Marketplace” may mean only a searchable directory, not a transaction system.
- “Payments supported” does not imply escrow, acceptance, disputes, or marketplace demand.
- Provider metrics are not independent evidence merely because they are on-chain; inspect methodology and scope.
- Missing public pricing is a finding, not a blank to fill.

## Boundary with other skills

- Use `research` for general research routing.
- Use `deep-research` when a wrong answer is expensive and multi-round triangulation is required.
- Use `competitor-analysis` for public-equity moat and investment analysis.
- Use this skill for product, platform, marketplace, workflow, and GTM benchmarks.
