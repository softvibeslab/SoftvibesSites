---
name: datastudio-qa
description: Use this skill when the user asks to "QA the dashboard", "verify the Looker Studio dashboard", "verify the Data Studio dashboard", "check dashboard numbers against Excel", "audit the dashboard", or "compare dashboard to source data". Provides the workflow for validating a Looker Studio dashboard against a local `.xlsx` source file using the `datastudio` CLI. Use this skill any time the user wants to validate, spot-check, or cross-reference a Looker Studio / Data Studio report against a spreadsheet, even if they don't say "QA" explicitly.
---

# Looker / Data Studio QA

The goal is to catch drift between what the dashboard displays and what the source workbook actually contains, both in the default view and under each filter.

## Prerequisites

- `datastudio` CLI installed and on `PATH` (install once with `uv tool install git+https://github.com/spookyuser/datastudio-cli`). If `datastudio --help` fails, stop and ask the user to install it before proceeding.
- `uv` on `PATH` (required for the install above). If `uv --version` fails, stop and ask the user to install it from https://docs.astral.sh/uv/getting-started/installation/ — do not try to install `uv` yourself or fall back to `pip`/`pipx`.
- A source `.xlsx` file available locally. Ask the user for the filename if you cannot find one in the working directory — `.xlsx` files are often gitignored.
- A Looker Studio reporting URL that is shared with anonymous viewers.

Do not assume sheet names, column positions, or expected values. Discover them from the workbook and the dashboard on each run.

## CLI reference

Run every command as `datastudio <command>`.

| Command | Purpose |
|---------|---------|
| `connect <url>` | Connect to the dashboard. Must run first; persists session in `.datastudio/`. |
| `pages` | List data pages (exclude dividers). |
| `go <name\|index>` | Navigate to a page. |
| `data --format json [--component <tok>] [--all-pages]` | Extract component data. Use `--component` for a single component, `--all-pages` for everything. |
| `data --format csv` | CSV output for diffing against Excel exports. |
| `filters` | List dimensions, options, and currently active values. |
| `filter <dim> <value>…` | Apply filter values (exact option strings from `filters`). |
| `filter reset [<dim>]` | Clear all filters or one dimension. |

## Workflow

1. **Connect.** `datastudio connect "<url>"`.
2. **Baseline.** Record, on the landing page with all filters cleared:
   - respondent / row count,
   - headline KPI values (big-number tiles),
   - means of the key numeric columns the dashboard exposes.
   These are your reference points for detecting drift when filters are applied.
3. **Map pages.** `datastudio pages`. Work through each data page.
4. **Per page**, for each component:
   - `datastudio go "<page>"`
   - `datastudio data --format json` — returns every component on the current page in `components[]`; reach for `--component <token>` only when a single tile needs re-extraction after a filter change.
   - Derive the expected value from the workbook (see snippet below) and compare.
5. **Filter checks.** Use `filters` to discover dimensions, apply one at a time, re-run `data`, and confirm aggregates move in the same direction the workbook predicts. Then `filter reset`.
6. **Report.** Write findings (see format below).

## Reading the source workbook

Use `openpyxl` inline — the correct column layout varies per workbook, so inspect headers first, then compute.

```python
# uv run --with openpyxl python
import openpyxl
wb = openpyxl.load_workbook("<file>.xlsx", data_only=True)
ws = wb["<sheet>"]
headers = [c.value for c in ws[1]]
idx = {h: i for i, h in enumerate(headers)}
rows = [r for r in ws.iter_rows(min_row=2, values_only=True) if any(r)]
# Example: mean of a numeric column, filtered by a demographic column
vals = [r[idx["<metric>"]] for r in rows
        if r[idx["<demographic>"]] == "<value>"
        and r[idx["<metric>"]] is not None]
print(len(vals), sum(vals) / len(vals))
```

Pull column names from the workbook; do not hard-code them between runs.

## Filters and anonymity thresholds

Dashboards commonly suppress segments below a minimum respondent count (n<4 or n<5 is typical) to protect anonymity. If a filter combination returns a row count the dashboard hides or reports as "—", that is expected behavior, not a bug — verify it against the workbook's own count for that segment.

## Reporting format

For each page, report:

- **Page name**
- **Components checked** (by name or index)
- **Discrepancies**: dashboard value vs expected workbook value, with the column and filter used to compute the expected value
- **Filter behavior**: whether applying each filter moved the numbers the way the workbook predicts
- **Confidence**: exact match, within rounding, or approximate (and why)

### Example comparison

Dashboard "Average Engagement" tile reads **3.42** with `Region=North` applied. Workbook: `mean(engagement_score where region == "North") = 3.417` across 128 rows. → **Within rounding** (tile shows 2 decimals). Report as a pass, not a discrepancy.
