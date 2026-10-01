# LOGOS — Responsive Size and Viewport Audit

## Purpose

This document defines the viewport matrix Hermes must use to audit LOGOS UI behavior across screen sizes.

“Responsive” does not mean “works on desktop and mobile.” Every mandatory viewport below must be tested for:

```text
layout
overflow
navigation
typography
spacing
interactive targets
composer behavior
drawer/pane behavior
loading/empty/error states
long content
orientation
```

A UI that passes at 1440px but overflows at 390px is a failed responsive implementation.

---

# 1. Mandatory viewport matrix

Hermes must run the UI suite at these exact CSS viewport sizes unless the test environment cannot create one of them. Any unavailable size must be marked `BLOCKED`, not silently skipped.

| ID | Viewport | Category | Primary purpose |
|---|---:|---|---|
| V01 | 320x568 | small mobile | minimum practical phone width |
| V02 | 360x800 | mobile | narrow modern phone |
| V03 | 390x844 | mobile | common iPhone-class width |
| V04 | 412x915 | large mobile | wide phone |
| V05 | 480x960 | mobile landscape-style width | breakpoint transition check |
| V06 | 600x960 | small tablet | tablet threshold |
| V07 | 768x1024 | tablet portrait | canonical tablet |
| V08 | 820x1180 | large tablet portrait | iPad-class width |
| V09 | 1024x768 | tablet landscape / small desktop | pane compression |
| V10 | 1280x800 | desktop | baseline desktop |
| V11 | 1440x900 | desktop | primary design audit |
| V12 | 1536x864 | desktop-wide | common laptop/desktop |
| V13 | 1920x1080 | wide desktop | max-width and whitespace |
| V14 | 2560x1440 | very wide desktop | ultra-wide behavior / content containment |

Also run orientation checks at minimum:

```text
V03 portrait  = 390x844
V03 landscape = 844x390
V07 portrait  = 768x1024
V07 landscape = 1024x768
```

---

# 2. Global responsive invariants

At every viewport:

```text
horizontal scrollbar = absent
vertical overflow = intentional only
content is readable without browser zoom tricks
primary navigation is reachable
primary action is reachable
focus is visible
text does not clip unexpectedly
cards do not overlap
dialogs fit the viewport or scroll internally
long filenames do not break the layout
long messages wrap safely
```

At mobile widths:

```text
no fixed desktop rail remains permanently visible
no three-pane Vault layout is forced side-by-side
no fixed-width card grid causes overflow
composer controls remain reachable
icon-only controls remain accessible
```

At wide desktop widths:

```text
content remains contained around the documented max-width
UI does not stretch into an unreadable full-screen slab
navigation does not drift
cards maintain coherent density
```

---

# 3. Shell size audit

Required target dimensions from the UI brief:

```text
collapsed rail = 64px
expanded rail = 248px
top bar = 56px
content max width = 1120px
page horizontal padding = 32px desktop / 16px mobile
```

Audit each viewport:

| Viewport | Nav state | Expected |
|---|---|---|
| 320–412 wide | compact/mobile | drawer or compact navigation; no fixed 248px obstruction |
| 480–767 wide | compact/mobile | no horizontal scroll; primary routes reachable |
| 768–1023 wide | tablet | compact nav or product-defined expanded mode without overlap |
| 1024–1279 wide | small desktop | 64/248px behavior deliberate and stable |
| 1280–1920 wide | desktop | 64px collapsed / 248px expanded supported |
| 2560 wide | wide desktop | content remains max-width constrained |

Required output:

```text
UI_SIZE | SHELL | <viewport> | PASS|FAIL | <summary>
```

---

# 4. Home audit

Target constraints:

```text
command box max width = 760px
command box minimum height = 104px
project card width = 352–360px desktop
project card min height = 156px
project card padding = 20px
card gap = 16px
3 desktop cards fit within 1120px content width
```

Expected behavior:

### 320–412px

```text
single-column cards
command box spans available content width with mobile padding
no clipped text
```

### 600–1024px

```text
one or two columns depending on exact available width
no card narrower than its readable minimum
```

### 1280–1920px

```text
three-card desktop composition may be used
content remains inside 1120px max
```

### 2560px

```text
content does not scale to the full 2560px width
```

---

# 5. Chat size audit

Desktop target:

```text
conversation rail ~= 280–320px
main conversation remains dominant
composer fixed/sticky only when behavior is accessible and does not cover content
```

Tablet:

```text
rail may narrow or become a drawer
main conversation remains usable
```

Mobile:

```text
recent conversation rail -> drawer/sheet
message width uses available content width
composer does not overflow
send action remains visible
long messages wrap
context cards stack vertically
```

Mandatory viewport tests:

```text
320x568
360x800
390x844
412x915
768x1024
1024x768
1280x800
1440x900
1920x1080
```

---

# 6. Vault size audit

The desktop reference is:

```text
knowledge pane = 200px
document list = 320px
preview = remaining width
```

This must not be treated as a fixed layout at every viewport.

Expected responsive behavior:

### 320–599px

```text
one pane at a time
knowledge tree -> drawer
list -> primary panel
preview -> dedicated panel/sheet
```

### 600–767px

```text
one primary pane plus optional drawer
no 200px + 320px + preview three-column squeeze
```

### 768–1023px

```text
two-pane or drawer-assisted layout
preview remains readable
```

### 1024–1279px

```text
three-pane may be used only when minimum readable widths are preserved
```

### 1280px+

```text
200px + 320px + responsive preview is acceptable
```

Every size must verify:

```text
long filename
long markdown heading
long code block
empty folder
empty document list
API error
sync event
```

---

# 7. Memory, People, Work, Automations audit

At every viewport:

```text
mobile = one-column primary flow
small tablet = one/two columns as data allows
desktop = documented multi-column layout
wide desktop = content stays bounded
```

Cards must wrap instead of overflow.

Tables must become:

```text
scroll container
or
stacked card/list representation
```

Do not allow the entire page to acquire horizontal scrolling merely because one data table is wide.

---

# 8. System and Developer audit

Technical screens may contain denser information, but still must obey:

```text
no horizontal page overflow
code/log areas scroll internally
metadata wraps
cards stack on mobile
```

No fixed pixel widths may force content beyond the viewport.

---

# 9. Settings audit

Required at every viewport:

```text
section labels readable
controls remain associated with their labels
switch/toggle hit areas remain usable
long descriptions wrap
modal/dialog content fits or scrolls
```

A disabled control must remain visibly disabled in both themes and all target sizes.

---

# 10. Typography and density audit by size

At all viewports, verify the documented typography hierarchy.

Minimum checks:

```text
H1 32px desktop / responsive reduction if required by implementation
body1 16px
body2 14px
caption 12px
```

Mobile checks:

```text
no heading wraps to an accidental three-line block when a two-line layout is practical
buttons do not truncate labels
metadata may wrap or collapse before primary content does
```

Do not reduce text below the documented minimum merely to force a component onto one line.

---

# 11. Touch and pointer target audit

For touch-sized viewports verify:

```text
primary button -> usable target
icon-only control -> usable target + aria-label
list row -> usable target
drawer open/close -> usable target
composer send -> usable target
```

Do not rely on hover-only information or hover-only actions for mobile.

---

# 12. Long-content stress audit

Run these strings/data shapes at every category of viewport:

```text
very long document filename
very long conversation message
long Markdown heading
long unbroken token / URL
large code block
many cards
zero cards
large list
```

Expected:

```text
wrap or internal scroll
no page-wide horizontal overflow
no overlap
no hidden primary action
```

---

# 13. Theme + responsive cross-matrix

At minimum, run these combinations:

```text
320x568  + dark
320x568  + light
390x844  + dark
390x844  + light
768x1024 + dark
768x1024 + light
1024x768 + dark
1024x768 + light
1440x900  + dark
1440x900  + light
1920x1080 + dark
1920x1080 + light
```

Check:

```text
contrast
focus visibility
borders/dividers
disabled state
selected state
error state
loading state
```

---

# 14. Responsive test output format

For each viewport and each applicable component:

```text
UI_SIZE_TEST | <TEST-ID> | <COMPONENT> | <VIEWPORT> | <STATE> | PASS|FAIL | <summary>
```

Example:

```text
UI_SIZE_TEST | RS-CHAT-390 | UI-CHAT | 390x844 | populated | PASS | rail collapsed to drawer; composer reachable; no overflow
UI_SIZE_TEST | RS-VAULT-1024 | UI-VAULT | 1024x768 | populated | PASS | responsive panes preserve readable preview
UI_SIZE_TEST | RS-HOME-2560 | UI-HOME | 2560x1440 | loaded | PASS | content remains within 1120px max width
```

Aggregate output:

```text
RESPONSIVE_TOTAL:
RESPONSIVE_PASS:
RESPONSIVE_FAIL:
RESPONSIVE_BLOCKED:
OVERFLOW_FAILURES:
CLIPPED_TEXT_FAILURES:
TOUCH_FAILURES:
ACCESSIBILITY_FAILURES:
THEME_FAILURES:
```

---

# 15. Browser/engine coverage

When Playwright or an equivalent browser runner is present, use at least:

```text
Chromium desktop
Chromium mobile emulation
WebKit mobile-class test
Firefox desktop
```

Exact browser coverage may be constrained by the local test environment, but the report must state what was actually run.

Example:

```text
BROWSER: Chromium  -> PASS
BROWSER: Firefox   -> PASS
BROWSER: WebKit    -> BLOCKED (engine unavailable)
```

A blocked browser engine is not the same as a pass.

---

# 16. Responsive acceptance gate

P0.4.2 UI acceptance requires:

```text
all mandatory components tested
all mandatory states tested
all mandatory viewports tested
zero horizontal page overflow
zero uncaught runtime errors
zero fabricated fallback data
zero knowingly non-functional primary controls
accessibility checks pass for mandatory interactions
```

Any one of these is sufficient to keep the phase in `FAIL` or `BLOCKED` status until resolved or formally re-scoped.

---

# 17. Cause-elimination rule for responsive bugs

Do not patch each viewport independently when one shared cause exists.

Example:

```text
390px overflow
768px overflow
1024px overflow
```

First inspect:

```text
fixed-width parent
min-width
hardcoded pane width
flex/grid constraints
padding calculation
long-content handling
```

Then fix the shared cause and rerun all affected viewports.

The regression suite must include the original failing viewport plus at least one adjacent smaller and larger viewport.

