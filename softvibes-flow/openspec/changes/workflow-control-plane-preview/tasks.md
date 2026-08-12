## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create and switch to `feature/workflow-control-plane-preview`
- [x] 0.2 Verify the current branch and preserve the isolated repository boundary

## 1. Project Foundation and Test Harness

- [x] 1.1 Review current Next.js 16 documentation for App Router, client components, CSS, fonts, and metadata
- [x] 1.2 Add Vitest, jsdom, React Testing Library, and coverage configuration without adding a UI framework
- [x] 1.3 Resolve or explicitly block known dependency audit findings before calling the preview verified
- [x] 1.4 Run the empty test harness, TypeScript, and lint checks

## 2. Tenant-Safe Workflow Domain (TDD)

- [x] 2.1 RED: add failing tests for mandatory project/tenant scope, combined filters, case-insensitive search, and empty results
- [x] 2.2 GREEN: implement fully typed workflow definitions, preview fixtures, project scopes, and tenant-safe selectors
- [x] 2.3 REFACTOR: remove duplication and keep fixtures honest, deterministic, and derived from verified inventory facts
- [x] 2.4 Run targeted domain tests and record RED/GREEN evidence

## 3. Operator Workspace Behavior (TDD)

- [x] 3.1 RED: add failing component tests for visible project context, workflow selection, combined filtering, scope changes, detail disclosure, and filter reset
- [x] 3.2 GREEN: implement the server-first page and focused client workspace with Spanish user-facing copy
- [x] 3.3 REFACTOR: extract focused catalog, status, step, evidence, approval, and empty-state components while preserving accessibility
- [x] 3.4 Run targeted component tests and record RED/GREEN evidence

## 4. Delivery Artifact Lineage and Readiness (SPEC UPDATE, TDD)

- [ ] 4.1 RED: add failing domain tests for explicit-scope selectors; cross-tenant relation/evidence/direct-ID rejection; root artifacts and empty evidence; exact-copy and modified-derivative lineage; orthogonal claim classifications; typed observation boundaries; revision-bound approvals; consent control versus durable consent evidence; source-of-truth drift; and unconfirmed handoffs
- [ ] 4.2 GREEN: implement the minimum fully typed delivery-lineage read model and redacted fixtures derived from Colegios 875, Fabiola, Vivemar, Karla Duarte, Ieoushua Barragán, Diana Yoga Life, and Smooth Group evidence
- [ ] 4.3 RED: add failing component tests for stage-ordered lineage, orthogonal claim/evidence conflicts, stale or unknown approvals, readiness blockers, explicit unavailable states, and absence of executable approval, build, browser-storage, publish, deploy, call, or message controls
- [ ] 4.4 GREEN: implement progressive-disclosure lineage and readiness views without mutating files, browser storage, builds, approvals, deployments, calls, or messages
- [ ] 4.5 REFACTOR: keep workflow definitions separate from artifact instances and remove duplicated project, actor, evidence, and status labels
- [ ] 4.6 Run targeted domain/component tests and record RED/GREEN evidence for the expanded scope

## 5. Responsive Visual System

- [ ] 5.1 Implement an original dark precision visual system with project-local CSS variables and no external UI framework
- [ ] 5.2 Add semantic landmarks, visible focus, non-color status labels, 44px touch targets, and reduced-motion handling
- [ ] 5.3 Implement desktop split-view and mobile stacked layouts without horizontal page scrolling
- [ ] 5.4 Update metadata and remove generated starter assets or copy that are not used

## 6. Unit and Build Verification (MANDATORY - AGENT MUST EXECUTE)

- [ ] 6.1 Review and update all unit/component tests affected by the implementation (MANDATORY)
- [ ] 6.2 Run targeted tests, full test suite, coverage, TypeScript check, lint, and production build (MANDATORY)
- [ ] 6.3 Confirm database verification is not applicable because the preview has no database or writes
- [ ] 6.4 Create `reports/YYYY-MM-DD-step-6-unit-test-and-build-verification.md` with commands, results, RED/GREEN evidence, and the no-database statement

## 7. Browser E2E and Responsive QA (MANDATORY - AGENT MUST EXECUTE)

- [ ] 7.1 Start the preview server and verify the HTTP response
- [ ] 7.2 Execute the primary desktop flow: search, filter, select, inspect lineage/readiness, and clear filters
- [ ] 7.3 Execute keyboard and accessible-name checks for project, search, filters, workflow, lineage, evidence, and reset controls
- [ ] 7.4 Execute narrow mobile QA and verify no horizontal page overflow or hidden readiness blocker
- [ ] 7.5 Verify fixture invariants: no cross-tenant artifacts, no unsupported claim appears verified, no draft/handoff appears confirmed, and every publish/deploy/outreach path exposes its human gate
- [ ] 7.6 Check browser console errors and capture desktop and mobile screenshots
- [ ] 7.7 Create `reports/YYYY-MM-DD-step-7-browser-e2e-and-responsive-qa.md` with scenarios and evidence

## 8. Security, Adversarial Review, and Documentation

- [ ] 8.1 Confirm endpoint curl testing is not applicable because this change introduces no API endpoints
- [ ] 8.2 Run dependency audit, secret scan, unsafe-code scan, fixture-PII review, and review the complete git diff
- [ ] 8.3 Request independent spec-compliance review and resolve blocking gaps
- [ ] 8.4 Request independent code-quality/security review and resolve blocking issues
- [ ] 8.5 Update README and technical documentation with scope, commands, lineage vocabulary, evidence limits, safety boundary, and next approved change
- [ ] 8.6 Validate the OpenSpec change and update all completed task checkboxes with evidence
