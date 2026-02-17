# Cleanup: Theme

Find hardcoded colors and duplicated style objects across `src/` components and centralize them in the theme system. Fix directly.

## What to scan for

1. **Hardcoded hex colors** — find `#xxx` or `#xxxxxx` values in component files (anything outside `src/lib/theme.ts`). Replace with theme references using `theme.palette.*` via the `sx` prop or `useTheme()`.
2. **Hardcoded `rgb()`/`rgba()` colors** — same treatment as hex colors.
3. **Duplicated style objects** — identical or near-identical style definitions across multiple components (e.g., status chip color maps, card styles, table header styles). Extract to a shared location.
4. **Duplicated color maps** — objects mapping status/category values to colors that appear in more than one file. Consolidate into a single shared constant.
5. **Magic spacing values** — repeated numeric spacing values that could use MUI's spacing system (`theme.spacing()`).

## How to fix

- For colors that correspond to existing theme palette values, use `theme.palette.*` references.
- For colors that don't exist in the theme yet, add them to `src/lib/theme.ts` under the appropriate palette key or as custom theme properties, then reference them.
- For duplicated style objects, create a shared file (e.g., `src/lib/shared-styles.ts`) or add to theme, then import from both locations.
- For duplicated color maps (like status-to-color mappings), create a single source of truth and import it everywhere it's used.
- Preserve all visual appearance — the UI should look identical after changes.

## Verification

After all changes, run:

```
pnpm build
pnpm lint
```

Both must pass cleanly. If either fails, fix the issue before finishing.
