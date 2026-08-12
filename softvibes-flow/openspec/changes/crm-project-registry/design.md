## Context

Softvibes Flow is a Next.js 16 application with typed preview workflows and no persistence. Hostinger exposes managed MySQL databases and JavaScript application deployment for the active hosting account. The application must be usable from multiple devices, so browser-only storage is insufficient.

## Goals

- Preserve project and tenant boundaries in the database, API, domain types, and UI.
- Provide a compact operational CRM for projects, leads, pipeline stages, and calendar commitments.
- Keep source repositories and client CMSs as external systems of record.
- Deploy without committing database credentials, authentication secrets, or CMS passwords.

## Non-Goals

- Send email, WhatsApp, calls, calendar invitations, or other external actions.
- Import scraped leads or credentials from workspace files.
- Replace each client's business CMS or model their incompatible business entities.
- Verify business outcomes from the visual completeness of a landing page.

## Decisions

### Next.js server application with MySQL

The application remains a Next.js server deployment. Route handlers use a server-only MySQL adapter. Schema initialization is idempotent and seed data is inserted only when the project registry is empty.

### Tenant-safe records

Every project has a stable tenant identifier. Artifacts, leads, activities, events, and audit records store both `project_id` and `tenant_id`. Mutation handlers resolve the parent project before writing and reject inconsistent scope.

### Cookie session authentication

The operator authenticates with a username and password. Passwords use PBKDF2 with a unique salt. The server issues a signed, HTTP-only, same-site session cookie. State-changing requests require a same-session CSRF token.

### Soft deletion

Projects, artifacts, leads, and events are archived with `archived_at`. The standard queries exclude archived rows. This keeps deletion recoverable and preserves audit history.

### Lead stage and event model

The initial pipeline uses stable stage identifiers: `new`, `qualifying`, `qualified`, `contacted`, `meeting`, `proposal`, `negotiation`, `won`, and `lost`. Stage transitions write an audit event. Calendar events are stored in UTC and displayed in the operator's browser timezone.

### Honest registry links

Artifact links have a type and verification state. A declared URL is not presented as verified until a link check or operator confirmation records that status. Local repository paths remain plain evidence and are not exposed as downloadable server files.

### Deployment configuration

Database and authentication values are injected into a deployment archive that is excluded from Git and removed locally after deployment. CMS credentials are never imported. The Hostinger website and database are isolated from client sites.

## Failure and Recovery

- Database failures return a structured unavailable response without exposing connection details.
- Invalid or unauthenticated writes do not mutate data.
- The previous Hostinger deployment remains available for rollback.
- Endpoint and browser tests create uniquely prefixed records and restore the database afterward.

## Accessibility

- Visible keyboard focus and semantic landmarks.
- The pipeline supports both drag-and-drop and a select-based stage change.
- Forms have explicit labels and errors.
- Calendar entries remain available in an agenda list on narrow screens.
