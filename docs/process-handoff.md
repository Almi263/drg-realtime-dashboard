# System Implementation & Handoff Document

**Project Title:** Information Management System (IMS)  ·  Group F Implementation
**Companion to:** System Design Document (SDD) v1.0, PMO Team, 2026-02-16
**Platform:** Microsoft cloud services (Entra ID, Dataverse, SharePoint, Power Automate, Microsoft Graph) with a Next.js application layer
**Version:** 1.0
**Date:** May 4, 2026
**Authors:** Group F — Franco Barbaro, Allison Helling, Charlie Street, Joshua Kam, Ruby Morales (OU CS4273 Capstone, Spring 2026)

---

## Table of Contents

1. Introduction
   - 1.1 Purpose
   - 1.2 Scope
   - 1.3 Intended Audience
   - 1.4 Relationship to the SDD
2. Implementation Overview
   - 2.1 What Was Built
   - 2.2 Platform Choice and Divergence from the SDD
3. Architectural Overview
   - 3.1 High-Level Architecture Diagram
   - 3.2 Component Description
4. Identity, Access, and Security
   - 4.1 Authentication
   - 4.2 Role Tiers and Permissions
   - 4.3 External Reviewer Onboarding (B2B Federation)
   - 4.4 Audit Logging
5. Data and Document Storage
   - 5.1 Dataverse Schema
   - 5.2 SharePoint Document Library
6. Workflows and Notifications
7. Tenant Provisioning Checklist
   - 7.1 Entra ID
   - 7.2 Dataverse
   - 7.3 SharePoint
   - 7.4 Power Automate
   - 7.5 Hosting
8. Environment Variables
9. Deployment, Operations, and Maintenance
   - 9.1 Current Deployment
   - 9.2 Production Migration Path
   - 9.3 Microsoft Teams Distribution
10. Testing and Quality Assurance
11. Implementation vs. Production Status
12. Appendices
    - 12.1 Glossary
    - 12.2 References
    - 12.3 Change Log

---

## 1. Introduction

### 1.1 Purpose

This document describes the realized implementation of the Information
Management System and the steps DRG needs to take to operate it inside
DRG's own Microsoft tenant. Where the SDD describes what was to be built,
this document describes what is now built, where it lives, and what
remains for DRG IT to provision.

### 1.2 Scope

This document covers:

- The implemented architecture and its mapping onto Microsoft cloud
  services
- The role-based access model and how it derives from Entra ID
- A tenant-provisioning checklist for moving from the prototype hosting
  to a DRG-owned production environment
- Operational practices for deployment, audit, and integration with
  Microsoft Teams
- The authoritative environment-variable inventory the application reads

This document does not duplicate the requirements analysis or the
business case in the SDD. Where the SDD already describes a concept, this
document references it.

### 1.3 Intended Audience

- **DRG IT and Tenant Administrators** — for tenant configuration
  (Entra ID app registrations, security groups, Dataverse environment,
  SharePoint document library, Power Automate flow setup)
- **Program Management Office (PMO) and Project Managers** — for
  understanding the realized scope and the prototype-vs-production split
- **DRG Leadership** — for an authoritative view of what was delivered
  and what is required to put it into service
- **Future maintainers** — for orientation in the codebase and the
  rationale behind each external integration

### 1.4 Relationship to the SDD

The SDD scoped the IMS as a Microsoft Power Platform solution with
PowerApps as the UI layer. This implementation retains every Microsoft
back-end service in the SDD — Dataverse, SharePoint, Power Automate,
Entra ID — and substitutes Next.js for the PowerApps UI layer. The
rationale is summarized in §2.2; the data and integration model
otherwise mirrors the SDD.

---

## 2. Implementation Overview

### 2.1 What Was Built

A web-based document repository and submission portal for CDRL/SDRL
deliverables. Site managers submit signed PDF deliverables; program
owners and external (government) reviewers retrieve and acknowledge
them; every access is recorded as immutable audit evidence. The
application is live at `https://drg-ims.vercel.app` for the duration of
the prototype; it is designed for relocation to a DRG-owned host.

### 2.2 Platform Choice and Divergence from the SDD

The SDD specified PowerApps for the UI layer. During the 2026-02-18
stakeholder session, DRG indicated a preference for a standalone web
application that could also be embedded in Microsoft Teams. The
implementation therefore uses Next.js (App Router, React 19,
TypeScript, Material UI) for the UI and continues to use the Microsoft
data and workflow services from the SDD without modification:

| SDD Component | Implementation |
|---|---|
| PowerApps (UI) | Next.js application (App Router, MUI) |
| Power Automate | Power Automate (HTTP-triggered cloud flows) — unchanged |
| Microsoft Dataverse | Microsoft Dataverse — unchanged |
| SharePoint | SharePoint document library via Microsoft Graph — unchanged |
| Azure AD / Azure Active Directory | Microsoft Entra ID via Auth.js (formerly NextAuth) |

This substitution preserves the SDD's data, security, and integration
design and adds the Teams-tab distribution requested in stakeholder
feedback.

---

## 3. Architectural Overview

### 3.1 High-Level Architecture Diagram

```
                +-------------------------------+
                |          End Users            |
                |  (DRG staff, government       |
                |   reviewers — desktop only)   |
                +---------------+---------------+
                                |
                                v
                +-------------------------------+
                |   Next.js Application Layer   |
                |  (App Router, Server Compo-   |
                |   nents, Auth.js, RBAC guards)|
                +---------------+---------------+
                                |
        +-----------+-----------+-----------+-----------+
        |           |                       |           |
        v           v                       v           v
 +-------------+ +------------+ +-------------------+ +-----------------+
 |  Microsoft  | | Microsoft  | | SharePoint via    | | Power Automate  |
 |  Entra ID   | | Dataverse  | | Microsoft Graph   | | (cloud flows,   |
 |  (Auth.js + | | (programs, | | (PDF document     | |  HTTP triggers) |
 |  B2B guests)| |  audit log,| |  library)         | |                 |
 +------+------+ |  approvals)| +-------------------+ +-----------------+
        |        +------------+
        |
        v
 +-------------+
 | External    |
 | reviewer's  |
 | home IdP    |
 | (federated) |
 +-------------+
```

### 3.2 Component Description

- **Next.js Application Layer**
  - **Features:** Server Components for data fetching and authorization,
    role-based UI gating, a four-step submission wizard, document
    repository with expandable per-document access logs, program-scoped
    visibility, deadline calendar.
  - **Role:** The presentation and orchestration tier. Performs server-
    side role checks before any Dataverse or SharePoint call.

- **Microsoft Entra ID** (via Auth.js with the Microsoft Entra ID
  provider)
  - **Features:** SSO for DRG employees; Entra app-role and security-
    group claims drive internal role assignment; B2B guest federation
    for external reviewers.
  - **Role:** Identity provider and authorization source of truth. The
    application consumes Entra claims; it does not store passwords.

- **Microsoft Dataverse** (Web API v9.2)
  - **Features:** Tables for programs, program sites, deliverables,
    deliverable types, documents, document access logs, program access
    grants, and approvals. Server-side application access via client
    secret or certificate auth.
  - **Role:** System of record for all structured data and the immutable
    audit log.

- **SharePoint Document Library** (Microsoft Graph API)
  - **Features:** PDF storage organized by program and deliverable;
    server-side upload and download proxied through Microsoft Graph.
  - **Role:** Document storage tier. Pointers from Dataverse `drg_document`
    records resolve to SharePoint drive items.

- **Power Automate Cloud Flows**
  - **Features:** Five HTTP-triggered flows fire on submission, document
    download, approval decisions, approval acknowledgement, and program-
    access changes. DRG owns flow logic.
  - **Role:** Workflow and notification middleware between the
    application and the rest of the Microsoft 365 environment.

- **Microsoft Graph Invitations**
  - **Features:** Programmatic creation of B2B guest invitations and
    transitive group-membership verification.
  - **Role:** Onboards external reviewers into DRG's tenant when a
    program access grant is created.

---

## 4. Identity, Access, and Security

### 4.1 Authentication

The application uses **Auth.js** with the **Microsoft Entra ID**
provider. There is no second password and no application-managed
password store. DRG employees authenticate against the DRG tenant
directly. External reviewers authenticate via Entra B2B federation
(see §4.3). Token validation, session storage, and CSRF protection are
handled by Auth.js; the application reads the resulting claims and
maps them to internal roles.

### 4.2 Role Tiers and Permissions

Four internal roles plus one effective role derived from program
access:

| Role | Granted via | Capabilities |
|---|---|---|
| `drg-admin` | Entra group `ENTRA_DRG_ADMIN_GROUP_ID` | Full access. Creates programs, manages accounts, deletes records. |
| `drg-program-owner` | Entra group `ENTRA_DRG_PROGRAM_OWNER_GROUP_ID` | Owns one or more programs. Adds and removes staff and external reviewers on owned programs. |
| `drg-staff` | Entra group `ENTRA_DRG_STAFF_GROUP_ID` | Sees only programs they are explicitly assigned to. Submits deliverables. |
| `external-reviewer` | Entra group `ENTRA_EXTERNAL_REVIEWER_GROUP_ID` (B2B guest) | View and download on programs they are explicitly granted. May re-upload signed copies. Cannot delete. |
| `gov-reviewer` (effective) | Email match against a program's access list | Applied to authenticated users without an internal Entra role whose email appears in a program's access entries. Same effective rights as `external-reviewer`. |

The role-claim mapping is implemented in `src/lib/auth/roles.ts` and
accepts multiple claim shapes (Entra app roles, group IDs, and common
synonyms) so that DRG IT may assign roles via either app-role
assignment or group membership.

### 4.3 External Reviewer Onboarding (B2B Federation)

When a program owner grants a reviewer access, the application calls
`Microsoft Graph /invitations` to create a B2B guest invitation. The
reviewer receives a Microsoft invitation email. On redemption, Entra
detects the reviewer's home tenant and federates the sign-in to the
reviewer's identity provider; the reviewer authenticates with the
credentials they already have, and Entra accepts the resulting token.
DRG never holds an external user's password and never issues an
application-managed credential.

### 4.4 Audit Logging

The `drg_documentaccesslog` Dataverse table is the system of record for
"who saw what, when." A log entry is written before the file is streamed
to the user and is never deleted by the application. Each entry
captures user identity (Entra principal), document, action
(`opened`, `downloaded`, `acknowledged`), timestamp, and the requesting
program context. This is the evidence used to rebut government disputes
about non-receipt of CDRL deliverables.

---

## 5. Data and Document Storage

### 5.1 Dataverse Schema

The application reads and writes the following Dataverse tables (all
prefixed `drg_`):

- `drg_program` — program records (CDRL/SDRL contracts)
- `drg_programsite` — sites belonging to a program
- `drg_programaccess` — explicit access grants per (program, user)
- `drg_deliverable` — individual CDRL/SDRL items within a program
- `drg_deliverabletype` — deliverable type catalog
- `drg_document` — submitted document records, including SharePoint
  pointers
- `drg_documentaccesslog` — immutable access log (see §4.4)
- `drg_approval` — program-owner and external-reviewer approval
  decisions

Schema definitions live alongside the application code in
`src/lib/dataverse/` as TypeScript modules; column names follow the
Dataverse `drg_*` prefix convention.

### 5.2 SharePoint Document Library

PDFs are stored in a SharePoint document library accessed through the
Microsoft Graph drive API. The default folder strategy is
`{SHAREPOINT_DOCUMENT_FOLDER}/{programId}/{deliverableId}/`, configurable
via `SHAREPOINT_FOLDER_STRATEGY`. Only PDFs are accepted at the
application layer; any other file type is rejected with a business-rule
error before upload is attempted.

---

## 6. Workflows and Notifications

The application emits HTTP requests to five Power Automate cloud flows.
Each flow URL is supplied through environment variables. DRG owns the
flow contents — typical implementations send Teams or email
notifications, archive copies into a quality-management library, or
update downstream Microsoft 365 calendars.

| Flow | Triggered when |
|---|---|
| `submissionCreated` | A staff member submits a deliverable document |
| `documentDownloaded` | A reviewer opens a document |
| `approvalDecisionSubmitted` | An approver records a decision |
| `approvalAcknowledged` | A signed approval is acknowledged |
| `programAccessChanged` | A program access grant is created or revoked |

If a flow URL is not configured, the application logs a no-op and
continues; this is intentional so local development and unconfigured
environments do not block functionality.

---

## 7. Tenant Provisioning Checklist

The following items must exist in DRG's tenant before the application
is ready for production use. Items in **bold** require a Tenant
Administrator.

### 7.1 Entra ID

- [ ] **Application registration** for the web app
  - Redirect URI: `https://<host>/api/auth/callback/microsoft-entra-id`
  - Client secret OR certificate
  - Delegated scopes: `openid`, `profile`, `email`, `User.Read`
  - App roles or group claims included in the ID/access token
- [ ] **Application registration** for Microsoft Graph invitations
  - Application permissions: `User.Invite.All`, `User.Read.All`,
    `GroupMember.Read.All`
  - Admin consent granted
- [ ] **Application registration** for Dataverse
  - Client secret or certificate credentials
  - Granted access as a Dataverse Application User
- [ ] **Application registration** for SharePoint via Graph
  - Application permissions: `Sites.Selected` (preferred) or
    `Files.ReadWrite.All`
  - Admin consent granted
- [ ] **Four Entra security groups** populated with the appropriate
      personnel:
  - DRG Admin
  - DRG Program Owner
  - DRG Staff
  - External Reviewer

### 7.2 Dataverse

- [ ] Dataverse environment provisioned in the Power Platform admin
      center
- [ ] Solution created containing the `drg_*` tables listed in §5.1
- [ ] Application User created from the Dataverse app registration
- [ ] Security role granted to the Application User with create, read,
      update, and append permissions on the `drg_*` tables (delete
      restricted to elevated admin roles per organizational policy)

### 7.3 SharePoint

- [ ] Document library provisioned in the chosen SharePoint site
      (default name: "DRG Submissions")
- [ ] Site ID and Drive ID recorded for environment configuration
- [ ] If `Sites.Selected` is used, the SharePoint app registration is
      explicitly granted access to the chosen site (PowerShell or
      Graph call)

### 7.4 Power Automate

- [ ] Five HTTP-triggered cloud flows created (see §6). Each flow
      receives a JSON payload from the application; flow logic is owned
      by DRG.
- [ ] Trigger URLs collected and recorded for environment configuration

### 7.5 Hosting

- [ ] Decide host. The prototype runs on Vercel; production target is
      Azure App Service (see §9.2)
- [ ] DNS record (e.g. `drg-ims.drg.com`) pointed at the production host
- [ ] Environment variables loaded (see §8)
- [ ] HTTPS certificate in place (managed by host)

---

## 8. Environment Variables

The application's authoritative environment-variable inventory is
`.env.example` in the repository root. All variables are read on the
server only; no secret reaches the browser bundle.

**Auth.js and Entra ID**

```
AUTH_SECRET                       # 32+ character random string
AUTH_URL                          # public app URL, e.g. https://drg-ims.drg.com
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

**SharePoint via Microsoft Graph**

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

**Microsoft Graph (B2B Invitations)**

```
AZURE_TENANT_ID
AZURE_GRAPH_CLIENT_ID
AZURE_GRAPH_CLIENT_SECRET
APP_URL                           # public URL guests are redirected to
```

When a service is unconfigured (its required variables are blank), the
application falls back to mock or no-op behavior. This is deliberate so
that local development and partial-rollout staging environments remain
functional.

---

## 9. Deployment, Operations, and Maintenance

### 9.1 Current Deployment

The prototype is deployed to **Vercel** at `https://drg-ims.vercel.app`.
The hosting choice was made for iteration speed during the capstone
phase. The application has no Vercel-specific dependencies; it is a
standard Next.js App Router build.

### 9.2 Production Migration Path

The intended production host is **Azure App Service**, consolidating the
deployment with the rest of DRG's Microsoft 365 footprint. Migration is
a configuration exercise: provision the App Service plan, push the
Next.js build, set the environment variables from §8, and update the
DNS record. No code changes are required.

### 9.3 Microsoft Teams Distribution

A sideloadable Microsoft Teams app package is provided in `teams-app/`.
It registers the IMS as both a personal app and a configurable channel
tab. The package's host URL is generated at build time:

```
cd teams-app
./build.sh drg-ims.drg.com
```

The output `teams-app/drg-ims-teams.zip` is uploaded via the Teams
admin center or sideloaded by individual users with the appropriate
permission. Frame-ancestor headers in `next.config.ts` allow embedding
from `teams.microsoft.com`, `*.office.com`, `*.sharepoint.com`, and
`*.cloud.microsoft`.

---

## 10. Testing and Quality Assurance

The implementation includes a multi-language test suite and a
production-integration test set:

- **TypeScript (Vitest)** — unit tests for notification payloads, route
  access guards, role-claim mapping, and the production integration
  contracts (`tests/typescript/productionIntegration.test.ts`).
- **Python (unittest)** — parallel implementation of the Teams
  notification payload to satisfy the cross-language requirement.
- **Java (JUnit 5 + Mockito)** — same payload reimplemented to verify
  contract stability across runtimes.
- **Linting** — ESLint with the Next.js core-web-vitals and TypeScript
  rules (`pnpm lint`).

All suites run from a single command, `pnpm test:all`. The TypeScript
production-integration tests cover Dataverse choice and lookup mapping,
program visibility by role, document upload validation, archived-program
upload blocking, approval business rules, audit log payloads, and Power
Automate acknowledgment payloads.

---

## 11. Implementation vs. Production Status

| Area | Status |
|---|---|
| Authentication via Entra ID | Production-ready; real provider wired through Auth.js |
| Role mapping (4 roles) | Production-ready; Entra app roles and group claims supported |
| Dataverse data model and CRUD | Production-ready; real Web API client with cert or secret auth |
| SharePoint upload and download | Production-ready; real Microsoft Graph integration |
| Power Automate triggers | Production-ready on the application side; flows must be authored on the DRG side |
| External reviewer invitations | Production-ready; real Graph `/invitations` calls |
| Immutable audit log | Production-ready; written to `drg_documentaccesslog` |
| Mock connectors | Retained as a fallback when env vars are blank; safe to leave in production with all variables set |
| Branding | Default DRG logos and a navy primary theme; further refinement is at DRG's discretion |
| Multi-factor authentication | Inherited from DRG's Entra conditional access policies; not enforced inside the application |

---

## 12. Appendices

### 12.1 Glossary

- **Auth.js** — Open-source authentication library for Next.js
  (formerly NextAuth). Used here with the Microsoft Entra ID provider.
- **B2B Federation** — Microsoft Entra External Identities feature that
  allows guest users to sign in with credentials from their home
  organization's identity provider.
- **CDRL / SDRL** — Contract Data Requirements List / Subcontract Data
  Requirements List. The deliverable categories the IMS exists to
  manage.
- **Entra ID** — Microsoft's identity service, formerly Azure Active
  Directory.
- **MUI** — Material UI, the React component library used for the UI.
- **Next.js App Router** — The file-based routing and Server Component
  framework used for the application layer.
- **PMO** — Program Management Office. Authors of the original SDD.
- **RBAC** — Role-Based Access Control.
- **SDD** — System Design Document. The companion document to this one,
  authored by the DRG PMO Team on 2026-02-16.
- **SSO** — Single Sign-On.

### 12.2 References

- DRG System Design Document v1.0 (PMO Team, 2026-02-16)
- Microsoft Entra ID documentation: https://learn.microsoft.com/entra/identity
- Microsoft Dataverse Web API: https://learn.microsoft.com/power-apps/developer/data-platform/webapi/overview
- Microsoft Graph `/invitations` (B2B): https://learn.microsoft.com/graph/api/invitation-post
- Microsoft Graph file upload: https://learn.microsoft.com/graph/api/driveitem-put-content
- Power Automate HTTP trigger flows: https://learn.microsoft.com/power-automate/triggers-introduction
- Auth.js Microsoft Entra ID provider: https://authjs.dev/getting-started/providers/microsoft-entra-id
- Next.js App Router: https://nextjs.org/docs/app
- Application repository: https://github.com/Almi263/drg-realtime-dashboard
- Live deployment: https://drg-ims.vercel.app

### 12.3 Change Log

| Version | Date | Description | Author |
|---|---|---|---|
| 1.0 | 2026-05-04 | Initial implementation handoff document | Group F |

---

## Conclusion

This document records the realized state of the Information Management
System and the steps required to operate it in DRG's tenant. The
implementation honors the architectural intent of the SDD — Entra ID,
Dataverse, SharePoint, and Power Automate — and substitutes a Next.js
application layer for the PowerApps UI to support the standalone-web
and Microsoft Teams distribution model requested by stakeholders. With
the provisioning checklist in §7 complete and the environment variables
in §8 populated, the system is ready for DRG production operation.

For implementation questions, contact Group F.
