# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DRG Real-Time Dashboard — a prototype dashboard/notification layer for Delaware Resource Group, a defense contractor. The client's broader vision (see REQUIREMENTS.md) is an Information Management System (IMS) for managing CDRL/SDRL contract deliverables, built on the Microsoft Power Platform. Our prototype demonstrates the cross-department visibility and Microsoft ecosystem integration piece.

Current phase: **prototype** — demonstrate the concept and integration direction ahead of the stakeholder meeting on 2026-02-18.

See MEMORY.md for persistent context, decisions, and domain vocabulary.
See REQUIREMENTS.md for the full client SDD breakdown.

## Session Behavior

At the start of every session, the last dev session entry from `docs/chat-history.md` is auto-injected into context via a `UserPromptSubmit` hook. Treat it as working memory — know the current state cold and be ready to continue without asking the user to re-explain anything. When the user says "let's get back to it" or similar, immediately orient around what was last worked on and what's next per the council findings in memory.

## Commands

- **Dev server:** `pnpm dev`
- **Build:** `pnpm build`
- **Lint:** `pnpm lint` (ESLint with Next.js core-web-vitals + TypeScript rules)
- **Run all tests (TS + Python + Java):** `pnpm test:all`
- **TypeScript tests only:** `pnpm test` (Vitest) or `vitest run` for a single run
- **Run a single TS test file:** `vitest run tests/typescript/teamsPayload.test.ts`
- **Python tests:** `(cd tests/python && python3 -c 'from test_teams_payload import test_notification_of_update; test_notification_of_update()')`
- **Java tests:** `cd tests/java && mvn test -q`

Package manager is **pnpm**.

## Architecture

- **Next.js App Router** — `src/app/` directory with `layout.tsx` root layout
- **UI library:** MUI (Material UI) with custom theme (`src/lib/theme.ts`)
- **Path alias:** `@/*` maps to `./src/*`
- **Source layout:**
  - `src/lib/models/` — shared types (UpdateEvent, source/department enums)
  - `src/lib/notifications/` — pure functions for building notification payloads (Teams)
  - `src/lib/connectors/` — adapter interfaces + implementations (mock and real) for data sources
  - `src/lib/theme.ts` — MUI theme configuration (navy primary, brand colors)
  - `src/components/` — reusable React components (AppHeader, StatsSummary, UpdateFeed, UpdateCard, FeedSkeleton)
- **Multi-language test suite** in `tests/`:
  - `tests/typescript/` — Vitest
  - `tests/python/` — unittest.mock (no pytest)
  - `tests/java/` — JUnit 5 + Mockito via Maven (`tests/java/pom.xml`), requires Java 17+

## Design Principles

- **Connector/adapter pattern:** all external integrations (Graph API, Power BI, Power Automate, Dataverse) live behind `UpdateConnector` interfaces so mocked data can be swapped for real APIs without rewriting core logic or UI.
- **Pure logic separation:** notification payload builders and event normalization are pure functions, independent of React or Next.js, for easy testing.
- **Mock-first development:** no tenant credentials assumed. All connectors have mock implementations that return realistic sample data.

## Integration Surface

Per the client SDD, the target Microsoft ecosystem is:

- **PowerApps** — their primary UI platform for the IMS; our web app complements this
- **Microsoft Dataverse** — primary structured data store for CDRL/SDRL records
- **SharePoint** — document storage, version control, metadata tagging
- **Power Automate** — workflow engine for approvals, notifications, task assignments
- **Azure AD (Entra ID)** — SSO with MFA, RBAC by job function
- **Microsoft Graph API** — our primary integration surface for reading from the above

## Open Questions (for 2026-02-18 meeting)

- How does our Next.js prototype relate to the PowerApps IMS described in the SDD? Companion app, replacement, or pivot?
- Do we get access to a test tenant / app registration?
- Which Dataverse entities and SharePoint libraries should we integrate with first?
- What is the expected update cadence (real-time vs periodic)?
- What roles/permissions do we need to model in RBAC?
