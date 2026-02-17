# Cleanup: Consistency

Verify that all code under `src/` follows the established project patterns documented in CLAUDE.md. Fix any deviations directly.

## Patterns to check

1. **`"use client"` components** — must use MUI deep imports (`@mui/material/Box`), never barrel imports (`@mui/material`).
2. **Page components** (`src/app/**/page.tsx`) — should be server components (no `"use client"`). If they need client interactivity, wrap client parts in a separate component and use `<Suspense>` boundaries.
3. **Model files** (`src/lib/models/`) — should use the `as const` tuple + derived union type pattern (e.g., `const SOURCES = ["Graph", "Dataverse", ...] as const; type Source = (typeof SOURCES)[number];`).
4. **Connector classes** (`src/lib/connectors/`) — should follow the `readonly name: string` property + async method pattern matching the `UpdateConnector` interface.
5. **Component naming** — the default export name must match the file name (e.g., `UpdateCard.tsx` exports `UpdateCard`).
6. **Styling approach** — use MUI `sx` prop for styling, not inline `style` attributes. Convert any `style={}` to `sx={}`.
7. **Import ordering** — React/Next.js imports first, then external libraries, then internal `@/` imports.

## How to fix

- Make changes directly — do not just report issues.
- When converting patterns, preserve all existing functionality.
- If a file requires significant restructuring, note what you changed.

## Verification

After all changes, run:

```
pnpm build
pnpm lint
```

Both must pass cleanly. If either fails, fix the issue before finishing.
