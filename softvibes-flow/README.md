# Softvibes Flow

Private project registry and lightweight CRM for Softvibes landing-page operations.

## Capabilities

- Central catalog for projects, landings, analyses, proposals, link pages, CMS references, redirects, deployments, and variants.
- CRM dashboard with active-lead, open-pipeline, follow-up, and agenda indicators.
- Lead list, complete lead detail, activity history, consent-aware contact channels, and soft archival.
- Drag-and-drop pipeline with an accessible stage selector.
- Monthly calendar and agenda linked to projects and optional leads.
- Signed eight-hour sessions, HTTP-only cookies, CSRF protection, scoped writes, and mutation audit records.
- Credential-free seed inventory for the landing projects found in the parent workspace.

The operator interface is in Spanish. Code, contracts, and technical documentation are in English.

## Stack

- Next.js 16 App Router and React 19
- TypeScript
- MySQL through `mysql2`
- Vitest and React Testing Library
- Hostinger Node.js Web App hosting

## Local setup

Requirements:

- Node.js 20.9, 22, or 24
- MySQL 8-compatible database

Create `.env.local`:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=softvibes_flow
DB_USER=softvibes_flow
DB_PASSWORD=replace-me
INITIAL_ADMIN_USERNAME=roger
INITIAL_ADMIN_PASSWORD=replace-with-a-long-random-password
AUTH_SECRET=replace-with-at-least-32-random-characters
```

Then run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The schema, initial administrator, and credential-free project inventory are created idempotently on the first database-backed request.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
npm audit --omit=dev
```

Do not commit `.env*`, deployment credentials, test cookies, or customer CMS credentials.

## API and security

All successful JSON responses use:

```json
{ "ok": true, "data": {} }
```

Errors use:

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Safe operator-facing message."
  }
}
```

Authenticate with `POST /api/auth/login`. Send the returned `csrfToken` in the `x-csrf-token` header for every `POST`, `PATCH`, or `DELETE` request that requires a session. The browser session itself is stored in the HTTP-only `softvibes_session` cookie.

See [docs/api-spec.yml](docs/api-spec.yml) and [docs/data-model.md](docs/data-model.md).

## Hostinger deployment

1. Create an isolated website and assign an isolated MySQL database.
2. Deploy a source-only archive containing `package.json`, `package-lock.json`, `next.config.ts`, `tsconfig.json`, `public/`, and `src/`.
3. Select Node.js 22 when available; Node.js 20.9 or newer is supported.
4. Add the environment variables shown above in Hostinger. Use `localhost` for a database hosted in the same Hostinger account.
5. Build with `npm run build` and start with `npm start`.
6. Verify `/api/health`, authentication, CRUD persistence, logout, and mobile layout.

Environment variables must stay in Hostinger and must not be included in the archive or repository.

## Operational limits

- The current release has one administrator role and no password-reset UI.
- Archival is soft deletion; audit records are not exposed in the operator UI.
- Project URLs imported from the workspace are marked `declared` until an operator explicitly verifies them.
- No email, WhatsApp, Instagram, publishing, or CMS mutation is triggered automatically.
- Database schema changes are currently idempotent startup DDL. Adopt versioned migrations before multi-environment or multi-team operation.
