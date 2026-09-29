---
name: documentation-knowledge-pipelines
description: Build and maintain auditable knowledge bases from complete technical documentation sites and official example repositories. Use when the output includes an immutable corpus, Obsidian-compatible wiki, catalogs, deduplication, knowledge graph, GraphRAG exports, or coverage validation.
---

# Documentation Knowledge Pipelines

Turn official technical documentation and example repositories into a reproducible corpus, navigable wiki, and provenance-preserving knowledge graph.

## Core contract

Produce four distinct layers:

1. `raw/` — immutable official sources and manifests.
2. `wiki/` — normalized notes, concepts, entities, catalogs, and synthesis.
3. `graph/` — interactive and machine-readable graph exports.
4. `reports/` — crawl, deduplication, coverage, and validation evidence.

Never edit or translate `raw/`. Derived layers must be rebuildable from it.

## Workflow

### 1. Define scope

- Record allowed domains and official repositories.
- Exclude API branches, social sites, generated reference pages, or external links unless explicitly needed.
- Decide whether synthesis/navigation should be translated while technical terms, code, commands, and model names remain verbatim.

### 2. Discover native sources first

Use this priority order:

1. Official `llms.txt` or machine-readable index.
2. Page-level Markdown endpoints.
3. Official source repository or documented API.
4. Sitemap as a completeness check.
5. Rendered HTML/browser crawling only for missing content.

A blocked sitemap does not prove the documentation is inaccessible. GitBook deployments may still expose `llms.txt` and `.md` pages.

### 3. Capture an immutable corpus

- Download with bounded concurrency, retries, exponential backoff, and an identifying User-Agent.
- Save pages independently for resumability.
- Manifest every source with URL/path, capture timestamp, status, local path, and SHA-256.
- Shallow-clone official repositories when notebooks/examples contain the real implementation detail.

### 4. Normalize notebooks and examples

- Parse `.ipynb` as JSON.
- Retain Markdown and code cells.
- Remove execution outputs, embedded media, and transient execution state unless explicitly required.
- Hash normalized content and consolidate duplicates while preserving all original paths as aliases and provenance.

### 5. Build the wiki

- Create source notes, notebook/example notes, concept/entity notes, and synthesis pages.
- Generate complete documentation and notebook catalogs so every source has an inbound navigation path.
- Use Obsidian wikilinks.
- Normalize slugs with Unicode NFKD before ASCII conversion.
- Materialize every concept targeted by generated links.
- Keep citations back to the immutable source.

### 6. Build the graph

Each relationship should include:

- source and target IDs;
- relation type;
- source URL or repository path;
- evidence or excerpt where practical;
- confidence for inferred relationships.

Export at least:

- JSON for GraphRAG/programmatic use;
- GraphML for Gephi/yEd;
- Cypher for Neo4j;
- interactive HTML for human inspection.

### 7. Validate before delivery

A project-specific validator must confirm:

- discovered/downloaded/failed counts reconcile;
- manifest entries match local files;
- no unexplained empty documents;
- original and canonical notebook counts reconcile with duplicate groups;
- required catalogs and graph exports exist;
- all Obsidian wikilinks resolve;
- graph nodes/edges are non-empty and structurally valid.

Also report connected components and orphan pages. Generic wiki linters can misclassify transclusions or links outside `wiki/`; verify those paths with a project-specific resolver rather than weakening the gate.

## Minimal update loop

1. Refresh the native documentation index and changed pages.
2. Pull official repositories.
3. Rebuild `wiki/` and graph outputs from `raw/`.
4. Run validation.
5. Deliver only on `status: ok`.

## Deliverable summary

Report corpus counts, unique/duplicate notebook counts, wiki page count, graph node/edge counts, broken-link count, validation status, and exact entry paths.

## Reference

See `references/gitbook-notebooks-pattern.md` for the reusable GitBook + notebook-repository pattern and its failure modes.
