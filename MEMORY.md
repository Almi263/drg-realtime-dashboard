# MEMORY.md

Persistent context and decisions for Claude Code sessions on this project.

---

## Key Realization: SDD vs Our Prototype

The client's SDD (received 2026-02-17) describes a **document lifecycle / contract data management system** built on the Power Platform (PowerApps + Dataverse + SharePoint). Our prototype is a **cross-department update feed** built on Next.js.

These are not the same thing, and that's OK for now. Our Next.js prototype demonstrates:
- Microsoft ecosystem integration patterns (connector/adapter model)
- A notification/activity layer that could complement the PowerApps-centric IMS
- Front-end engineering capabilities the team can deliver

The **meeting on 2026-02-18 at 3pm** should clarify how our work fits with their Power Platform vision. Possible directions:
1. Our dashboard becomes a **companion web app** alongside the PowerApps IMS (real-time visibility layer)
2. We pivot to building directly on the Power Platform as the SDD envisions
3. Hybrid — we build the notification/dashboard piece as a web app that reads from Dataverse/SharePoint via Graph API and custom connectors

Do not assume direction until after the meeting.

## Branding

- The client is **"Delaware Resource Group"** — not "DRG" in user-facing copy
- "DRG" is acceptable as a compact badge/logo mark, but headers and titles should use the full name
- Primary brand color: **navy #002050**
- Logo: orange/gold swoosh + navy "DRG" text + "DELAWARE RESOURCE GROUP" subtitle
- The SDD uses this logo prominently on page 1

## Domain Vocabulary

- **CDRL**: Contract Data Requirements List — deliverables required by a government contract
- **SDRL**: Subcontract Data Requirements List — deliverables required from subcontractors
- **SOA LMR**: Statement of Work / Labor Mix Report
- **IMS**: Information Management System (the project the SDD describes)
- **PMO**: Program Management Office (the authoring team)
- DRG operates in **defense/government contracting** — compliance, auditing, and data governance are first-class concerns, not afterthoughts

## Tech Decisions Made

- **UI library**: MUI (Material UI) — chosen for team-friendliness (simple imports, large ecosystem, every React dev knows it). Shadcn was ruled out because it's copy-paste rather than importable.
- **Package manager**: pnpm
- **Theme**: MUI theme with navy primary (#002050), secondary blue (#0078d4), light gray background (#f0f2f5)
- **Component pattern**: MUI `sx` prop for styling, no CSS modules for MUI components

## Things To Remember

- Franco is the developer driving this. He has a team that will work on this too.
- The stakeholder meeting was originally scheduled for the morning of 2026-02-17 but got moved to **2026-02-18 at 3pm**.
- The `page.module.css` file has been removed — page layout is now fully MUI.
- The old `UpdateCard.module.css` and `UpdateFeed.module.css` files have been removed.
- There's a deprecation warning on `TabIndicatorProps` in AppHeader.tsx — should be migrated to the `slotProps` API when we next touch that file.
