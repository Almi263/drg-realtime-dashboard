# DRG IMS
CS4273 Capstone, Spring 2026 | Group F
Franco Barbaro, Allison Helling, Charlie Street, Joshua Kam, Ruby Morales

https://drg-ims.vercel.app

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

To connect Microsoft Entra ID and reviewer invitations, copy `.env.example` to `.env.local` and fill in:

- `AUTH_SECRET` and `AUTH_URL`
- `AUTH_MICROSOFT_ENTRA_ID_ID`, `AUTH_MICROSOFT_ENTRA_ID_SECRET`, and `AUTH_MICROSOFT_ENTRA_ID_ISSUER`
- `ENTRA_DRG_ADMIN_GROUP_ID` and `ENTRA_DRG_STAFF_GROUP_ID`
- `AZURE_TENANT_ID`, `AZURE_GRAPH_CLIENT_ID`, `AZURE_GRAPH_CLIENT_SECRET`, and `APP_URL`

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

Authentication now uses Auth.js with the Microsoft Entra ID provider. Internal roles come from Entra app roles or group claims, while `gov-reviewer` is derived from a matching email in a program's access list.

## Tests

```bash
pnpm test:all    # TypeScript + Python + Java
pnpm test        # TypeScript only (Vitest)
```

We implemented the Teams notification payload builder in TypeScript, Python, and Java to satisfy the multi-language testing requirement. `pnpm test` runs just the TypeScript suite if you don't have Java set up.

## Deployment

Live at https://drg-ims.vercel.app, hosted on Vercel for prototype iteration speed. Production target is Azure App Service alongside the rest of the client's Microsoft stack; the Vercel host is reachable from Teams and Office iframes via the CSP `frame-ancestors` headers configured in `next.config.ts`.

```bash
vercel --prod    # from the project root, after `vercel link`
```

The legacy Azure GitHub Actions workflow in `.github/workflows/franco-teams-update-feed-prototype_drg-ims.yml` is retained for reference but is not the deploy path of record.

## Microsoft Teams app

A sideloadable Teams app package lives in `teams-app/`. It registers the dashboard as both a personal app and a configurable channel tab so users can drop "DRG IMS" directly into a team's channel and pick which view (Dashboard, Records, Calendar, Documents, Submit) the tab opens to.

```bash
cd teams-app
./build.sh drg-ims.vercel.app    # rebuild whenever the host changes
```

That produces `teams-app/drg-ims-teams.zip`, ready to upload via Teams admin center or sideload. See `teams-app/README.md` for install steps.

## Linting

```bash
pnpm lint
```
