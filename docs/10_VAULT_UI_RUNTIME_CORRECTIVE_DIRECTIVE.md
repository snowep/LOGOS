# LOGOS — P0.4.2 Vault UI and Runtime Corrective Directive

## Objective

Make `/vault` truthful, stable, responsive, and directly connected to the real document API/SSE state.

## Current root causes

```text
API route resolution failure
stale dead action handlers
hardcoded Markdown colors
wrong MUI sx keys
SSE callback identity churn
ineffective fetch cancellation
fixed three-pane layout on every size
stale 64px height assumption
```

## 1. API loading

`apps/web/app/vault/page.tsx` must:

```text
fetch same-origin /api/documents?limit=100
expect application/json
show loading state
show truthful error state
retry the real request
```

The retry mechanism must not create overlapping uncontrolled fetch loops.

Use `AbortController` or correctly scoped effect cleanup.

## 2. Error behavior

Do not convert a backend error into a fake success state.

Display:

```text
Unable to load documents.
[Retry]
```

Optionally expose a concise technical detail in an advanced/debug affordance, but do not flood the normal user surface with stack traces.

## 3. Remove dead handlers

Delete, not merely disable, handlers that are not implemented:

```text
handleEdit
handleRename
handleMove
handleArchive
handleShowRelated
handleFindConflicts
```

Delete associated:

```text
prompt()
confirm()
console.log()
```

If a menu action is not implemented, it may appear as a disabled item only when the product design explicitly calls for an unavailable affordance. It must not contain dead executable logic.

## 4. Vault actions

`Ask LOGOS` may remain only if `/chat` can actually accept that action through a real supported route.

Otherwise disable it with a clear unavailable state instead of navigating into a non-functional flow.

## 5. Theme compliance

Replace all raw Vault content colors with semantic MUI theme paths or `sx` values derived from the theme.

Remove product-facing purple/indigo values.

Check at minimum:

```text
#6366f1
#818cf8
#27272a
#0d0d0d
#e4e4e7
#a1a1aa
#fff
```

No hardcoded visual color may remain unless it is explicitly justified as data content or an accessibility-safe immutable token.

## 6. Markdown rendering

Keep:

```text
marked
DOMPurify
```

The sanitized HTML path must remain intact.

Markdown links/images must not become an XSS bypass.

Code blocks must scroll internally rather than create page-wide overflow.

## 7. Three-pane behavior

Desktop reference:

```text
knowledge = 200px
documents = 320px
preview = remaining
```

But this is not a universal fixed layout.

Required:

```text
320–599 -> one pane at a time / drawer-assisted
600–767 -> one primary pane + optional drawer
768–1023 -> two-pane or drawer-assisted
1024–1279 -> three-pane only when readable
1280+ -> three-pane acceptable
```

## 8. Vault header density

The section header should not create unnecessary vertical whitespace.

The workspace starts directly below the Shell top bar.

Target:

```text
top bar = 56px
workspace begins immediately after it
internal pane headers use normal 16–24px padding
```

Do not add an extra 64px spacer or page-level top margin.

## 9. Document list semantics

Only active documents may appear.

Document selection must update the actual preview.

Displayed metadata must match API values.

## 10. SSE lifecycle

`useVaultEvents.ts` must not recreate the EventSource merely because Vault rerendered with new inline callbacks.

Use stable callback refs or equivalent lifecycle-safe design.

The canonical event vocabulary is:

```text
created
modified
deleted
renamed
moved
reconcile-complete
```

`sync-complete` must not be used.

## 11. Event behavior

A Vault event must produce at most one intentional list invalidation/refetch for the same logical event.

A reconcile-complete event with:

```text
scanQuality = FAILED
```

must not be treated as a clean synchronization result.

## 12. Accessibility

Required:

```text
icon-only action -> aria-label
selected document -> keyboard reachable
knowledge category -> keyboard reachable
search field -> accessible label
mobile drawer -> accessible open/close
focus visible in both themes
```

## 13. Required UI output

```text
UI_TEST | UI-VAULT | /vault | 1440x900 | loaded | PASS|FAIL | <summary>
UI_TEST | UI-VAULT | /vault | 390x844 | loaded | PASS|FAIL | <summary>
UI_TEST | UI-VAULT-LIST | /vault | 1440x900 | populated | PASS|FAIL | <summary>
UI_TEST | UI-VAULT-LIST | /vault | 390x844 | populated | PASS|FAIL | <summary>
UI_TEST | UI-VAULT-PREVIEW | /vault | 1440x900 | selected | PASS|FAIL | <summary>
UI_TEST | UI-VAULT-PREVIEW | /vault | 390x844 | selected | PASS|FAIL | <summary>
UI_TEST | UI-VAULT | /vault | 1440x900 | api-error | PASS|FAIL | <summary>
```

## Required report

```text
STATUS:
API_LOADING:
ERROR_STATE:
DEAD_CODE_REMOVED:
THEME_COMPLIANCE:
SSE_LIFECYCLE:
RESPONSIVE_LAYOUT:
ACCESSIBILITY:
RUNTIME_ERRORS:
UI_TEST_RESULTS:
FILES_CHANGED:
REGRESSION_TESTS:
```
