# DRG IMS
CS4273 Capstone, Spring 2026 | Group F
Franco Barbaro, Allison Helling, Charlie Street, Joshua Kam, Ruby Morales

drg-ims.azurewebsites.net

## About

Our client is DRG, a defense contractor. They handle monthly deliverable submissions across 26 sites and all of it runs through email right now, 40+ people CC'd every time a document goes out. When the government says they never got something, there's no proof. We built a document portal where submissions are permanent, every access is logged, and each role only sees what they're supposed to.

## Who did what

Franco developed the application. Allison handled deployment and the cross-language test files. Joshua put together the project documentation. Charlie and Ruby contributed to the notification module and domain model documentation.

## Setup

Requires Node.js 22 and pnpm 10. Python 3.8+ and Java 17+/Maven are only needed for those test suites.

```bash
git clone https://github.com/Almi263/drg-realtime-dashboard.git
cd drg-realtime-dashboard
pnpm install
pnpm dev
# http://localhost:3000
```

No credentials needed, it runs on mock data by default. To connect real Azure services copy `.env.example` to `.env.local` and fill in:

- `AZURE_AD_TENANT_ID`, `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET` for auth
- `DATABASE_URL` for the database
- `AZURE_STORAGE_CONNECTION_STRING` and `AZURE_STORAGE_CONTAINER_NAME` for document uploads
- `NEXT_PUBLIC_APP_URL` for the public base URL

Only the connector implementations in `src/lib/connectors/` change when switching from mock to real, the pages and components stay the same.

## Source layout

```
src/
  app/              Next.js App Router pages
    programs/       program list and detail
    records/        deliverable list and detail
    documents/      document repository and detail
    submit/         4-step submission wizard (role-gated)
    calendar/       deadline tracker
  components/       shared UI (tables, cards, wizard, role guard)
  lib/
    models/         TypeScript types (Program, Deliverable, Document, UpdateEvent)
    connectors/     mock data adapters
    notifications/  Teams notification payload builder
    context/        role context provider
    theme.ts        MUI theme
```

## Routes

- `/` is the dashboard with program status cards and stats
- `/programs` and `/programs/[id]` for program-level views
- `/records` and `/records/[id]` for deliverables
- `/documents` and `/documents/[id]` for the document repository, each document has an expandable access log
- `/submit` is the submission wizard, only accessible to drg-staff and drg-admin roles
- `/calendar` groups upcoming deadlines by urgency

## How it's built

All external integrations are behind connector interfaces in `src/lib/connectors/` with mock implementations that return hardcoded data. Swapping in real Azure APIs later means replacing those files, nothing else changes.

The role switcher in the header lets you toggle between three access levels during the demo: `gov-reviewer` (read and download only), `drg-staff` (can submit), and `drg-admin` (full access including delete). In production this would come from Azure AD group membership via MSAL.

## Tests

```bash
pnpm test:all    # TypeScript + Python + Java
pnpm test        # TypeScript only (Vitest)
```

We implemented the Teams notification payload builder in TypeScript, Python, and Java to satisfy the multi-language testing requirement. `pnpm test` runs just the TypeScript suite if you don't have Java set up.

## Deployment

Pushes to `franco/teams-update-feed-prototype` build and deploy automatically via GitHub Actions. Workflow is in `.github/workflows/`.

## Linting

```bash
pnpm lint
```
