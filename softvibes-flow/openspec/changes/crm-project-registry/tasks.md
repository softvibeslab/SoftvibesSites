## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create and switch to `feature/crm-project-registry-backend`
- [x] 0.2 Verify the branch and preserve existing local preview changes

## 1. Domain and API Contract (TDD)

- [ ] 1.1 RED: add failing tests for project scope, lead validation, stage transitions, dashboard metrics, and calendar grouping
- [ ] 1.2 GREEN: implement fully typed project, artifact, lead, activity, event, and dashboard domain modules
- [ ] 1.3 REFACTOR: remove duplicated status, label, and validation logic
- [ ] 1.4 Update the OpenAPI and data-model documents

## 2. Persistence and Authentication (TDD)

- [ ] 2.1 RED: add failing tests for authentication helpers, session signatures, and safe mutation validation
- [ ] 2.2 GREEN: implement the server-only MySQL adapter, idempotent schema, seed importer, password verification, signed sessions, and CSRF checks
- [ ] 2.3 GREEN: implement authenticated CRUD route handlers for projects, artifacts, leads, activities, and calendar events
- [ ] 2.4 REFACTOR: centralize database transactions, scope resolution, response envelopes, and audit writes

## 3. Operator CRM Workspace (TDD)

- [ ] 3.1 RED: add failing component tests for login, dashboard, project catalog, lead list/detail, pipeline movement, calendar, forms, and error states
- [ ] 3.2 GREEN: implement the responsive authenticated workspace with Spanish user-facing copy
- [ ] 3.3 GREEN: implement project, lead, activity, and event CRUD forms with explicit confirmation for archival
- [ ] 3.4 REFACTOR: extract focused navigation, dialog, table, pipeline, calendar, and detail components

## 4. Workspace Inventory

- [ ] 4.1 Add a credential-free seed manifest for verified landing project groups
- [ ] 4.2 Group analyses, proposals, CMS references, redirects, and variants under their canonical projects
- [ ] 4.3 Mark declared URLs honestly as declared or verified and preserve repository-relative evidence paths
- [ ] 4.4 Add regression tests that reject credential-like seed keys or values

## 5. Review and Update Existing Unit Tests (MANDATORY)

- [ ] 5.1 Review existing workflow tests and update only behavior affected by the new workspace
- [ ] 5.2 Run targeted domain, authentication, and component tests

## 6. Run Unit Tests and Verify Database State (MANDATORY)

- [ ] 6.1 Capture pre-test table counts and seeded record identifiers
- [ ] 6.2 Run targeted tests, full tests, coverage, typecheck, lint, and production build
- [ ] 6.3 Verify post-test database state and restore any test mutations
- [ ] 6.4 Create `reports/2026-07-29-step-6-unit-test-and-db-verification.md`

## 7. Manual Endpoint Testing with curl (MANDATORY - AGENT MUST EXECUTE)

- [ ] 7.1 Start the application with a test database and authenticate
- [ ] 7.2 Test health, session, and authenticated bootstrap reads
- [ ] 7.3 Test project and lead POST/PATCH/DELETE flows and restore the database
- [ ] 7.4 Test activity and calendar-event POST/PATCH/DELETE flows and restore the database
- [ ] 7.5 Test validation, not-found, authentication, CSRF, and cross-scope failures
- [ ] 7.6 Create `reports/2026-07-29-step-7-curl-endpoint-verification.md`

## 8. Browser E2E and Responsive QA (MANDATORY - AGENT MUST EXECUTE)

- [ ] 8.1 Verify login and logout
- [ ] 8.2 Verify dashboard, project catalog, lead creation, lead detail, pipeline movement, and calendar scheduling
- [ ] 8.3 Verify validation recovery, keyboard operation, mobile layout, and browser console
- [ ] 8.4 Restore browser-created test records and verify persistence
- [ ] 8.5 Create `reports/2026-07-29-step-8-browser-e2e.md`

## 9. Security and Independent Review

- [ ] 9.1 Run dependency audit, secret scan, unsafe-code scan, and fixture PII review
- [ ] 9.2 Request independent spec-compliance review and resolve blocking findings
- [ ] 9.3 Request independent code-quality and security review and resolve blocking findings

## 10. Update Technical Documentation (MANDATORY)

- [ ] 10.1 Update README, data model, API specification, deployment instructions, and operational limits
- [ ] 10.2 Validate the OpenSpec change and verify symlink integrity

## 11. Hostinger Deployment

- [ ] 11.1 Create an isolated Hostinger website and MySQL database
- [ ] 11.2 Build a deployment archive without repository secrets or generated development artifacts
- [ ] 11.3 Deploy, monitor build logs, and verify the production health endpoint
- [ ] 11.4 Execute production authentication, CRUD, persistence, responsive, and security smoke tests
- [ ] 11.5 Restore production smoke-test data and record the deployment URL
