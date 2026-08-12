# Softvibes Flow Data Model

## Scope

Softvibes Flow stores project-delivery metadata and lightweight CRM records. Client business data remains in each client's source system. The registry stores references to landing, analysis, link, proposal, CMS, redirect, deployment, and variant artifacts; it never imports CMS credentials.

## Isolation invariant

Every project owns a stable `tenantId`. Artifacts, leads, activities, calendar events, and audit events copy the parent project's `projectId` and `tenantId`. A child record is created only after resolving its active parent inside the same database transaction. Callers cannot choose or override the copied tenant.

Archived projects and child records are excluded from operator reads. Deletes are soft archival.

## Relationships

```text
users
  └─ audit_events

projects
  ├─ artifacts
  ├─ leads
  │   ├─ activities
  │   └─ calendar_events (optional relationship)
  ├─ calendar_events
  └─ audit_events
```

## Entities

### User

- `id`, `username`
- PBKDF2 password salt and hash
- `createdAt`, `updatedAt`

The initial administrator is seeded only when the user table is empty. Plaintext passwords are never stored.

### Project

- Identity and scope: `id`, `tenantId`, unique `slug`
- Description: `name`, `description`, optional `niche`, optional `city`
- Delivery state: `discovery`, `analysis`, `landing`, `review`, `live`, or `paused`
- Evidence: `stack[]`, workspace-relative `localPath`
- Lifecycle: `createdAt`, `updatedAt`, optional `archivedAt`

### Artifact

- Scope: `id`, `projectId`, copied `tenantId`
- Type: `research`, `analysis`, `proposal`, `landing`, `links`, `cms`, `preview`, `deployment`, `redirect`, or `variant`
- Reference: `label`, optional `localPath`, optional HTTP(S) `publicUrl`
- Link state: `declared`, `verified`, `unavailable`, or `protected`
- `isCanonical`, optional `notes`, lifecycle timestamps

`declared` means the URL was found in authoritative workspace material but was not necessarily reachable during import. `verified` must be an explicit operator decision.

### Lead

- Scope: `id`, `projectId`, copied `tenantId`
- Contact: `name`, optional `company`, `email`, and `phone`
- Commercial context: `source`, `owner`, `estimatedValue`, `probability`
- Pipeline stage: `new`, `qualifying`, `qualified`, `contacted`, `meeting`, `proposal`, `negotiation`, `won`, or `lost`
- Follow-up: optional `nextAction`, optional `nextActionAt`, optional `notes`
- Contact policy: `consentStatus` plus `allowedChannels[]`
- Lifecycle timestamps

Allowed channels are `email`, `phone`, `whatsapp`, and `instagram`. The application records consent metadata but never sends outreach automatically.

### Activity

- Scope: `id`, `projectId`, copied `tenantId`, `leadId`
- Type: `note`, `call`, `email`, `meeting`, or generated `stage-change`
- `title`, optional `body`, `createdAt`

Activities are append-only in the current release. A lead stage update automatically appends a `stage-change` activity.

### Calendar event

- Scope: `id`, `projectId`, copied `tenantId`, optional `leadId`
- `title`, `eventType`, `startsAt`, `endsAt`, optional `notes`
- Lifecycle timestamps

Event types are `meeting`, `call`, `follow-up`, `delivery`, and `review`. The end time must be later than the start time. If a lead is attached, it must belong to the same project and tenant.

### Audit event

- Actor: `userId`
- Optional scope: `projectId`, `tenantId`
- Target: `entityType`, `entityId`, `action`
- JSON `details`, `createdAt`

Every project, artifact, lead, activity, event, and pipeline-stage mutation writes an audit record in the same transaction.

## Persistence and initialization

The application uses MySQL/InnoDB with `utf8mb4`. Startup initialization is idempotent:

1. Create missing tables and indexes.
2. Seed the initial administrator only if there are no users.
3. Seed the credential-free workspace inventory only if there are no projects.

The connection pool is limited to five connections for shared-hosting operation. Adopt versioned migrations and a backup/restore runbook before expanding beyond the current single-operator release.

## Legacy workflow preview

The earlier `WorkflowDefinition` fixtures remain in `src/domain/workflows` as read-only reference material. They are not persisted or exposed by the CRM API.
