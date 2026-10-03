# LOGOS — P0.4.2 Shell, Sidebar, and Layout Corrective Directive

## Objective

Make the global Shell the single owner of global chrome and make every page fit inside that layout without duplicated padding, incorrect height calculations, broken mobile navigation, or horizontal overflow.

## Current problems to eliminate

1. Shell adds page inset while pages add their own full page inset.
2. Vault and Chat request viewport heights that conflict with the Shell's top-bar offset.
3. Mobile navigation opens as a 64px icon-only drawer.
4. Desktop/mobile thresholds are inconsistent (`md` behavior vs 768px resize cleanup).
5. Collapsed navigation items do not provide enough accessible labeling.
6. Full-width workspace pages are being treated like ordinary padded content pages.

## Canonical layout ownership

`apps/web/app/layout.tsx` owns:

```text
ThemeRegistry
Shell
```

No page may render another Shell.

`apps/web/app/components/Shell.tsx` owns:

```text
global navigation
fixed top bar
global page offset
```

Ordinary pages should not independently recreate the global page inset unless explicitly using a documented full-bleed workspace mode.

## Canonical dimensions

```text
collapsed rail = 64px
expanded rail = 248px
top bar = 56px
content max width = 1120px
page padding desktop = 32px
page padding mobile = 16px
```

These values should come from the central token file, not duplicated literals.

## Required Shell behavior

### Desktop

Collapsed:

```text
rail = 64px
labels hidden
icon controls remain accessible
```

Expanded:

```text
rail = 248px
labels visible
collapse control visible
```

### Mobile

The navigation must become a proper temporary drawer/sheet.

Required:

```text
drawer width = a readable mobile width
labels visible
navigation icons + labels
close behavior works
Escape closes when supported
no horizontal page overflow
```

Do not reuse the 64px desktop collapsed rail as the mobile drawer width.

## Breakpoint rule

Use one canonical responsive breakpoint system.

Do not mix:

```text
MUI breakpoint threshold
window.innerWidth threshold
```

when they express the same concept.

Any manual resize listener should use the same breakpoint constant or be removed when MUI state is sufficient.

## Active navigation

The active route must be visibly distinguishable through:

```text
selected background/token
text/icon treatment
```

Do not use color alone.

Icon-only controls require:

```text
aria-label
```

and preferably a Tooltip for desktop collapsed mode.

## Workspace mode

Create a clear distinction between:

```text
ordinary page
full-height workspace
```

Vault and Chat are workspace surfaces.

The usable workspace height must be based on:

```text
viewport height - 56px top bar
```

not an old 64px assumption and not an additional `100vh` inside an already offset Shell.

Recommended contract:

```text
workspace height = calc(100dvh - 56px)
```

where framework/browser compatibility permits it, with a safe fallback as needed.

## Remove double padding

For pages such as:

```text
Home
Work
People
Memory
Settings
System
```

ensure only one layer owns the 32px desktop / 16px mobile page inset.

For Vault and Chat, use full-bleed workspace geometry where required.

## Targeted layout tests

```text
UI_SIZE | SHELL | 320x568 | PASS|FAIL
UI_SIZE | SHELL | 390x844 | PASS|FAIL
UI_SIZE | SHELL | 768x1024 | PASS|FAIL
UI_SIZE | SHELL | 1024x768 | PASS|FAIL
UI_SIZE | SHELL | 1440x900 | PASS|FAIL
UI_SIZE | SHELL | 1920x1080 | PASS|FAIL
```

For each, record:

```text
rail width
mobile drawer width
content start position
content max width
horizontal overflow
vertical overflow
focus visibility
active route
```

## Expected visual geometry

At 1440px:

```text
content remains readable and bounded
no second 32px inset accidentally shrinks the design below the documented 1120px content area
```

At 390px:

```text
no permanent 200px/248px rail
no three-pane Vault layout
no horizontal scrollbar
```

## Required report

```text
STATUS:
SHELL_LAYOUT:
SIDEBAR_MOBILE:
SIDEBAR_DESKTOP:
BREAKPOINTS:
WORKSPACE_HEIGHT:
DUPLICATE_PADDING_REMOVED:
OVERFLOW_CHECKS:
ACCESSIBILITY_CHECKS:
VIEWPORT_RESULTS:
FILES_CHANGED:
REGRESSION_TESTS:
```
