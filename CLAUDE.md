# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DRG Real-Time Dashboard — an internal dashboard hub for Delaware Resource Group that reduces siloed communication by surfacing cross-department updates from their Microsoft ecosystem in one place, without forcing users to abandon existing workflows.

The system must work within a Microsoft-heavy environment: Teams, Power BI, Power Automate, Dynamics 365/Dataverse, and common document formats (Excel, Word, PowerPoint, Access, PDFs via Nitro).

Current phase: **prototype** — demonstrate the concept and integration direction, not a full enterprise implementation.

## Commands

- **Dev server:** `pnpm dev`
- **Build:** `pnpm build`
- **Lint:** `pnpm lint` (ESLint with Next.js core-web-vitals + TypeScript rules)
- **Run all tests (TS + Python + Java):** `pnpm test:all`
- **TypeScript tests only:** `pnpm test` (Vitest) or `vitest run` for a single run
- **Run a single TS test file:** `vitest run tests/typescript/teamsPayload.test.ts`
- **Python tests:** `python -c 'from tests.python.test_teams_payload import test_notification_of_update; test_notification_of_update()'`
- **Java tests:** `cd tests/java && mvn test -q`

Package manager is **pnpm**.

## Architecture

- **Next.js App Router** — `src/app/` directory with `layout.tsx` root layout
- **Path alias:** `@/*` maps to `./src/*`
- **Source layout:**
  - `src/lib/models/` — shared types (UpdateEvent, source/department enums)
  - `src/lib/notifications/` — pure functions for building notification payloads (Teams)
  - `src/lib/connectors/` — adapter interfaces + implementations (mock and real) for data sources
  - `src/components/` — reusable React components (UpdateFeed, UpdateCard, etc.)
- **Multi-language test suite** in `tests/`:
  - `tests/typescript/` — Vitest
  - `tests/python/` — unittest.mock (no pytest)
  - `tests/java/` — JUnit 5 + Mockito via Maven (`tests/java/pom.xml`), requires Java 17+

## Design Principles

- **Connector/adapter pattern:** all external integrations (Graph API, Power BI, Power Automate, Dynamics) live behind `UpdateConnector` interfaces so mocked data can be swapped for real APIs without rewriting core logic or UI.
- **Pure logic separation:** notification payload builders and event normalization are pure functions, independent of React or Next.js, for easy testing.
- **Mock-first development:** no tenant credentials assumed. All connectors have mock implementations that return realistic sample data.

## Integration Surface

- **Microsoft Graph API** — primary surface for Teams messages, SharePoint/OneDrive files, user info
- **Power BI** — embedding dashboards + refresh status metadata
- **Power Automate** — event engine pushing updates via webhooks/flows
- **Dynamics 365** — keep connector interface ready but don't over-invest until entity scope and access are confirmed
- **Auth:** Microsoft Entra ID (OAuth/OIDC)
- "Compatibility" with Office/Nitro means SSO + links/metadata + embedding, not document ingestion/parsing (unless clarified later)

## Open Stakeholder Questions (do not block on these)

- Update cadence expectations (seconds / minutes / hourly / daily)
- Whether Teams is primary home (tab + notifications) vs standalone web app
- App registration / permission approval path in the tenant
- Which systems to integrate first and whether we get a test tenant
- "Compatible with Office/Nitro/Access" — links/metadata vs ingestion/export
