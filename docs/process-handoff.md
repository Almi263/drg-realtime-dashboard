# DRG IMS — Handoff & Operations Guide

**Version 1.0**  ·  **CS4273 Capstone, Group F**  ·  Spring 2026

This document is for DRG IT and stakeholders. It explains what the system is,
how it fits into your Microsoft environment, what you need to provision, and
the contracts the codebase already implements. It does not require reading any
source code.

---

## 1. What this system does

DRG IMS is a **web-based Information Management System** that replaces the
26-site CDRL/SDRL submission email chain with a centralized, audit-trailed
document repository.

A submission goes in once. Every authorized viewer — DRG, the on-site
government representative (CORE), the NOC, and the customer — sees the same
canonical PDF. Every view is recorded. If the government later disputes
receipt, the access log is the evidence.

Three things distinguish it from a generic SharePoint folder:

1. **Per-program scoping.** Every deliverable and document belongs to a
   program. Access is granted at the program level, not the folder level.
2. **Immutable from the outside.** External reviewers can view and download.
   They cannot delete. Only DRG admins can delete.
3. **Auditable.** Every document open is logged with user, timestamp, and
   action. The log is stored as a first-class Dataverse entity, not derived
   from server logs.

---

## 2. Architecture overview

```
        ┌──────────────────────────────────────┐
        │  Browser (DRG staff, gov reviewer)   │
        └──────────────────┬───────────────────┘
                           │  HTTPS
        ┌──────────────────▼───────────────────┐
        │  Next.js App Router (Vercel today,   │
        │  Azure App Service-ready for prod)   │
        │  ─────────────────────────────────   │
        │  Pages, server actions, RBAC guards  │
        └─┬─────────┬─────────┬─────────┬──────┘
          │         │         │         │
          │         │         │         │ Server-only:
          │         │         │         │
   ┌──────▼──┐ ┌────▼────┐ ┌──▼─────┐ ┌─▼────────────┐
   │ Entra   │ │Dataverse│ │SharePnt│ │Power Automate│
   │ ID      │ │ Web API │ │ Graph  │ │  webhooks    │
   │ (Auth.js│ │ (records│ │ (PDFs) │ │ (notify,     │
   │  + B2B) │ │  & ACL) │ │        │ │  approvals)  │
   └─────────┘ └─────────┘ └────────┘ └──────────────┘
```

**Stack at a glance**

| Concern | Implementation |
|---|---|
| Web framework | Next.js 16 (App Router), React 19, TypeScript |
| UI | Material UI (MUI 7), navy primary theme |
| Auth | Auth.js with Microsoft Entra ID provider |
| External user invites | Microsoft Graph `/invitations` (B2B guest) |
| Structured data | Microsoft Dataverse via Web API v9.2 |
| Document storage | SharePoint document library via Microsoft Graph |
| Workflows / notifications | Power Automate cloud flows (HTTP triggers) |
| Hosting (today) | Vercel — `https://drg-ims.vercel.app` |
| Hosting (production target) | Azure App Service, same tenant as DRG's MS stack |
| Teams integration | Sideloadable Teams app (`teams-app/drg-ims-teams.zip`) registers the site as both a personal app and a configurable channel tab |

---

## 3. Identity & access

### 3.1 Authentication

The application uses **Auth.js** (formerly NextAuth) with the **Microsoft
Entra ID** provider. There is no second password; every user authenticates
through Entra.

- **DRG employees** sign in with their normal DRG Microsoft account. They are
  recognized by Entra app role assignment or group membership.
- **External (government, customer) reviewers** are added to DRG's Entra
  tenant as **B2B guests**. Microsoft Entra federates the sign-in to the
  reviewer's home identity provider — the reviewer authenticates wherever
  they normally do, and Entra accepts the resulting token. DRG never holds an
  external user's password.

External reviewer onboarding is automated: when an admin grants a reviewer
access to a program, the application calls `Microsoft Graph /invitations`
(see `src/lib/graph/invitations.ts`). The reviewer receives a Microsoft
invitation email with a one-time redemption link bound to their email.

### 3.2 Role tiers

Four internal roles, plus one effective role derived from program access:

| Role | Granted via | Capabilities |
|---|---|---|
| `drg-admin` | Entra group `ENTRA_DRG_ADMIN_GROUP_ID` | Full access. Creates programs, manages accounts, deletes records. |
| `drg-program-owner` | Entra group `ENTRA_DRG_PROGRAM_OWNER_GROUP_ID` | Owns one or more programs. Adds/removes staff and external reviewers on owned programs. |
| `drg-staff` | Entra group `ENTRA_DRG_STAFF_GROUP_ID` | Sees only programs they are assigned to. Submits deliverables. |
| `external-reviewer` | Entra group `ENTRA_EXTERNAL_REVIEWER_GROUP_ID` (B2B guest) | View + download only on programs they are explicitly granted. Can re-upload signed copies; cannot delete. |
| `gov-reviewer` | Email match against a program's access list | Effective role applied to authenticated users whose email appears in a program's access list but who do not hold an internal Entra role. |

Role-claim mapping is implemented in `src/lib/auth/roles.ts` and accepts
multiple claim shapes (Entra app roles, group IDs, common synonyms).

### 3.3 Permission model summary

- **Programs** — admins create. Program owners manage their programs'
  membership. Staff and reviewers see only what they are added to.
- **Deliverables** — created by admins or program owners. Visible to anyone
  who has access to the parent program.
- **Documents** — uploaded by staff (or above). Downloadable by anyone with
  program access. Deletable only by admins.
- **Access logs** — write-once, view-only by DRG roles, never modifiable.

---

## 4. Data flow: a CDRL submission

1. **Staff submits** via the web wizard (`/submit?programId=…&deliverableId=…`).
   The PDF is uploaded directly to SharePoint through Microsoft Graph; the
   Dataverse `drg_document` record stores the SharePoint pointer plus
   metadata.
2. **Power Automate `submissionCreated` flow** fires. DRG owns the flow
   logic: send a Teams or email notification to the relevant program owners
   and reviewers, e.g. "A new SDRL was submitted for Surface Comms."
3. **External reviewer opens the document.** The download is proxied through
   Microsoft Graph; before the file streams, an entry is written to the
   `drg_documentaccesslog` table — user, document, action, timestamp.
4. **Government dispute scenario.** A program owner opens the document detail
   page, sees the access timeline showing every viewer and time. This is the
   evidence used to rebut "we never received it."

PDFs are stored under
`{SHAREPOINT_DOCUMENT_FOLDER}/{programId}/{deliverableId}/` by default. The
folder strategy is configurable via `SHAREPOINT_FOLDER_STRATEGY` (`flat` or
`program-deliverable`).

---

## 5. Provisioning checklist (for DRG IT)

To run this in DRG's own tenant, the following must be set up. Items in
**bold** require a tenant administrator.

### 5.1 Entra ID

- [ ] **App registration** for the web app
  - Redirect URI: `https://<host>/api/auth/callback/microsoft-entra-id`
  - Client secret OR certificate
  - Scopes (delegated): `openid`, `profile`, `email`, `User.Read`
  - App roles or groups exposed in the ID/access token
- [ ] **App registration** for the Graph invitation service
  - Application permissions: `User.Invite.All`, `User.Read.All`,
    `GroupMember.Read.All`
  - Admin consent granted
- [ ] **App registration** for Dataverse access
  - Either client secret or client certificate
  - Granted access to the Dataverse environment as an Application User
- [ ] **App registration** for SharePoint Graph access
  - Application permissions: `Sites.Selected` (preferred) or
    `Files.ReadWrite.All`
  - Admin consent granted
- [ ] **Four Entra security groups**, each populated as the role mapping
  intends:
  - DRG Admin, DRG Program Owner, DRG Staff, External Reviewer

### 5.2 Dataverse

- [ ] A Dataverse environment provisioned (Power Platform admin center)
- [ ] Solution containing the `drg_*` tables: `drg_program`, `drg_programsite`,
      `drg_deliverable`, `drg_deliverabletype`, `drg_document`,
      `drg_documentaccesslog`, `drg_programaccess`, `drg_approval`. Schema is
      defined by the application's TypeScript models in
      `src/lib/dataverse/`.
- [ ] Application User created from the Dataverse app registration
- [ ] Security role granted to the Application User with read/write on the
      `drg_*` tables

### 5.3 SharePoint

- [ ] Document library provisioned in a chosen SharePoint site (the "DRG
      Submissions" library, by default)
- [ ] Site ID and Drive ID recorded for env configuration
- [ ] If using `Sites.Selected`, the SharePoint app registration must be
      granted access to the specific site (PowerShell or Graph call)

### 5.4 Power Automate

- [ ] Five HTTP-triggered cloud flows created. Each receives a JSON payload
      from the application; flow logic is owned by DRG:

      1. `submissionCreated` — fired when a deliverable is submitted
      2. `documentDownloaded` — fired when a reviewer opens a document
      3. `approvalDecisionSubmitted` — fired when an approver records a
         decision
      4. `approvalAcknowledged` — fired when an acknowledgement is recorded
      5. `programAccessChanged` — fired when access is granted or revoked

- [ ] Trigger URLs collected for env configuration

### 5.5 Hosting

- [ ] Decide host. Vercel works today; production target is Azure App Service
      to consolidate within DRG's Microsoft stack
- [ ] DNS record (e.g. `drg-ims.drg.com`) pointed at the host
- [ ] Environment variables loaded (see §6)

---

## 6. Environment variables

Source of truth: `.env.example`. All variables are read server-side; nothing
sensitive ships to the browser.

**Auth.js + Entra ID**

```
AUTH_SECRET                       # 32+ char random string
AUTH_URL                          # e.g. https://drg-ims.drg.com
AUTH_MICROSOFT_ENTRA_ID_ID        # Entra app (client) ID
AUTH_MICROSOFT_ENTRA_ID_SECRET    # client secret VALUE (not the secret ID)
AUTH_MICROSOFT_ENTRA_ID_ISSUER    # https://login.microsoftonline.com/<tenant>/v2.0

ENTRA_DRG_ADMIN_GROUP_ID
ENTRA_DRG_PROGRAM_OWNER_GROUP_ID
ENTRA_DRG_STAFF_GROUP_ID
ENTRA_EXTERNAL_REVIEWER_GROUP_ID
```

**Dataverse**

```
DATAVERSE_ENVIRONMENT_URL         # https://<org>.crm.dynamics.com
DATAVERSE_TENANT_ID
DATAVERSE_CLIENT_ID
DATAVERSE_CLIENT_SECRET           # ── or use certificate auth ──
DATAVERSE_CLIENT_CERTIFICATE_PRIVATE_KEY
DATAVERSE_CLIENT_CERTIFICATE_THUMBPRINT
DATAVERSE_SCOPE                   # usually <env-url>/.default
```

**SharePoint via Graph**

```
SHAREPOINT_TENANT_ID
SHAREPOINT_CLIENT_ID
SHAREPOINT_CLIENT_SECRET
SHAREPOINT_SITE_ID
SHAREPOINT_DRIVE_ID
SHAREPOINT_DOCUMENT_FOLDER        # default "DRG Submissions"
SHAREPOINT_FOLDER_STRATEGY        # "program-deliverable" or "flat"
```

**Power Automate**

```
POWER_AUTOMATE_SUBMISSION_CREATED_URL
POWER_AUTOMATE_DOCUMENT_DOWNLOADED_URL
POWER_AUTOMATE_APPROVAL_DECISION_SUBMITTED_URL
POWER_AUTOMATE_APPROVAL_ACKNOWLEDGED_URL
POWER_AUTOMATE_PROGRAM_ACCESS_CHANGED_URL
```

**Microsoft Graph (B2B invitations)**

```
AZURE_TENANT_ID
AZURE_GRAPH_CLIENT_ID
AZURE_GRAPH_CLIENT_SECRET
APP_URL                           # the public app URL guests are redirected to
```

If a service is not configured, the application falls back to mock or
no-op behavior so local development continues to work.

---

## 7. Operational notes

### 7.1 Deployment

The current host is **Vercel**. To deploy to Azure App Service for
production, the application has no Vercel-specific dependencies — it is a
standard Next.js App Router build. The Teams app package
(`teams-app/drg-ims-teams.zip`) hard-codes the host URL; rebuild via
`teams-app/build.sh <host>` whenever the host changes.

### 7.2 Audit guarantees

The `drg_documentaccesslog` Dataverse entity is the system of record for
"who saw what, when." Entries are written before the document streams to
the user. The application never deletes log entries; if DRG wants
retention rules, configure them at the Dataverse level.

### 7.3 What is prototype vs. production

| Area | Status |
|---|---|
| Authentication, roles, RBAC | Production-ready, real Entra integration |
| Dataverse data model | Production-ready, real Web API client |
| SharePoint upload/download | Production-ready, real Graph integration |
| Power Automate triggers | Production-ready; flows must be built on DRG side |
| External reviewer invitations | Production-ready, real Graph invitations |
| Audit log | Production-ready, written to Dataverse |
| Mock connectors | Still present as fallback when env is unconfigured. Safe to remove on the production deployment by setting all required env vars. |
| Branding | Default DRG logos. Theme is in `src/lib/theme.ts`. |

### 7.4 Things DRG owns post-handoff

- Tenant configuration (app registrations, security groups, Application
  User, group membership)
- The five Power Automate flow definitions
- The Dataverse solution (tables, security roles, retention)
- The SharePoint document library and any retention/eDiscovery config
- The deployment host (Vercel or Azure)
- Branding and any further role refinements (e.g. compartmented programs,
  if introduced later)

### 7.5 Things the application enforces

- Only PDFs can be uploaded as deliverable documents
- Documents cannot be deleted by anyone except `drg-admin`
- Access logs are written before the file is served
- Role checks run on the server (Server Components / route guards), not
  only in the UI
- External reviewers' visible programs are scoped to their access entries
  — they cannot enumerate other programs

---

## 8. Repository

- Source: `https://github.com/Almi263/drg-realtime-dashboard`
- Live: `https://drg-ims.vercel.app`
- Tests: `pnpm test:all` (TypeScript + Python + Java)
- Lint: `pnpm lint`

---

*Group F: Franco Barbaro, Allison Helling, Charlie Street, Joshua Kam,
Ruby Morales*
