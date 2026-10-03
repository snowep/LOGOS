# LOGOS — P0.4.2 UI Truthfulness and Backend-Surface Alignment Directive

## Objective

Remove the current pattern where the frontend presents capabilities, controls, or records that the backend does not actually support.

This directive is intentionally broader than visual cleanup. A visually polished fake surface is still a P0.4.2 failure.

## 1. Memory

`apps/web/app/memory/page.tsx` currently inserts example records after an API failure.

Required:

```text
remove all fallback example records
```

On API failure:

```text
Unable to load memories.
[Retry]
```

On an empty real dataset:

```text
Nothing here yet.
```

Do not seed development examples in production page code.

Also verify the frontend request shape matches an actual backend endpoint. Do not assume `GET /api/memory` exists simply because the navigation page exists.

## 2. Settings

Every control must be one of:

```text
implemented + persisted
```

or:

```text
disabled + explicitly unavailable
```

Remove fake/no-op controls such as:

```text
checked={true} + onChange={() => {}}
checked={false} + onChange={() => {}}
```

Remove machine-specific examples such as a fixed `D:\Project\...` path.

Do not label an unimplemented capability as enabled.

## 3. System

Rebuild `apps/web/app/system/page.tsx` with MUI components and theme tokens.

No second raw HTML/CSS visual system.

Real values only.

Do not emit fabricated health text such as a guaranteed healthy state unless it comes from the real health endpoint.

## 4. Chat

The current `/chat` implementation is not aligned with the documented Genie-inspired architecture and contains unsupported assumptions.

Required before declaring Chat complete:

```text
recent-conversation rail or honest unavailable state
real conversation data or honest empty/error state
real context endpoint or honest unavailable state
real chat backend contract
real approval operation using serializable identifiers/actions
no browser-executed functions received from JSON
```

Do not encode:

```text
confirm: () => void
cancel: () => void
```

inside API JSON.

Use serializable action IDs and server endpoints if approval is implemented.

Do not expose raw internal reasoning in the normal user interface.

## 5. Home

Home may derive project/activity summaries only from real data.

Do not silently convert backend errors into an attractive but misleading empty dashboard.

Where data is unavailable, show the unavailable state.

## 6. Work / People / Automations

These may remain honest P0.x empty states when their backend phases have not landed.

The UI must say that they are unavailable because their corresponding backend capability has not been implemented yet.

Do not fabricate records.

Do not enable buttons that cannot perform an operation.

## 7. Backend surface audit

For each frontend fetch string, locate the exact corresponding backend route.

Required evidence table:

```text
FRONTEND REQUEST | BACKEND ROUTE | EXISTS | RESPONSE SHAPE | PASS/FAIL
```

Any request with no real backend route is:

```text
FAIL
```

unless the UI explicitly handles the feature as unavailable without attempting the request.

## 8. Truthfulness scan

Search source for:

```text
mock
fake
demo
placeholder
hardcoded
localhost
D:\
ORION
prompt(
confirm(
alert(
console.log(
console.error(
```

Each occurrence must be:

```text
removed
or
explicitly justified as test/developer-only code
```

## 9. Required output

```text
TRUTH_SCAN_TOTAL:
TRUTH_SCAN_RESOLVED:
TRUTH_SCAN_REMAINING:
UNSUPPORTED_ENDPOINTS:
FAKE_FALLBACKS:
NOOP_CONTROLS:
MACHINE_PATHS:
RAW_REASONING_SURFACES:
PASS/FAIL:
```

## Acceptance rule

A UI component that looks correct but displays fake data or a fake success state is `FAIL`.
