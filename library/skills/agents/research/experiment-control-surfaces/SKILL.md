---
name: experiment-control-surfaces
description: Build lightweight local dashboards for editing experiment inputs, monitoring runs, recording human decisions, and exporting auditable snapshots. Use for synthetic simulations, prompt experiments, model evaluations, pilots, and other single-operator research workflows.
---

# Experiment Control Surfaces

Create the smallest control surface that keeps an experiment understandable and operable without introducing a second platform.

## When to use

Use when an experiment needs more than static input files because the operator must repeatedly:

- edit prompts, seeds, cohorts, hypotheses, or configuration;
- monitor run history and status;
- connect human observations to machine-generated output;
- preserve and download the current experiment state.

Do not build a dashboard for a one-shot run whose files and CLI output are already sufficient.

## Design ladder

1. Reuse the experiment tool's existing UI and API.
2. If it lacks an operator view, add one static page to its existing frontend.
3. Use browser storage for a local, single-operator lab.
4. Add backend persistence only for collaboration, cross-device access, audit requirements, or data too large for browser storage.
5. Add real-time transport only when polling creates a measured problem.

## Minimum feature contract

A useful control surface should provide:

- editable seed/input and prompt/configuration panels;
- explicit save status plus automatic local persistence;
- Markdown import/export for authored text;
- a complete JSON project export with schema version and timestamp;
- run history/status from the tool's existing API;
- selection or linking of the active run;
- a human log with observation, decision, blocker, and next-step entries;
- CSV export of that human log;
- clear labels separating authored inputs, simulator state, generated findings, and human interpretation.

## Implementation pattern

Prefer plain HTML, CSS, and JavaScript in the host frontend's public/static directory. Keep state in one versioned object and isolate storage, API, rendering, and export functions. Poll only while the page is visible, use a modest interval, and expose connection state without turning temporary API failure into data loss.

Treat bundled seed and prompt files as first-run defaults only. Once the operator edits them, browser state is authoritative until they explicitly reset or import another project.

See `references/local-simulation-dashboard.md` for the concrete integration and verification recipe.

## Safety and evidence boundaries

- Never start a paid run from an innocent-looking refresh or load action.
- Keep simulation output labeled as exploratory hypotheses, not measured user behavior.
- Do not mix private participant data into synthetic seeds.
- Never overwrite authored inputs because a monitoring request failed.
- Export before destructive reset or schema migration.

## Verification

Leave one small runnable check that fails when:

- required controls or export actions are missing;
- expected cohort IDs are absent or duplicated;
- round or cost caps disappear from the prompt;
- the history endpoint is unreachable when the host backend is running;
- JavaScript initialization throws because an expected DOM element is missing.

Then run the host application's normal build and visually verify contrast, navigation, persistence after reload, and at least one log create/edit/delete cycle.

## Pitfalls

- Building a separate service when a static page inside the host app is enough.
- Treating `localStorage` as collaborative or auditable persistence.
- Polling aggressively or continuing while the tab is hidden.
- Depending on fragile DOM selectors from the host UI instead of its API.
- Exporting only results while losing the exact seed, prompt, notes, and selected run.
- Declaring the experiment complete because the dashboard is complete.
