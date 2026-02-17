# Cleanup: Hygiene

Scan all files under `src/` for mechanical code hygiene issues and fix them directly.

## What to scan for

1. **Unused imports** — imported symbols not referenced anywhere in the file. Remove them.
2. **Barrel imports** — imports from `@mui/material` or `@mui/icons-material` (barrel re-exports). Replace with deep imports (e.g., `@mui/material/Box`, `@mui/icons-material/Notifications`).
3. **`as` type casts** — replace with proper type narrowing, generics, `satisfies`, or type guards. Only keep `as const` (that's fine).
4. **Explicit `any` types** — replace with proper types. Check function parameters, return types, and variable declarations.
5. **Unused exports** — symbols exported from a file but not imported anywhere in `src/`. Remove the `export` keyword (or the entire declaration if it's also unused locally).
6. **Unused local variables or parameters** — variables declared but never read. Remove or prefix with `_` if required by an interface.
7. **Unreachable code** — code after early returns, always-false conditions, etc. Remove it.

## How to fix

- Make changes directly — do not just report issues.
- Preserve existing functionality; these are mechanical cleanups only.
- If unsure whether a symbol is used, search the full `src/` tree before removing it.

## Verification

After all changes, run:

```
pnpm build
pnpm lint
```

Both must pass cleanly. If either fails, fix the issue before finishing.
