# LOGOS — P0.4.2 UI Test Execution and Evidence Directive

## Objective

Convert the UI documents from design intent into executable evidence.

The current web `test` script only typechecks. That is not UI verification.

## Required test stack

Use an actual browser test runner, preferably Playwright, if the repository's environment supports it.

Do not claim UI verification from:

```text
tsc
build
lint
```

alone.

## Required scripts

The Web package must have explicit scripts for:

```text
npm run typecheck
npm run lint
npm run build
npm test
```

and a dedicated browser/UI command such as:

```text
npm run test:ui
```

or an equivalent documented command.

The root verification command must include the real UI test in the P0.4.2 acceptance procedure.

## Required browser coverage

At minimum, execute and report:

```text
Chromium desktop
Chromium mobile emulation
Firefox desktop
WebKit mobile-class test
```

If an engine is unavailable, mark it:

```text
BLOCKED
```

Never call it PASS.

## Mandatory viewport matrix

Run all:

```text
320x568
360x800
390x844
412x915
480x960
600x960
768x1024
820x1180
1024x768
1280x800
1440x900
1536x864
1920x1080
2560x1440
```

Orientation checks:

```text
390x844
844x390
768x1024
1024x768
```

## Component coverage

At minimum, every component named in:

```text
06_UI_COMPONENT_TEST_MATRIX.md
```

must either:

```text
have a direct browser test
```

or

```text
be explicitly covered by a parent integration test named in the evidence report
```

## Required UI states

For applicable components:

```text
first render
loading
populated
empty
API error
permission denied / unavailable
long content
interaction
success
failed mutation
narrow viewport
wide viewport
```

## Machine-readable output

Every test must emit:

```text
UI_TEST | <ID> | <route> | <viewport> | <state> | PASS|FAIL | <summary>
```

Responsive tests must emit:

```text
UI_SIZE_TEST | <ID> | <component> | <viewport> | <state> | PASS|FAIL | <summary>
```

Aggregate:

```text
UI_TOTAL:
UI_PASS:
UI_FAIL:
UI_SKIPPED:
UI_BLOCKED:
ACCESSIBILITY_PASS:
OVERFLOW_PASS:
RUNTIME_ERROR_PASS:
TRUTHFULNESS_PASS:
RESPONSIVE_TOTAL:
RESPONSIVE_PASS:
RESPONSIVE_FAIL:
RESPONSIVE_BLOCKED:
```

## Failure evidence

Every failure must capture:

```text
UI_FAILURE:
COMPONENT:
ROUTE:
VIEWPORT:
STATE:
EXPECTED:
ACTUAL:
CONSOLE_ERRORS:
NETWORK_ERRORS:
DOM/LAYOUT_EVIDENCE:
ROOT-CAUSE-LAYER:
ROOT-CAUSE:
REGRESSION-ID:
```

## Vault-specific minimum evidence

Before declaring Vault fixed:

```text
GET /api/documents -> 200
active documents render
selecting a document loads its content
no horizontal overflow at 390x844
sidebar labels are visible in mobile navigation
SSE connects without repeated reconnects during ordinary rerenders
reconcile-complete is recognized
```

## Top-gap evidence

Measure the distance between:

```text
bottom of global 56px top bar
```

and:

```text
first meaningful Vault workspace content
```

Record the measured value at:

```text
390x844
1024x768
1440x900
```

The expected result is that the workspace begins immediately below the global bar, with only the documented internal pane/header padding. Any unexplained extra global spacer is FAIL.

## Horizontal overflow evidence

At every mandatory viewport evaluate:

```text
document.documentElement.scrollWidth > document.documentElement.clientWidth
```

and equivalent browser layout evidence.

Expected:

```text
false
```

for normal pages.

Internal code/table scrolling is acceptable when intentionally contained.

## Acceptance

A P0.4.2 UI acceptance report cannot say “responsive verified” unless the actual browser tests ran and their output is attached or reproducible.

A green TypeScript/build result does not substitute for UI evidence.
