# Cleanup: Accessibility

Audit all components under `src/components/` and `src/app/` for accessibility issues and fix them directly.

## What to audit

1. **Interactive elements missing `aria-label`** — icon buttons, icon-only links, selects, and toggles that have no visible text label need `aria-label` describing their purpose.
2. **Tables missing accessible names** — `<Table>` / `<table>` elements need either a `<caption>` element or `aria-label` prop.
3. **Images and icons missing alt text** — `<img>` elements need `alt` attributes. Decorative images should use `alt=""`. MUI `<SvgIcon>` / icons used as meaningful content need `aria-label` or `titleAccess`.
4. **Form controls missing labels** — `<TextField>`, `<Select>`, `<Input>` components need associated labels (either via `label` prop, `aria-label`, or wrapping `<FormControl>` + `<InputLabel>`).
5. **Color-only information** — status indicators, badges, or highlights that convey meaning only through color. Add a text label, icon, or `aria-label` alternative.
6. **Keyboard navigation** — ensure custom interactive elements (not built-in MUI components) are focusable and operable via keyboard. Check for `tabIndex`, `onKeyDown` handlers where needed.
7. **Semantic HTML** — use appropriate elements (`<nav>`, `<main>`, `<section>`, `<header>`) instead of generic `<div>`/`<Box>` where they convey document structure.
8. **Heading hierarchy** — ensure headings follow a logical order (no skipping levels).

## How to fix

- Make changes directly — do not just report issues.
- Use MUI's built-in accessibility features where available (e.g., `inputProps={{ 'aria-label': ... }}`).
- Do not alter visual appearance unless necessary for accessibility compliance.
- Prefer non-intrusive fixes: adding `aria-*` attributes, `alt` text, `<caption>`, and semantic elements.

## Verification

After all changes, run:

```
pnpm build
pnpm lint
```

Both must pass cleanly. If either fails, fix the issue before finishing.
