## Why

Softvibes Sites contains client landings, analyses, proposals, CMS surfaces, previews, and deployed URLs across independent folders. The current catalog is incomplete and the existing Softvibes Flow preview is read-only. Roger also needs one protected place to manage leads, opportunities, follow-ups, and calendar commitments without mixing client data or automating external contact.

## What Changes

- Add an authenticated, tenant-safe project and artifact registry.
- Seed the registry from verified workspace artifacts while excluding credentials and sensitive source content.
- Add persistent lead, activity, opportunity-stage, and calendar-event records.
- Add an operator dashboard, project catalog, searchable lead list, lead detail, pipeline, and calendar.
- Add authenticated JSON endpoints for the required CRUD operations.
- Add MySQL persistence suitable for Hostinger and automatic idempotent schema initialization.
- Deploy the verified application to an isolated Hostinger website.

## Capabilities

### New Capabilities

- `project-artifact-registry`: Manage projects, analyses, landings, CMS references, and public or local links.
- `crm-lead-management`: Manage tenant-scoped leads, opportunity state, notes, and follow-up information.
- `crm-pipeline-calendar`: Operate a stage-based pipeline and calendar without automatic outreach.
- `authenticated-operator-api`: Protect operational data and mutations with a server-side authenticated session.

### Modified Capabilities

- `operator-workspace-shell`: Extend the preview shell into a persistent operator control plane while keeping client isolation visible.

## Impact

- Next.js route handlers and server-only database modules.
- MySQL tables for users, projects, artifacts, leads, activities, calendar events, and audit events.
- New authenticated client workspace and CRUD forms.
- Production configuration is supplied at deployment time and is never committed.
- Existing client repositories, CMSs, deployment targets, and source artifacts remain untouched.

## Measurable Outcome

- Every verified landing project is represented once, with its related analyses, CMS surface, and variants grouped as artifacts.
- An authenticated operator can create, edit, search, stage, schedule, and archive leads.
- Cross-tenant reads and writes are rejected.
- A production deployment passes health, authentication, CRUD, persistence, responsive, and security checks.
