# Atelier Noisette analysis and landing preview

A local, read-only Softvibes concept based exclusively on public information visible on Atelier Noisette's Instagram and Threads profiles on 2026-07-23.

## Artifacts

- `site/index.html`: proposed customer-facing landing.
- `site/analisis/index.html`: private sales analysis (`noindex, nofollow`).
- `research/sources.md`: evidence ledger and explicit unknowns.
- `openspec/changes/analysis-and-landing-preview/`: scope, behavior, and acceptance criteria.
- `scripts/verify.py`: deterministic static verification.

## Run locally

```bash
python3 -m http.server 4187 --bind 127.0.0.1 --directory site
```

Open:

- Landing: `http://127.0.0.1:4187/`
- Analysis: `http://127.0.0.1:4187/analisis/`

## Verify

```bash
python3 scripts/verify.py
```

## Safety boundary

This preview does not collect data, process payments, send orders, or prove current prices, inventory, service area, response time, ownership, or legal details. Its order CTA returns to the verified public Instagram profile until Atelier Noisette supplies an approved WhatsApp or ordering URL. Public-source images are retained only as attributed research evidence and preview placeholders; replace them with authorized high-resolution originals before any publication.
