# LOGOS — UI Corrective Directive for P0.4.1

## Rule

The UI must show what actually exists today, not what the roadmap intends to exist later.

P0.4 is a vault synchronization phase. It is not yet the project/agent/council phase.

---

## 1. Shell

File:

```text
apps/web/app/components/Shell.tsx
```

Correct:

- one Shell from `app/layout.tsx`,
- no page-specific Shell wrappers,
- collapsed width 64 px,
- expanded width 248 px,
- top bar 56 px,
- correct content positioning when drawer expands,
- one semantic `<main>` element,
- functional theme toggle using `useThemeMode()`,
- icon-only controls have `aria-label`.

Do not render a meaningless chevron as the theme button.

---

## 2. Home

Files:

```text
apps/web/app/page.tsx
apps/web/app/components/HomeClient.tsx
```

Do not map every document to a fake Project entity.

Until P1.0 real project entities exist, use:

```text
Greeting
Command input
Recent document activity
Needs Attention only when real conflicts exist
```

The command box remains:

```text
max width 760 px
min height 104 px
```

No voice control.

No fake progress.

No fake project status.

No hardcoded "Continue editing" as a false next action.

Do not navigate to `/work/{id}` until `/work/[id]` actually exists.

---

## 3. Vault

File:

```text
apps/web/app/vault/page.tsx
```

Use the three-pane pattern:

```text
left    200 px
middle  320 px
right   remaining
```

The right preview must fetch the actual document.

Do not show placeholder content such as:

```text
This is a preview of the document content...
```

Do not ship handlers that only call `console.log()` while presenting them as usable actions.

Use MUI only for visible UI.

Render Markdown through a controlled/sanitized path before using `dangerouslySetInnerHTML`.

Hide raw machine paths by default.

---

## 4. Memory

File:

```text
apps/web/app/memory/page.tsx
```

Do not fall back to fabricated memory records when API access fails.

Show a real empty/error state instead.

Do not show user-specific memory as seed/demo data in production UI.

Search and provenance remain real.

---

## 5. System

File:

```text
apps/web/app/system/page.tsx
```

Replace every raw HTML container with MUI components.

Keep the System page technical, but truthful.

The retrieval section must distinguish:

```text
sqlite-vec available
```

from:

```text
JavaScript fallback active
```

The current implementation uses JavaScript similarity scanning, so do not imply sqlite-vec is active unless it actually is.

---

## 6. Settings

File:

```text
apps/web/app/settings/page.tsx
```

No no-op switches that appear to change system state.

No machine-specific vault path.

Appearance must connect to the shared ThemeRegistry.

Future settings may be shown as unavailable, but must not pretend to be operational.

---

## 7. Theme

Files:

```text
apps/web/src/theme/tokens.ts
apps/web/src/theme/theme.ts
apps/web/src/theme/ThemeRegistry.tsx
```

Dark mode is the default.

Light mode is fully styled.

Use the temporary warm accent only.

Remove unused purple/indigo secondary identity.

Centralize semantic colors in theme tokens.

Do not use hardcoded product colors in page components.

---

## 8. Typography and spacing

Keep:

```text
Home title: 32 px
inner page title: <=28 px
section heading: 18 px
card title: 16 px
body: 14–16 px
metadata: 12–13 px
```

Use:

```text
content max width: 1120 px
page padding: 32 px desktop / 16 px mobile
section gap: 32 px
card gap: 16 px
```

---

## 9. Truthfulness scan

Before completion search source for:

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

Every occurrence must be removed or explicitly documented as development-only.
