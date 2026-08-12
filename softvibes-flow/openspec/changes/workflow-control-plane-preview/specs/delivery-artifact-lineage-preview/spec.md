## ADDED Requirements

### Requirement: Tenant-scoped delivery artifact lineage
The system SHALL represent each delivery artifact with a stable identity, project and tenant scope, artifact kind, producer, optional source reference, and revision or digest when available. It SHALL represent a predecessor or evidence relationship only when supported, and SHALL expose a root or unresolved source explicitly without fabricating an artifact or relation.

#### Scenario: Root artifact has no predecessor
- **WHEN** a research, analysis, or standalone source artifact has no discovered predecessor
- **THEN** the system identifies it as a root or unresolved-source artifact and preserves an empty relation/evidence set instead of creating placeholder provenance

#### Scenario: Exact analysis copy
- **WHEN** the operator inspects the Fabiola source analysis and the byte-identical analysis embedded in the MVP
- **THEN** the system identifies the MVP artifact as an exact copy and does not present the two paths as independent findings

#### Scenario: Modified analysis derivative
- **WHEN** the operator inspects the original and embedded Vivemar analyses whose digests differ
- **THEN** the system identifies the embedded artifact as a modified derivative and preserves both references without claiming equivalence

#### Scenario: Generated artifact chain
- **WHEN** the operator inspects the Ieoushua canonical content, generated site, build report, package, and deployment record
- **THEN** the system shows each as a distinct stage-ordered artifact rather than treating a successful build as publication or approval

#### Scenario: Standalone landing lacks upstream evidence
- **WHEN** the operator inspects a Diana Yoga Life or Smooth Group landing with no discovered research or analysis artifact
- **THEN** the system shows a landing source artifact present, upstream research/analysis evidence absent, approval unknown, and deployment unknown

### Requirement: Lineage graph isolation
The system SHALL require an explicit project-and-tenant scope for every lineage selector and SHALL ensure that artifacts, relations, stages, claims, evidence, gates, approvals, and handoffs resolve only within that exact scope.

#### Scenario: Cross-tenant relation endpoint
- **WHEN** a relation in the selected scope references an artifact belonging to another project or tenant
- **THEN** the system rejects or omits the malformed relation, exposes no referenced metadata, and reports the relation as unavailable

#### Scenario: Cross-tenant evidence reference
- **WHEN** a claim, gate, approval, or handoff references evidence outside the selected project and tenant
- **THEN** the system does not resolve or display the external record and does not provide an unscoped lookup fallback

#### Scenario: Direct identifier lookup remains scoped
- **WHEN** the operator or presentation layer requests a lineage record by identifier
- **THEN** the lookup also requires the selected project and tenant and cannot return a record from a mismatched scope

### Requirement: Stage contracts and accountable handoffs
The system SHALL expose each delivery stage's actor, trigger, inputs, process summary, persistence target, produced artifacts, recipient, handoff mode, and responsible owner, using an explicit unknown state when information is unavailable.

#### Scenario: WhatsApp application handoff
- **WHEN** a Fabiola or Colegios 875 form opens a prefilled WhatsApp URL
- **THEN** the system records a prepared or opened handoff with unknown delivery and does not report a persisted lead, sent message, accepted appointment, or conversion

#### Scenario: Unchecked email delivery
- **WHEN** the Vivemar contact handler calls an email function without retaining or checking delivery evidence
- **THEN** the system separates implemented handler evidence from confirmed message delivery and keeps the external outcome unknown

### Requirement: Claim-to-evidence traceability
The system SHALL classify each delivery claim independently by delivery state (`promised`, `implemented`, `pending`, or `out-of-scope`), support status (`verified`, `partial`, `unsupported`, `contradicted`, or `unverified`), and content classification (`client-data`, `sample`, `placeholder`, `decorative`, or `unknown`). It SHALL link supporting, conflicting, and caveat evidence without deriving or upgrading one classification from another in presentation logic.

#### Scenario: Commercial promise exceeds current implementation
- **WHEN** an analysis offers automation, analytics, scheduling, immersive media, bilingual delivery, or reporting without corresponding implementation and verification artifacts
- **THEN** the system keeps the promise separate from implemented capability and identifies the missing evidence

#### Scenario: Sample or placeholder content
- **WHEN** a property, testimonial, contact channel, booking address, metric, or CMS record is marked or evidenced as sample, placeholder, decorative, or demo data
- **THEN** the system prevents it from being presented as verified client data or production readiness

#### Scenario: Implemented but runtime-unverified capability
- **WHEN** source code implements a capability but no runtime observation confirms its external result
- **THEN** the system can show delivery state implemented, support status unverified for the runtime outcome, and the applicable content classification without collapsing those dimensions

#### Scenario: Editorial score
- **WHEN** a diagnostic score is derived from hard-coded or subjective dimensions
- **THEN** the system labels it as an editorial assessment and exposes its basis rather than presenting it as objective analytics

#### Scenario: Preserved research caveat
- **WHEN** upstream research records a blocked source, partial verification, or manual-review requirement
- **THEN** downstream artifacts retain that caveat and cannot silently promote the related claim to verified

### Requirement: Gate-based delivery readiness
The system SHALL display delivery readiness independently from workflow lifecycle and technical build status, using explicit content/brand, legal/privacy, inventory/data, configuration, approval, publish/deploy, consent, and acceptance gates.

#### Scenario: Clean build with unresolved delivery blockers
- **WHEN** a build succeeds while canonical content still contains placeholders, samples, unapproved claims, missing contact configuration, or unverified external services
- **THEN** technical build status may be clean while delivery readiness remains blocked with each gate and owner visible

#### Scenario: Approval follows preview
- **WHEN** an artifact is built, hosted, or previewable but stakeholder approval is absent
- **THEN** the system distinguishes previewed, deployed, delivered, and accepted states and leaves approval or acceptance pending

#### Scenario: Approval binds to one artifact revision
- **WHEN** approval is required for outreach, messaging, calling, publishing, deployment, content, legal/privacy, or delivery acceptance
- **THEN** the system shows applicability, status, approver or explicit unknown owner, artifact identity and revision/digest, evidence reference, and observation time when known

#### Scenario: Approval evidence is missing or stale
- **WHEN** no approval evidence exists or the evidence applies to a different artifact revision
- **THEN** the relevant gate remains unknown or pending and cannot be inferred as granted from deployment, delivery, or visual completeness

#### Scenario: Demo CMS publication claim
- **WHEN** the Karla Duarte browser-local CMS marks content as published
- **THEN** the system labels the persistence as local/demo-only and does not infer canonical save, site synchronization, deployment, authentication, or client approval

#### Scenario: Noindex protection boundary
- **WHEN** an artifact includes a `noindex` directive
- **THEN** the system reports search-indexing intent but does not infer authentication, confidentiality, or access control

### Requirement: Consent control and evidence remain distinct
The system SHALL distinguish an implemented consent control from captured, versioned consent evidence and SHALL expose privacy-readiness unknowns without including sensitive fixture payloads.

#### Scenario: Browser checkbox without durable consent
- **WHEN** a form requires a browser checkbox but the downstream output does not record notice version, timestamp, subject or submission reference, and capture channel
- **THEN** the system shows consent control implemented and consent evidence unavailable

#### Scenario: AI or microphone data boundary
- **WHEN** a delivery stage can collect contact data, transcript data, microphone input, or recording
- **THEN** the system displays known controller, destination/processor, purpose, retention, recording status, consent mechanism, and deletion path, and blocks production-ready status when required information is unknown

### Requirement: Source-of-truth and reconciliation boundaries
The system SHALL identify the authoritative artifact for each stage and SHALL expose drift or required reconciliation when generated or production-mutated artifacts can diverge from canonical source.

#### Scenario: Vivemar production CMS override
- **WHEN** Astro source generates published HTML and the production CMS mutates that HTML separately
- **THEN** the system shows source, generated output, CMS override, and the requirement to reconcile or reapply overrides after republication

#### Scenario: Desired and observed external configuration differ
- **WHEN** a configuration template and a deployed external-system receipt disagree
- **THEN** the system shows desired and observed values as separate evidence and flags configuration drift without exposing credentials

### Requirement: Typed evidence and narrow verification claims
The system SHALL support typed repository paths, source URLs, digests, revisions, build reports, deployment receipts, hosted URLs, and redacted external resource references. Each evidence record SHALL include an evidence kind, source/reference, observation boundary, verification status, observation timestamp when known, revision/digest when known, and redaction state. Observation boundaries SHALL distinguish repository inspection, generated-output inspection, receipt inspection, target-response verification, and runtime observation.

#### Scenario: Evidence verifies only its observation boundary
- **WHEN** evidence is based on a repository path, digest, build report, or external-system receipt
- **THEN** the system verifies only the observed source, equivalence, build, or resource-configuration fact and does not infer live availability, delivery, consent, acceptance, or business outcome

#### Scenario: Publication evidence is incomplete
- **WHEN** a source commit or generated build exists without a verified target response or deployment receipt
- **THEN** the system reports source or build completion but keeps live publication unverified

#### Scenario: External resource receipt
- **WHEN** a Vapi assistant or tool receipt exists without a verified production conversation, lead record, transfer, or appointment
- **THEN** the system reports resource configuration evidence only and keeps runtime and business outcomes unavailable

### Requirement: Evidence-aware read-only presentation
The system SHALL present artifact lineage, actors, claims, approvals, readiness blockers, source-of-truth boundaries, and handoff outcomes in stage order with progressive disclosure and explicit unavailable states.

#### Scenario: Inspect analysis-to-landing journey
- **WHEN** the operator opens a delivery-lineage fixture for Colegios 875, Fabiola, Vivemar, Karla Duarte, or Ieoushua Barragán
- **THEN** the system provides a coherent stage-ordered journey while preserving selected project and tenant context

#### Scenario: Missing lineage information
- **WHEN** a relation, approval, runtime outcome, or evidence field is unavailable
- **THEN** the system displays unknown, absent, or unverified rather than an empty success-looking surface or inferred completion
