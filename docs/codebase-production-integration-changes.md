# Codebase Changes Needed for Full Product Integration

This document assumes the Dataverse tables, Power Automate cloud flows, and Dataverse security roles described in the following files have already been implemented:

- [dataverse-data-model.md](./dataverse-data-model.md)
- [power-automate-cloud-flows.md](./power-automate-cloud-flows.md)
- [dataverse-security-roles.md](./dataverse-security-roles.md)

The current Next.js project is still mostly a front-end prototype backed by in-memory mock data. To make the full product work, the code needs to be changed from mock-first UI state into a Dataverse-backed application that writes document files to SharePoint, writes business metadata to Dataverse, and calls Power Automate for workflow actions.

## Current Project State

The app currently uses:

- Next.js App Router with MUI components.
- NextAuth Microsoft Entra sign-in in `auth.ts`.
- Mock data connectors in `src/lib/connectors/mock-programs.ts`, `src/lib/connectors/mock-deliverables.ts`, and `src/lib/connectors/mock-documents.ts`.
- Simplified TypeScript models in `src/lib/models`.
- Client-side program/access state in `src/lib/context/role-context.tsx`.
- Basic role mapping for only `drg-admin` and `drg-staff`.
- Program visibility checks based on the mock `Program.accessList`.

The production Dataverse setup now requires the app to support:

- Real Dataverse rows for programs, program access, deliverable types, deliverables, documents, approvals, program sites, and document access logs.
- SharePoint as the PDF binary store.
- Power Automate flows as the workflow/status rollup layer.
- Entra and Dataverse security roles for admins, program owners, staff, and external reviewers.
- Program-specific authorization through `drg_programaccess`.

## 1. Replace Mock Connectors with Production Data Services

Current code imports mock connectors directly in route files such as:

- `src/app/page.tsx`
- `src/app/programs/page.tsx`
- `src/app/records/page.tsx`
- `src/app/documents/page.tsx`
- `src/app/calendar/page.tsx`
- `src/app/submit/page.tsx`

Create a production data access layer instead of instantiating `MockProgramConnector`, `MockDeliverableConnector`, and `MockDocumentConnector` in pages.

Recommended structure:

- `src/lib/dataverse/client.ts`
- `src/lib/dataverse/programs.ts`
- `src/lib/dataverse/program-access.ts`
- `src/lib/dataverse/deliverable-types.ts`
- `src/lib/dataverse/deliverables.ts`
- `src/lib/dataverse/documents.ts`
- `src/lib/dataverse/approvals.ts`
- `src/lib/dataverse/document-access-logs.ts`
- `src/lib/sharepoint/files.ts`
- `src/lib/power-automate/flows.ts`

The server pages should call service functions such as `listVisiblePrograms(user)`, `listVisibleDeliverables(user)`, and `listVisibleDocuments(user)` instead of reading all mock rows and filtering them locally.

Keep the mock connectors only as test/demo fixtures, not as application data sources.

## 2. Expand TypeScript Models to Match Dataverse

The current models are too small for the implemented Dataverse schema.

Required model changes:

- Replace the simplified `Program` shape with Dataverse-backed fields: `programNumber`, `status`, `ownerUserId`, `ownerUpn`, `creatorUpn`, archive fields, and normalized related sites.
- Replace `Program.accessList` with explicit `ProgramAccess` rows from `drg_programaccess`.
- Replace the fixed deliverable type union with rows from `drg_deliverabletype`, because staff/admin users can add custom types.
- Replace current deliverable statuses with the Dataverse choices: `Not Submitted`, `Submitted`, `In Review`, `Returned`, `Pending Acknowledgment`, `Complete`, `Overdue - Waiting on Reviewer`, and `Overdue - Waiting on DRG`.
- Replace document file type/status modeling with Dataverse document metadata: `documentRole`, `submissionNumber`, SharePoint IDs/URLs, `approvalId`, `parentDocumentId`, `isCurrentVersion`, superseded fields, viewed fields, and review due date.
- Add missing models for `Approval`, `ProgramSite`, `DocumentAccessLog`, and `DeliverableType`.

The app should use internal TypeScript enums/string unions that exactly match the Dataverse choice labels or a mapper that translates Dataverse numeric option values into stable app labels.

## 3. Add Dataverse Authentication and API Access

NextAuth currently signs users in, but the app does not yet call Dataverse.

Add server-side Dataverse API support with environment variables for:

- Dataverse environment URL.
- Tenant ID.
- App registration client ID.
- App registration client secret or certificate configuration.
- Dataverse scope/resource.

Update `.env.example` with these values.

The Dataverse client should:

- Run only on the server.
- Acquire an access token for Dataverse.
- Centralize OData request construction.
- Handle Dataverse errors and alternate-key conflicts.
- Map Dataverse lookup fields such as `_drg_program_value` into app model IDs.
- Map choice values into app-safe labels.

Do not call Dataverse directly from client components.

## 4. Update Authorization to Use Real Roles and Program Access

Current role support maps only:

- `drg-admin`
- `drg-staff`
- derived `gov-reviewer`

Production roles need to align with the implemented security roles and Entra groups:

- `drg-admin`
- `drg-program-owner`
- `drg-staff`
- `external-reviewer`

Update `src/lib/auth/roles.ts` to map all required Entra app roles or group IDs. Also add environment variables for the program owner and external reviewer groups.

Update `src/lib/auth/guards.ts` so program access is checked against `drg_programaccess`, not the mock `Program.accessList`.

Authorization rules needed in code:

- Only DRG admins can create programs.
- Program owners and DRG admins can grant/revoke program access.
- DRG staff can work only assigned programs.
- External reviewers can view/download/upload only for active assigned programs.
- Archived programs remain readable but block uploads.
- Approval actions must require the current reviewer, active program access, and a current approval row.

The Dataverse security roles provide the platform boundary, but the web app still needs friendly authorization checks before it renders actions or submits writes.

## 5. Replace Client-Side Program Access State with Dataverse Writes

`src/lib/context/role-context.tsx` currently creates programs and grants/revokes access in React state. That state disappears on refresh and bypasses Dataverse business rules.

Required changes:

- Remove in-memory program creation as the source of truth.
- Create server actions or route handlers for program creation and access management.
- On program creation, write a `drg_program` row and let the `Program Owner Access Sync` flow create/update the owner access row.
- On access grant, create or update a `drg_programaccess` row with normalized email, access role, active flag, granted metadata, and Entra object ID when available.
- On access revoke, set `drg_isactive = false` and let the revoke flow stamp revocation metadata.
- Surface duplicate access and inactive-access states from Dataverse instead of filtering arrays in the browser.

The app should also enforce the external reviewer prerequisite: external users must already exist as Entra guests and be in the external reviewer group before they are granted program access.

## 6. Implement SharePoint PDF Upload and Download

The production model stores file binaries in SharePoint and stores file metadata in Dataverse.

The submit/upload experience must change from UI-only prototype behavior to this sequence:

1. Validate the selected file is a PDF.
2. Check the user can upload for the selected program/deliverable.
3. Check the parent program is not archived.
4. Upload the PDF to the configured SharePoint site/library/folder.
5. Create the `drg_document` Dataverse row with SharePoint site URL, drive ID, item ID, file URL, file size, role, uploader email, deliverable, program, and review due date.
6. Let the `DRG Submission Created` flow assign submission number, update deliverable status, supersede prior submissions, create approvals, and notify reviewers.

Download/view actions must also be routed through the app so it can create a `drg_documentaccesslog` row. Those logs trigger flows such as `External Reviewer Downloads Submission` and `Reviewer Response Viewed By DRG`.

Required configuration:

- SharePoint site URL.
- SharePoint drive/library ID.
- Base folder/path strategy.
- Optional folder convention by program and deliverable.

## 7. Add Approval and Reviewer Workflows to the UI

The implemented product model includes `drg_approval`, but the current app does not expose approval decision workflows.

Add UI and server actions for:

- External reviewer sees current assigned approvals.
- External reviewer downloads the current DRG Submission.
- External reviewer rejects with required comments and optional Reviewer Response PDF.
- External reviewer approves only after uploading a Signed Approval PDF.
- DRG staff/program owner views returned reviewer comments/response PDFs.
- DRG staff/program owner acknowledges signed approvals.

These operations must write to Dataverse in ways that align with the Power Automate flows:

- Reviewer response and signed approval uploads create `drg_document` rows with `drg_documentrole = Reviewer Response` or `Signed Approval` and `drg_parentdocument` set to the DRG submission.
- Reviewer decisions update `drg_approval.drg_decision`, `drg_comments`, and `drg_responsedocument`.
- Acknowledgment should call the instant Power Automate flow, or perform the same Dataverse updates only if the app is explicitly taking ownership of that workflow.

## 8. Add Power Automate Flow Integration Points

Most cloud flows are Dataverse-triggered, so the app mainly needs to write the correct rows. The exception is the instant acknowledgment flow.

Add a Power Automate client for:

- Calling the `DRG Acknowledges Signed Approval` instant flow.
- Passing deliverable ID, accepted submission document ID, and signed approval document ID.
- Handling success/failure responses in the UI.

For Dataverse-triggered flows, document which app action creates or modifies each triggering row:

- Program owner selection triggers owner access sync.
- Program status archive triggers archive stamping.
- Deliverable type creation triggers normalization.
- Program access creation/modification triggers normalization/revocation stamping.
- DRG submission document creation triggers submission workflow.
- Document access log creation triggers review-start/viewed workflow.
- Reviewer document creation triggers response/signed-approval linking.
- Approval update triggers decision rollup.

## 9. Update Routes and Pages Around Real Permissions

The app currently shows broad dashboard data from mock connectors. Production pages should be scoped by the current user.

Required route behavior:

- Dashboard: show only non-archived programs/deliverables visible to the user.
- Programs: admins can see all active programs; program owners/staff/reviewers see assigned active programs.
- Records/Deliverables: filter by active program access and hide archived programs by default.
- Documents: show only documents for visible programs and include current-version/role/status filters.
- Calendar: calculate deadlines from visible deliverables and approval due dates.
- Submit: allow DRG admins/staff/program owners only where they have assigned access and the program is not archived.
- Program access management: visible only to admins and program owners for the selected program.
- Reviewer queue: new route or view for external reviewers to act on current approvals.

Archived programs should have a separate view or filter. They should allow read/download/audit but not new uploads.

## 10. Rework Dashboard Metrics and Status Logic

Current dashboard status logic is based on prototype statuses such as `Draft`, `Approved`, and `Overdue`.

Production status displays must be based on Dataverse status choices:

- Deliverable status from `drg_deliverable.drg_status`.
- Document status from `drg_document.drg_status`.
- Approval state from current `drg_approval` rows.
- Current submission from `drg_document.drg_iscurrentversion`.
- Overdue states generated by scheduled flows.

Avoid calculating authoritative workflow state in the browser. The browser can group and summarize statuses, but Dataverse/Power Automate should own state transitions.

## 11. Persist Audit History as `drg_documentaccesslog`

The current mock document model nests `accessLog` inside each document. Production requires a separate `drg_documentaccesslog` table.

Required changes:

- Remove nested access logs from the production document model.
- Create access log rows for upload, view, download, and acknowledge actions.
- Include actor user/email/name, action, source, document, program, and timestamp.
- Read audit rows by document/program for detail pages.
- Ensure audit rows are filtered by assigned-program access before display.

## 12. Add Error Handling for Dataverse Business Rules

The app should translate Dataverse and flow errors into user-facing messages that match the implemented business rules.

Handle at least:

- Duplicate program number.
- Duplicate deliverable type.
- Duplicate program access.
- External user not ready.
- Archived program upload blocked.
- PDF required.
- Reviewed document required.
- Rejection comments required.
- Signed approval PDF required.
- Reviewer access required.

The app should validate these conditions before submit where practical, but still handle Dataverse/flow failures as the source of truth.

## 13. Update Tests

Current tests mostly cover isolated helper behavior. Add focused tests for the production integration layer.

Recommended coverage:

- Dataverse choice/lookup mapping.
- Program visibility filtering by role and `drg_programaccess`.
- Upload validation blocks non-PDF files.
- Archived programs block upload actions.
- Reviewer approval validation requires comments for rejection.
- Reviewer approval validation requires signed PDF for approval.
- Document access log payload creation.
- Power Automate acknowledgment request payload.
- Mock connector fixtures remain available for local demo/testing but are not imported by production pages.

Use mocked fetch responses for Dataverse, SharePoint, and Power Automate clients.

## 14. Environment and Deployment Changes

Update configuration and deployment docs for:

- Dataverse environment URL.
- Dataverse app registration credentials.
- SharePoint site/library IDs.
- Power Automate instant flow URL or trigger configuration.
- Entra group IDs for admins, program owners, staff, and external reviewers.
- Graph permissions for guest invitation, if the app continues to own guest invites.
- App URL used in notifications and guest invitations.

Also confirm the Teams app manifest under `teams-app/` points to the deployed app URL and that authentication redirect URLs match the final tenant/app registration.

## Recommended Implementation Order

1. Add production model types and Dataverse choice mappers.
2. Add server-only Dataverse client and read services.
3. Replace mock reads in dashboard/programs/records/documents/calendar pages.
4. Update auth role mapping for all Entra groups and app roles.
5. Replace program access React state with Dataverse-backed server actions.
6. Add SharePoint upload/download services.
7. Rework submit flow to create SharePoint files and `drg_document` rows.
8. Add document access log writes for upload/view/download/acknowledge.
9. Add reviewer approval screens and server actions.
10. Add Power Automate instant-flow call for acknowledgment.
11. Add archived-program handling and active/archive filters.
12. Add production integration tests.
13. Update environment/deployment documentation.

## Definition of Done

The project code can be considered aligned with the implemented Dataverse/Power Automate setup when:

- No production route imports `MockProgramConnector`, `MockDeliverableConnector`, or `MockDocumentConnector`.
- User-visible data is read from Dataverse and scoped by real program access.
- File uploads store PDFs in SharePoint and metadata in `drg_document`.
- Downloads/views create `drg_documentaccesslog` rows.
- Submission, review, rejection, approval, acknowledgment, archive, revoke, and overdue states are driven by the Dataverse rows and flows.
- Admin, program owner, staff, and external reviewer experiences match their implemented security roles.
- Tests cover the API mappers, authorization rules, upload/review validations, and flow request payloads.
