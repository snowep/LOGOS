# LOGOS — UI Corrective Directive for P0.4.1

## Product rule

The interface must describe the system that actually exists today.

P0.4.1 is still primarily a vault synchronization phase.

Do not fabricate projects, memory, metrics, integrations, statuses, or future capabilities.

---

## 1. Shell

File:

```text
apps/web/app/components/Shell.tsx
```

Rules:

- root `app/layout.tsx` owns the only Shell,
- pages render content only,
- desktop rail = 64 px collapsed / 248 px expanded,
- top bar = 56 px,
- content max width = 1120 px,
- one semantic main region,
- theme toggle must call `useThemeMode()`.

Remove the extra Shell wrapper from `apps/web/app/vault/page.tsx`.

---

## 2. Vault

File:

```text
apps/web/app/vault/page.tsx
```

Keep:

```text
left 200 px
middle 320 px
right remaining
```

The page should show:

- real Markdown files,
- real document metadata,
- real content preview,
- real sync connection state.

The page must not claim these are operational when they are not:

```text
Edit
Rename
Move
Archive
Show related
Find conflicts
```

Remove them or render disabled/unavailable states.

Do not use `prompt()` or `confirm()` as unfinished product interactions.

Use centralized theme tokens. Do not hardcode the old indigo/gray UI system.

---

## 3. Vault preview

Real content must be fetched from:

```text
/api/documents/{id}
```

Markdown should be sanitized before `dangerouslySetInnerHTML`.

Do not expose full machine paths unless explicitly requested.

---

## 4. Memory

File:

```text
apps/web/app/memory/page.tsx
```

When the API fails:

```text
Error loading memories
Retry
```

Do not insert seed/demo records.

Until real memory query contracts are complete, an honest empty state is preferable to fabricated populated data.

---

## 5. System

File:

```text
apps/web/app/system/page.tsx
```

Rebuild with MUI only.

Use:

```text
Container / Box / Stack / Grid / Paper / Typography / Alert / List / Table / Chip
```

or other official MUI components as appropriate.

No raw page-level `div`, `section`, `h1`, `h2`, `pre` styling system.

All semantic colors come from the theme.

The System page should accurately distinguish:

```text
JavaScript fallback retrieval
```

from:

```text
sqlite-vec active
```

---

## 6. Settings

File:

```text
apps/web/app/settings/page.tsx
```

Do not present:

```text
checked={true}
onChange={() => {}}
```

as a real setting.

Use one of:

```text
real backed setting
```

or:

```text
disabled + unavailable note
```

Remove machine-specific paths.

Appearance controls must use the shared ThemeRegistry.

---

## 7. Theme

Files:

```text
apps/web/src/theme/tokens.ts
apps/web/src/theme/theme.ts
apps/web/src/theme/ThemeRegistry.tsx
```

Required behavior:

```text
no stored preference -> dark
stored preference -> use it
```

Do not silently select light mode from OS preference before the user explicitly changes the product setting.

Remove unused purple/indigo secondary branding.

Keep the temporary warm accent only until the final LOGOS brand palette is defined.

---

## 8. Contract alignment

The browser and backend must share the same event vocabulary:

```text
created
modified
deleted
renamed
moved
reconcile-complete
```

Do not maintain a parallel stale contract such as:

```text
add
change
unlink
unlinkDir
```

---

## 9. Truthfulness scan

Before completion search for:

```text
mock
fake
demo
placeholder
hardcoded
localhost
D:\\
ORION
JARVIS
99.9%
1.2k req/s
System Operational
Continue editing
```

Every remaining occurrence must be removed or explicitly documented as development-only.

---

## 10. Accessibility

Verify:

- keyboard navigation,
- visible focus,
- icon-only controls have `aria-label`,
- correct heading hierarchy,
- form labels,
- no information conveyed only by color,
- sufficient contrast,
- no horizontal scrolling at required viewport sizes.

Required sizes:

```text
1440 x 900
1280 x 800
1024 x 768
768 x 1024
390 x 844
```
