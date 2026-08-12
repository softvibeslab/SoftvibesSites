## Why

SoftvibesLab currently operates workflows across independent repositories, local tools, CMS variants, and manual handoffs without one trusted place to see what is defined, running, waiting for approval, or supported by evidence. Roger needs a low-friction control-plane preview now so the product model and operator experience can be validated before connecting credentials, production data, or client systems.

## What Changes

- Create an isolated Next.js application named Softvibes Flow; no client repository is modified.
- Add a typed, tenant-scoped workflow catalog preview backed by explicit fixture data derived from the existing inventory.
- Add a workflow detail surface that exposes version, steps, approvals, evidence, inputs, outputs, and current gaps.
- Add a read-only delivery lineage surface derived from developed Softvibes analysis/landing journeys: research, analysis, proposal, implementation, build, preview, approval, deployment, handoff, and acceptance remain distinct artifacts and states.
- Add claim-to-evidence status, typed artifact provenance, readiness gates, consent evidence, and source-of-truth/reconciliation boundaries so visual completeness is not mistaken for operational readiness.
- Add interactive filtering by project, lifecycle status, and text search without losing tenant context.
- Add an operator-focused overview that distinguishes verified facts from unknown or unavailable data.
- Use a responsive, accessible dark interface with Spanish user-facing copy.
- Keep all actions read-only in this slice: no outreach, deployment, publication, external writes, credential handling, or arbitrary command execution.

## Capabilities

### New Capabilities
- `workflow-catalog-preview`: Browse and inspect tenant-scoped workflow definitions, lifecycle status, input/output contracts, steps, approvals, and evidence using deterministic local data.
- `operator-workspace-shell`: Navigate a responsive operator workspace with explicit project context, search/filter controls, keyboard-visible focus, and honest empty states.
- `delivery-artifact-lineage-preview`: Inspect tenant-scoped analysis-to-landing artifact lineage, claim support, approvals, readiness blockers, handoff confirmation, and source-of-truth boundaries without mutating client systems.

### Modified Capabilities

None.

## Impact

- New isolated repository: `SoftvibesSites/softvibes-flow`.
- Frontend files under `src/app`, typed domain modules under `src/features`, and test files colocated or under `src`.
- New testing dependencies for unit/component tests; browser QA uses the available browser tooling.
- No production API, database, Supabase project, client data migration, or external side effects in this preview.
- The workflow inventory remains the research source; fixture records are curated examples and must be labeled as preview data rather than live operational metrics.
- Delivery-lineage fixtures are derived from inspected Colegios 875, Fabiola, Vivemar, Karla Duarte, Ieoushua Barragán, Diana Yoga Life, and Smooth Group artifacts. They record repository evidence and explicit unknowns; they do not prove client approval, live delivery, conversion, or production readiness.
