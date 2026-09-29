---
name: datastudio-cli
description: Use this skill whenever the user wants to query, explore, extract, or filter data from a Looker Studio / Data Studio dashboard using the `datastudio` CLI — connecting to a reporting URL, listing pages, pulling component data, exporting CSVs, inspecting filters, or experimenting with filter combinations. Trigger phrases include "connect to this Looker Studio dashboard", "pull data from this report", "what filters are on this dashboard", "export the KPIs", "dump the dashboard to CSV", "show me the pages", "see what Region=North looks like", and anything that involves driving the dashboard programmatically without comparing to a source file. If the user wants to validate dashboard numbers against a source `.xlsx`, prefer the `datastudio-qa` skill instead.
---

# Driving Looker / Data Studio dashboards with the `datastudio` CLI

This skill is for *using* a Looker Studio dashboard through the CLI — extracting values, understanding its pages and filters, exporting data, and exploring how numbers change under different filter combinations. It covers everything except the QA-against-Excel workflow (that's `datastudio-qa`).

## Prerequisites

- `datastudio` CLI on `PATH`. If `datastudio --help` fails, install with `uv tool install git+https://github.com/spookyuser/datastudio-cli`, then stop and confirm with the user before continuing — don't silently assume the install succeeded.
- `uv` on `PATH` (required for the install above). If `uv --version` fails, stop and ask the user to install it from https://docs.astral.sh/uv/getting-started/installation/ — do not try to install `uv` yourself or fall back to `pip`/`pipx`.
- A Looker Studio reporting URL shared with anonymous viewers. No auth or API keys.
- A working directory — session state persists in `./.datastudio/`, so run commands from the same place each time.

## Command reference

All commands exit `0` on success. Most emit JSON, which is what you want for programmatic use — keep `--format json` unless the user specifically wants CSV or a human-readable table.

| Command | Purpose |
|---------|---------|
| `datastudio connect "<url>"` | Connect to a dashboard. Must run first. Returns `dashboard_title`, `session_id`, `data_page_count`, `global_filter_count`. |
| `datastudio pages [--all]` | List data pages. Add `--all` to include dividers (section headers, not data pages). |
| `datastudio go "<name\|index>"` | Navigate to a page. Fuzzy match by name or pick by integer index. |
| `datastudio data --format json` | Extract every component on the current page — `components[].value_data{columns, rows, row_count, error?}`. |
| `datastudio data --format json --component <token>` | Extract one component by id/token. Use this to re-pull a single tile after changing filters, not as a first resort. |
| `datastudio data --format json --all-pages` | Extract components from every page in one call. Expensive — only when the user explicitly wants everything. |
| `datastudio data --format csv` | Emits one block per non-filter component (`# <name> (<type>)` header + columns + rows, blank line between blocks). Good for a single-component dump (`--component <tok>`); not a single flat table. |
| `datastudio data --format table` | Human-readable aligned table — use only when the user is reading output directly, never for parsing. |
| `datastudio filters [--page <name\|index>]` | List dimensions, their scope (page/global), options, and currently active values. Scope tells you whether a filter applies to one page or across the whole report. |
| `datastudio filter <dim> <value> [<value>…]` | Apply filter values. `<value>` must match an option string from `filters` exactly. |
| `datastudio filter reset [<dim>]` | Clear all filters, or just one dimension. |

### JSON shape to expect from `data`

```jsonc
{
  "components": [
    {
      "index": 0,
      "component_id": "…",
      "name": "Average Engagement",
      "type": "scorecard",
      "dimensions": [...],
      "metrics": [...],
      "value_data": {
        "columns": ["engagement_mean"],
        "rows": [[3.42]],
        "row_count": 1
      }
    }
  ],
  "active_filters": [...]
}
```

`value_data.error` appears instead of `rows` when a query failed (common with filter combos the dashboard rejects). Treat it as an error state, not a value.

## How to work with this CLI

### Start by mapping the report

Before pulling any specific values, get your bearings:

1. `datastudio connect "<url>"` — confirms the URL works and shows how many pages and global filters exist.
2. `datastudio pages` — lists data pages. If the user named a page ambiguously, match against this list rather than guessing.
3. `datastudio filters` — shows what dimensions are available and which ones are already applied. Always re-check after changing filters; the CLI echoes the active state but users sometimes change things out of band.

This orientation pass takes three cheap commands and prevents a lot of wasted work downstream.

### Extracting data

`datastudio go` then `datastudio data --format json` is the normal path. The full JSON for a page includes every component — parse the one(s) you need instead of re-running with `--component` for each tile. Only reach for `--component` when you're iterating on filters and want to re-pull one specific scorecard without re-fetching the whole page.

For CSV exports, be aware of what `data --format csv` actually emits: a concatenation of per-component CSV blocks (each with its own header and rows, filter components omitted, blank line between blocks). That's fine when the user wants one specific table — `datastudio data --format csv --component <tok>` gives a clean single-table CSV. It's awkward when the user wants "everything on the page in one spreadsheet" because the components have different column schemas.

When the user wants a tidy "open in Excel" dump of an entire page, prefer `data --format json` and flatten it yourself to a long-format table — one row per `(component, data-row, value-column)` triple, with columns like `component_name, component_type, scope, row_index, value_column, value`. That gives a single Excel-friendly file. A minimal flattener:

```python
# uv run --no-project python
import json, csv, sys
data = json.loads(sys.stdin.read())
w = csv.writer(sys.stdout)
w.writerow(["component_index", "component_id", "component_name", "component_type", "scope", "row_index", "value_column", "value"])
for i, c in enumerate(data["components"], 1):
    vd = c.get("value_data") or {}
    cols = vd.get("columns") or []
    for ri, row in enumerate(vd.get("rows") or [], 1):
        for col, val in zip(cols, row):
            w.writerow([i, c.get("component_id"), c.get("name"), c.get("type"), c.get("scope"), ri, col, val])
```

Pipe `datastudio data --format json` into it. Ask the user which shape they want before dumping — "one tidy long-format CSV" vs "one CSV per component" produces very different files.

### Filtering

The filter model is:

- **Dimensions** have a scope (one page, or global across the report) and a list of valid **option strings**.
- Applying `filter <dim> <value>` sets the active values for that dimension. Passing multiple values is OR within the dimension.
- Different dimensions combine with AND.
- `filter reset` with no argument clears everything; with a dimension name it clears just that one.

Always `datastudio filters` first to get exact option spellings — option strings are case- and whitespace-sensitive and will silently not match if you guess. After applying a filter, re-run `datastudio data --format json` to see the effect. The response includes `active_filters`, which is the ground truth for what's currently set.

`staff_count_delta` on filter responses tells you how much the respondent count moved — a useful sanity check that the filter actually did something.

### Anonymity thresholds and errors

Dashboards commonly suppress segments below a minimum count (n<4 or n<5) — you'll see `"—"` in tiles or `error` in `value_data`. That's by design, not a bug. If the user is surprised by a missing number under a narrow filter, the answer is usually "the segment was too small to display."

## Picking an output format for the user

- **User is reading the result themselves, quickly** → show them the relevant fields from the JSON, summarized. Don't paste raw `data --format table` unless they ask.
- **User wants a file they can send / open in Excel** → if one component, `data --format csv --component <tok>` straight to a file; if a whole page, flatten JSON to a long-format CSV as shown above. Either way, confirm the path.
- **User wants a specific number** → parse JSON, report the number with its filter context ("Average Engagement = 3.42 with Region=North, n=128").
- **User is exploring** → narrate as you go. Tell them which page you're on, which filter you applied, what the number moved to. Exploration is a conversation.

## What not to do

- Don't hand-edit `.datastudio/` session files. If the session breaks, `datastudio connect` again.
- Don't assume column names or option spellings between runs or between dashboards — rediscover via `filters` and `data` each time. Different reports use wildly different schemas.
- Don't use `--all-pages` as a default; it's heavy and usually unnecessary.
- Don't compare dashboard numbers against an `.xlsx` here — that's the `datastudio-qa` skill, which has its own workflow for expected-value computation and reporting.
