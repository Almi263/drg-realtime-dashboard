# Claude Code Chat History
This file is a running log of development sessions. Each entry summarizes what was discussed, decided, and built. Maintained by Claude Code — update at the start/end of every session.

---

## Session 1 — 2026-03-11

**Goal:** Transcribe the Feb 18 stakeholder meeting and preserve it as context for future prototype work.

**What happened:**
- Attempted local WhisperX transcription (large-v2 model, CPU). Failed twice: first on SSL cert error downloading alignment model, then on `DiarizationPipeline` API mismatch. Each run ~30 min → bad iteration loop.
- Switched to AssemblyAI cloud API (raw `requests`, not SDK — SDK enum values don't match the live API). Succeeded in ~2 min.
- Full 50-min meeting transcribed with speaker diarization: 235 utterances, 5 speakers identified.
- Speaker map confirmed: A=Scott (DRG), B=Joshua (student), C=Allison (student), D=Jason (DRG), E=Franco (student/user).
- Transcript saved to `docs/meeting-transcript-2026-02-18.md`.

**Decisions made:**
- AssemblyAI REST API is the right tool for any future transcription (not the Python SDK, not local Whisper).
- `transcribe.py` and `meeting_transcript_raw.json` left in project root as artifacts (not part of the app).

**Key client insights (surface-level, from first transcript skim):**
- Core pain: 26 sites submit monthly CDRL deliverables via email → disputes, missed submissions, gov grading penalties
- Want a single centralized hub living inside the Microsoft Teams/SharePoint ecosystem
- RBAC critical: gov reviewers (read), internal staff (submit/edit), admins (full)
- Security clearances → no phone apps, must be cloud-based
- Not IT people; need it user-friendly
- External users on different tenants are a real scenario

**Next up:** Deep-read the full transcript, extract all client requirements/feedback on the current prototype, and plan the next 1-2 prototype iterations (Ticket CS4273_S1_Ticket 8).

---

## Session 2 — 2026-03-11 (continued — final sweep)

**Goal:** Deep-read the full meeting transcript, update memory, and plan Ticket CS4273_S1_Ticket 8 prototype refinements.

**Transcript deep-dive — key learnings:**
- The core product is a **document submission repository**, not an activity feed. Scott and Jason want immutable storage with audit trails (evidence-based, for dispute resolution with government).
- Email workflow pain: site → CORE → NOC, each step re-emails the same doc to 40+ people. System eliminates this by making documents centrally accessible.
- Scott reacted positively to the **Documents page** in Franco's demo — liked filename, uploader, status chips. Immediately asked for an access audit log per document.
- Jason asked for a **Program/contract column** in tables and **search/query** capability (filter by program, submitter, date range).
- Platform direction settled as: **standalone web app** (the "IMS") with a Teams shortcut/icon pointing to it. Scott: "a standalone website that we give access to... that we offer as an IMS." Franco's hybrid proposal ("Teams icon → standalone site") got explicit approval.
- Three-tier RBAC confirmed: gov/external (view+download only), DRG internal (submit), DRG admin (full + delete).
- UX emphasis: must be trainable for non-technical "seasoned employees."

**Decisions for Ticket 8 direction:**
- Primary direction: rework prototype around **program-centric repository** framing
  - Program as top-level concept (every deliverable/document belongs to a program)
  - Dashboard: program status overview (which programs have pending/late deliverables)
  - Documents page: repository feel, add who-accessed log, program filter, search/query
  - Records page: add Program column, search/query by program + submitter + date range
- Secondary (framing): position the app as a standalone IMS site (not just a dashboard widget)

**Azure / real-backend discussion:**
- Student Azure account is the right call for prototype phase. All Azure resource references will be env vars — swap 4 vars at handoff to DRG's tenant, code doesn't change.
- Prioritized order: (1) real document upload to Blob Storage (highest demo value, no DRG dependencies), (2) real DB replacing mock connectors, (3) MSAL auth.
- Questions to ask Christian/Jimmy when the time comes: tenant domain, App Registration consent, B2B vs federated auth for gov users, Dataverse vs Azure SQL preference, SharePoint vs Blob Storage for documents, CMMC level, Azure region restrictions.
- Architecture is already prepared for this transition — connector pattern means pages/components don't change, just the connector implementations.

**What we built (Ticket 8):**
- New models: `Program` (`src/lib/models/program.ts`), `AccessEvent` + `accessLog` on `DeliverableDocument`, `programId` on `Deliverable`
- New mock data: `mock-programs.ts` — 3 programs (Surface Comms FA8532, RATS EDMS FA8540, Cyber Security Training FA7014). Deliverables spread across all 3 programs (13 total). Documents have realistic access logs (who viewed/downloaded + timestamps).
- Role context: `src/lib/context/role-context.tsx` — `drg-admin` / `drg-staff` / `gov-reviewer` with `useRole()` hook. Provided at layout level.
- AppHeader: role switcher dropdown ("Viewing as: DRG Admin / DRG Staff / Gov Reviewer") — demo-able RBAC
- SidebarNav: added Programs link with `BusinessCenterIcon`, added divider between primary and secondary nav
- Dashboard (`/`): replaced activity feed with program status cards grid + deliverable-based StatsSummary (overdue highlighted in red)
- `ProgramStatusCard`: clickable card per program showing status breakdown chips, overdue badge, deliverable count, site count, last activity date. Links to `/programs/[id]`.
- `/programs` page: grid of all program cards
- `/programs/[id]` page: program detail — header with contract info, sites, dates + filtered RecordsTable + filtered DocumentsTable
- RecordsTable: added Program column (hidden when only one program in context), Program filter dropdown alongside Status and Type filters
- DocumentsTable: access log expand/collapse per row (eye icon + count chip), role-based visibility (access log hidden from gov-reviewer, delete button only for drg-admin, upload button only for staff/admin), program filter, "Read-only access" notice for gov role
- All pages updated to pass programs array down to tables
- Build: clean. All 7 TS tests pass.

**Final sweep (same session):**
- Dead code deleted: UpdateFeed.tsx, UpdateCard.tsx, FeedSkeleton.tsx, mock-connector.ts, connectors/types.ts (UpdateConnector interface)
- SidebarNav: "Submit Report" button pinned to bottom of sidebar, role-gated (hidden for gov-reviewer). This is the permanent CTA entry point visible on every page.
- New: `src/app/submit/page.tsx` + `src/components/SubmitReportWizard.tsx` — 4-step wizard (Program → Deliverable → Upload → Confirmation). Drag-and-drop file picker. Confirmation screen shows submission ref, timestamp, "permanent record" messaging. This directly addresses Scott's evidence-based requirement.
- New: `src/app/documents/[id]/page.tsx` + `src/components/DocumentDetail.tsx` — document detail page with access log as a visual timeline (upload event + all views/downloads in chronological order with color-coded dots). Immutability notice. Role-gated: gov-reviewer sees alert that their access was recorded but no timeline.
- DocumentsTable: filenames are now links to `/documents/[id]`.
- `.env.example` added — documents all Azure vars needed for real deployment (AD tenant/client, DB URL, Blob Storage, Graph API).
- Build: 9 routes clean. All 7 tests pass.
- `"use client"` discussion: confirmed correct — belongs on interactive leaf components, not pages/layouts. Current usage is correct.
- Naming conventions: consistent (PascalCase components, kebab-case lib). Dead code was the real issue, now cleaned.

**Next session priorities:**
- Real document upload (Blob Storage) — highest demo value, no DRG dependencies needed
- Role switcher demo walkthrough refinement (gov-reviewer experience)
- Consider `/submit` redirect/guard based on role (gov-reviewer shouldn't reach it)
- Meeting with Christian/Jimmy when ready for real Azure tenant

---

## Session 3 — 2026-03-11 (continued — finishing the ambitious pass)

**Goal:** Complete the items deferred from the previous pass: deliverable detail page, clickable records table rows, `/product-council` slash command, `RoleGuard`, and URL-based submit wizard pre-fill.

**What we built:**

- `.claude/commands/product-council.md` — custom slash command (`/product-council`) that spawns 3 parallel general-purpose subagents with distinct reviewer personas (The Operator/Scott, The UX Critic, The Pragmatic PM), each reading codebase + chat history, then synthesizes a Council Report (Consensus / Productive Tensions / What to Build Next / One Thing to Cut). Confirmed working — appeared in available skills list immediately.
- `src/components/RoleGuard.tsx` — `"use client"` guard component; renders `AccessDenied` (LockIcon + role name + hint to switch in header) if `useRole()` doesn't match `allowedRoles`. Used on submit page.
- `src/app/submit/page.tsx` (updated) — wrapped in `<RoleGuard allowedRoles={["drg-admin", "drg-staff"]}>`. Async `searchParams: Promise<{ programId?, deliverableId? }>` → passed as `initialProgramId`/`initialDeliverableId` props to wizard.
- `src/components/SubmitReportWizard.tsx` (updated) — if both `initialProgramId` and `initialDeliverableId` provided, auto-advance to step 2 (upload). Enables `/submit?programId=X&deliverableId=Y` deep-link from deliverable detail.
- `src/components/DeliverableDetail.tsx` — `"use client"` component: header card (ID, type chip, status chip, description, due date, assigned to, program link), Submit Document button (role-gated, links to `/submit?programId=X&deliverableId=Y`), linked documents list with filename links to `/documents/[id]`, access count chips. Empty state when no documents yet.
- `src/app/records/[id]/page.tsx` — server component. `await params`. Fetches deliverable, linked docs, and program. Renders `BackButton` + `DeliverableDetail`. Returns `notFound()` for unknown IDs.
- `RecordsTable.tsx` (updated) — deliverable ID cells are now clickable `MuiLink component={NextLink}` links to `/records/[id]`. Added `MuiLink` and `NextLink` imports.

**Build:** 9 routes clean (`ƒ /records/[id]` now present). All 7 TypeScript tests pass.

**Next session priorities:**
- Real document upload to Azure Blob Storage (highest demo value, no DRG dependencies)
- Gov-reviewer role walkthrough: verify RoleGuard + access log suppression end-to-end
- `/product-council` invocation before next implementation sprint (habit to establish)
- Meeting with Christian/Jimmy when ready for real Azure tenant

---
