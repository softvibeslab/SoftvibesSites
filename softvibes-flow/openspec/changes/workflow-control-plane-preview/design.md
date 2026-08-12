## Context

SoftvibesLab has a verified inventory of 25 workflows across independent products and repositories. Those workflows use incompatible domain models and different persistence mechanisms, so the new product must act as a control plane rather than replacing their business data. The initial slice is an operator preview for Roger: it must make project context, lifecycle state, inputs, outputs, approvals, evidence, and gaps legible without touching production systems.

The repository is an isolated Next.js 16 App Router application. There is no approved database, credential policy, PII retention policy, or production adapter yet. The preview therefore uses deterministic typed fixtures selected from the inventory and labels them as preview data.

## Goals / Non-Goals

**Goals:**

- Validate the workflow-control-plane information architecture and operator experience in a working browser preview.
- Preserve project and tenant isolation in types, selectors, and visible UI context.
- Let Roger search, filter, select, and inspect workflow definitions quickly on desktop and mobile.
- Separate verified evidence, known gaps, approval gates, and unknown data so the interface does not overstate readiness.
- Trace how analysis, proposal, landing source, generated output, preview, deployment, CMS override, handoff, and acceptance artifacts relate without collapsing them into one completion state.
- Distinguish factual claims, editorial assessments, samples, placeholders, implemented code paths, and verified runtime outcomes.
- Establish testable domain primitives that can later be backed by Supabase and typed adapters.

**Non-Goals:**

- Persist definitions, versions, runs, approvals, or evidence.
- Authenticate users or implement Supabase/RLS.
- Read from or write to client repositories, CMSs, CRMs, social networks, email, WhatsApp, or deployment targets.
- Execute workflows, send outreach, publish content, deploy websites, or run arbitrary commands.
- Model incompatible business entities in one universal CRUD schema.
- Execute builds, mutate CMS content, check analysis tasks, approve artifacts, deploy, send messages, place calls, or write browser-local state from the read-only lineage preview.

## Decisions

### 1. Server-first shell with one focused client workspace

The route and initial fixture load remain server-rendered. A focused client component owns search, status filtering, workflow selection, and the mobile detail interaction.

**Rationale:** this minimizes client JavaScript while allowing an immediate, tactile preview.

**Alternative considered:** a fully client-rendered dashboard. Rejected because it adds no value for deterministic local data and weakens the intended server-first architecture.

### 2. Typed control-plane definitions, not domain entity records

`WorkflowDefinition` includes mandatory `projectId` and `tenantId`, a version state, lifecycle status, ordered steps, explicit external-action classification and approvals, evidence, and known gaps. Workflow fixtures preserve authoritative inventory IDs. Delivery-lineage fixtures declare additional project scopes for `colegios-875`, `fabiola-mvp`, `karla-duarte`, `ioushua-barragan`, `diana-yoga-life`, and `smooth-group`; these scopes are explicit preview boundaries and MUST NOT be inferred from a path at runtime. Evidence references resolve to inspected repository-relative source paths; a workflow or artifact with no resolvable source MUST expose an empty evidence set rather than a placeholder. Fixtures reference operational facts but do not import leads, application payloads, products, properties, patients, posts, or other client records.

**Rationale:** control-plane metadata can be shared safely while source systems keep ownership of incompatible business data.

**Alternative considered:** a generic record table with JSON payloads. Rejected because it obscures contracts and makes tenant leakage and accidental cross-domain operations more likely.

### 3. Tenant scope is an input to every selector

The catalog selector requires a `WorkflowScope` before optional search or lifecycle filters. It never offers an unscoped fallback. The visible project switcher may choose only from explicitly declared scopes.

**Rationale:** isolation is a structural invariant, not a UI convention.

**Alternative considered:** filter a global workflow array by project only in the component. Rejected because later refactors could accidentally bypass the filter.

### 4. Honest fixture data and unavailable metrics

The preview curates a small set of workflows from the verified inventory. It shows catalog counts derived from the current filtered fixtures only. Runtime health, conversion, duration, delivery confirmation, and success-rate metrics display as unavailable rather than fabricated.

**Rationale:** trust is more important than dashboard fullness.

### 5. Original visual system informed by dark precision tools

The UI uses near-black surfaces, quiet borders, high-contrast typography, and one violet accent. It borrows the posture of precision operator tools without cloning a proprietary layout. Hierarchy comes from type, spacing, and status language instead of decorative charts or generic card grids.

**Accessibility:** semantic landmarks, keyboard-visible focus, labelled controls, minimum 44px touch targets, color-plus-text status communication, reduced-motion support, and responsive single-column detail on narrow screens.

### 6. TDD around behavior and selectors

Vitest and React Testing Library cover tenant-safe selection, combined filters, honest empty states, workflow selection, and detail content. Browser QA verifies the primary flow, reset/empty-state recovery, keyboard operation, and mobile layout.

### 7. Artifact lineage is separate from workflow execution

The preview models `DeliveryArtifact`, `ArtifactRelation`, `DeliveryClaim`, `ReadinessGate`, `ApprovalRecord`, `DeliveryEvidence`, and `HandoffOutcome` as tenant-scoped read models. Every record and reference is validated against the selected project and tenant; relations cannot connect different scopes, and lineage selectors require an explicit `WorkflowScope` with no unscoped fallback. Artifact kinds include research, analysis, proposal, source, structured content, media, generated build, build report, preview, approval, deployment record, live URL, CMS override, consent evidence, and acceptance evidence. A root or unresolved artifact may have no source reference or predecessor, and the preview records that absence explicitly instead of fabricating a relation. Supported relations distinguish exact copy, modified derivative, generated output, deployed output, production override, and supporting or conflicting evidence.

**Rationale:** the inspected projects contain real causal chains that repository-path-only evidence cannot explain. Fabiola contains a byte-identical copied analysis; Vivemar contains a modified derivative and a production-CMS override path; Ieoushua separates canonical JSON, build, package, and deploy; Colegios 875 separates audit, proposal, landing, hosting, Vapi configuration, and an unconfirmed WhatsApp handoff.

**Alternative considered:** add more free-text gaps to `WorkflowDefinition`. Rejected because free text cannot enforce provenance, relation type, tenant scope, or readiness semantics.

### 8. Claims and readiness are evidence-backed, not inferred from polish

Claims use orthogonal fields: `deliveryState` (`promised`, `implemented`, `pending`, or `out-of-scope`), `supportStatus` (`verified`, `partial`, `unsupported`, `contradicted`, or `unverified`), and `contentClassification` (`client-data`, `sample`, `placeholder`, `decorative`, or `unknown`). Presentation logic cannot infer one field from another or silently upgrade a downstream claim. Evidence may support or conflict with a claim and preserves upstream caveats. Editorial scores remain labelled as editorial assessments.

`DeliveryEvidence` separates evidence kind, source/reference, observation boundary, verification status, observation time when known, revision/digest when known, and redaction state. Observation boundaries distinguish repository inspection, generated-output inspection, receipt inspection, target-response verification, and runtime observation. Evidence verifies only the narrow fact observed; a repository path or external receipt never implies live availability, delivery, consent, acceptance, or business outcome.

Delivery readiness is independent from workflow lifecycle and technical build status. Required gates may cover content/brand, legal/privacy, inventory/data, external configuration, approval, publish/deploy, consent, and delivery acceptance. Approval records bind applicability and status to one artifact revision/digest, approver or explicit unknown owner, evidence reference, and observation time when known. Missing or mismatched evidence produces `unknown`, `pending`, or `blocked`, never implicit completion.

**Rationale:** a clean build, polished landing, `noindex`, browser checkbox, hosted URL, or external API receipt each proves a narrow fact. None alone proves approval, privacy readiness, successful delivery, appointment creation, acceptance, or conversion.

### 9. Source of truth, reconciliation, and handoff confirmation remain explicit

Each stage names its authoritative artifact and actor. The preview exposes drift when generated HTML or production CMS overrides may diverge from repository source. External handoffs distinguish `prepared`, `opened`, `requested`, `accepted`, `confirmed`, `failed`, and `unknown`. A WhatsApp draft, unchecked `mail()` call, source commit, build report, Vapi resource receipt, or Calendly iframe cannot be upgraded to a confirmed business outcome without corresponding evidence.

**Rationale:** the analyzed sites repeatedly contain manual boundaries where code existence and business completion diverge.

## Risks / Trade-offs

- **[Risk] Fixture interfaces drift from the future database schema** → Keep domain types narrow, document unknown persistence fields, and design Supabase/RLS in a separate approved change.
- **[Risk] Preview data is mistaken for live operations** → Label the surface “Vista previa” and label unavailable runtime metrics explicitly.
- **[Risk] A dense control plane increases cognitive load** → Use progressive disclosure, one selected workflow, plain status labels, and a compact evidence/gap hierarchy.
- **[Risk] Tenant isolation is only in memory for this slice** → Test selector invariants now; require database RLS and cross-tenant adversarial tests before any production data integration.
- **[Risk] Dark UI has insufficient contrast** → Use restrained but contrast-checked text roles and verify focus/controls in browser QA.
- **[Risk] Repository analysis is mistaken for a live audit** → Show source path, observation boundary, and unknown runtime status; never promote local evidence to live confirmation.
- **[Risk] Client or sensitive claims leak across projects** → Scope every artifact, claim, relation, gate, and handoff to the selected project/tenant and use redacted fixture summaries.
- **[Risk] Lineage density increases cognitive load** → Default to a stage-ordered summary with progressive disclosure for evidence, conflicts, and technical provenance.
- **[Trade-off] No persistence means the preview cannot validate recovery or audit behavior** → Treat this as product-shape validation only; do not archive the broader control-plane MVP based on this slice.

## Migration Plan

1. Build and verify the read-only preview in the isolated repository.
2. Review the workflow detail hierarchy and project-scoping model with Roger.
3. If approved, open a separate OpenSpec change for Supabase auth, schema, RLS, credential boundaries, PII retention, and audit events.
4. Add one read-only adapter before any write adapter.
5. Rollback for this preview is removal of the isolated application; no client system state changes.

## Open Questions

- Which project/tenant should be the first live integration after the preview?
- Should the first input adapter read a MenuVibes CSV export or Google Sheets?
- What credential storage, PII classification, and retention policy will govern live data?
- Which actions require one approver versus multiple approvers?
- Which delivery-lineage journey should become the first persisted run: Colegios 875, Fabiola, Vivemar, Karla Duarte, or Ieoushua Barragán?
- Which evidence types may expose client-sensitive content, and what redaction/retention policy applies before live imports?
