# LOGOS — UI Component Test Matrix and Expected Outputs

## Purpose

This document defines the **component-level UI verification contract** for LOGOS.

It is a complement to the functional acceptance matrix. A page is not considered passing merely because it renders. Each user-facing component must prove:

```text
renders
-> uses real state
-> handles loading
-> handles empty state
-> handles error state
-> handles interaction
-> preserves accessibility
-> preserves layout at required viewports
-> produces no runtime/console errors
```

Do not use fake records, hardcoded success states, fake counters, or non-functional controls to obtain a green result.

---

# 1. Required UI test output format

Every component test must print a machine-readable line and a human-readable summary.

Required line format:

```text
UI_TEST | <ID> | <route> | <viewport> | <state> | PASS|FAIL | <summary>
```

Example expected output:

```text
UI_TEST | UI-SHELL-01 | /chat | 1440x900 | loaded | PASS | one Shell, nav visible, no horizontal overflow
```

Every failed test must be followed by:

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
ROOT-CAUSE-LAYER:
ROOT-CAUSE:
REGRESSION-ID:
```

The UI suite must also emit an aggregate summary:

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
```

Acceptance rule:

```text
UI_FAIL > 0      -> phase FAIL
UI_BLOCKED > 0   -> phase cannot be accepted without documented disposition
UI_SKIPPED > 0   -> allowed only when explicitly non-mandatory and documented
```

---

# 2. Component inventory

The following are the minimum user-facing components that must have direct UI tests or be covered by an explicitly named parent integration test.

## Global

| ID | Component | Source area | Required behavior |
|---|---|---|---|
| UI-SHELL | App Shell | `apps/web/app/components/Shell.tsx` | single shell, navigation, top bar, theme control |
| UI-NAV | Navigation rail | Shell | active route, collapse/expand, keyboard access |
| UI-TOPBAR | Top bar | Shell | page context, actions, responsive behavior |
| UI-THEME | Theme toggle | Shell + theme registry | dark first launch, actual toggle, persistence |
| UI-TOAST | Feedback surface | shared UI | success/error feedback is truthful and dismissible |
| UI-ERROR | Error state | shared patterns | readable failure + retry where recovery exists |
| UI-EMPTY | Empty state | shared patterns | honest no-data message, no fake records |
| UI-LOADING | Loading state | shared patterns | visible loading without layout collapse |

## Home

| ID | Component | Required behavior |
|---|---|---|
| UI-HOME | Home page | command entry and personal overview render from real state |
| UI-HOME-COMMAND | Command box | input, focus, submit, disabled/loading state |
| UI-HOME-PROJECTS | Project cards | real records only; no fake activity |
| UI-HOME-ACTIVITY | Activity/summary surface | real data or truthful unavailable state |

## Chat

| ID | Component | Required behavior |
|---|---|---|
| UI-CHAT | Chat workspace | dominant conversation area, real lifecycle state |
| UI-CHAT-RAIL | Recent conversation rail | real persisted conversations or truthful empty/error state |
| UI-CHAT-NEW | New chat action | creates a real conversation or is honestly unavailable |
| UI-CHAT-ITEM | Conversation item | selection changes the real conversation |
| UI-CHAT-MSG | Message renderer | correct role, content, timestamps where supplied |
| UI-CHAT-CARD | Context/result card | real vault/task/council/memory record |
| UI-CHAT-COMPOSER | Composer | multiline input, send, disabled/loading behavior |
| UI-CHAT-APPROVAL | Approval surface | pending consequential action shown honestly; approve/cancel are real operations |
| UI-CHAT-SOURCE | Source/context disclosure | source data only; no invented citations |

## Vault

| ID | Component | Required behavior |
|---|---|---|
| UI-VAULT | Vault workspace | active documents only; real filesystem-backed state |
| UI-VAULT-KNOWLEDGE | Knowledge/tree pane | scoped navigation, no phantom entries |
| UI-VAULT-LIST | Document list | active rows only, real selection |
| UI-VAULT-PREVIEW | Preview/editor surface | real document content, safe rendering |
| UI-VAULT-SYNC | Sync status | reflects real SSE/reconcile state |
| UI-VAULT-CONFLICT | Conflict state | real conflict data, actionable only when implemented |
| UI-VAULT-MOBILE | Mobile vault navigation | panes collapse/drawer without horizontal scrolling |

## Memory

| ID | Component | Required behavior |
|---|---|---|
| UI-MEMORY | Memory page | real memory records |
| UI-MEMORY-ROW | Memory item | provenance/type/status shown from data |
| UI-MEMORY-FILTER | Filters | actually filter data or are disabled |
| UI-MEMORY-RETRY | Error retry | retries real API request |
| UI-MEMORY-EMPTY | Empty state | no fabricated examples |

## People / Agents / Councils

| ID | Component | Required behavior |
|---|---|---|
| UI-PEOPLE | People surface | real personas/agents/councils or honest unavailable state |
| UI-PERSONA-CARD | Persona card | real identity/configuration |
| UI-AGENT-CARD | Agent card | real role/status |
| UI-COUNCIL-CARD | Council card | real membership/status |
| UI-COUNCIL-SESSION | Council session | real session state; no fake transcript |

## Work / Tasks / Decisions

| ID | Component | Required behavior |
|---|---|---|
| UI-WORK | Work page | real project/task/decision records |
| UI-TASK | Task row/card | real status and actions |
| UI-DECISION | Decision card | real decision record and provenance |
| UI-PROJECT | Project card | real project data |

## Automations / Scheduling

| ID | Component | Required behavior |
|---|---|---|
| UI-AUTOMATIONS | Automations page | real automation records |
| UI-AUTOMATION-ROW | Automation item | real schedule/status |
| UI-SCHEDULE | Schedule surface | real schedule or truthful unavailable state |

## Advanced

| ID | Component | Required behavior |
|---|---|---|
| UI-SYSTEM | System page | MUI-only, real runtime values |
| UI-EVALUATION | Evaluation page | real evaluation records/metrics or unavailable state |
| UI-RETRIEVAL | Retrieval page | real retrieval status/results |
| UI-SELF-IMPROVEMENT | Self-improvement page | real proposals/status; no fake progress |
| UI-SETTINGS | Settings page | only real persisted settings or disabled unavailable controls |
| UI-DEVELOPER | Developer page | technical details may be shown, but values must be real |

---

# 3. Required state tests for every component

Every component in Section 2 must be exercised in the applicable states.

```text
S0 first render
S1 loading
S2 populated
S3 empty
S4 API/backend error
S5 permission denied / unavailable action
S6 long content
S7 interaction active
S8 success result
S9 failed mutation
S10 narrow viewport
S11 wide viewport
```

Not every component will require every state, but Hermes must document `N/A` rather than silently omit a relevant state.

For each applicable state, expected output must identify:

```text
visible UI
interactive controls
API calls
resulting state change
console/runtime errors
horizontal overflow
accessibility result
truthfulness result
```

---

# 4. Component-specific expected outputs

## UI-SHELL / UI-NAV / UI-TOPBAR

Expected:

```text
one Shell instance
active route is visually identifiable
navigation controls are keyboard reachable
collapsed and expanded widths match design tokens
no duplicate page-level Shell
no horizontal overflow
no console/runtime errors
```

Output example:

```text
UI_TEST | UI-SHELL-01 | /chat | 1440x900 | loaded | PASS | single Shell + 64px rail + 56px top bar
UI_TEST | UI-NAV-01 | /vault | 1440x900 | interaction | PASS | active Vault route and keyboard navigation work
```

## UI-THEME

Expected:

```text
a fresh session starts dark
clicking the theme control changes mode
refresh preserves the selected mode
no OS preference silently overrides stored product preference
no purple/indigo product accent appears
```

Output:

```text
UI_TEST | UI-THEME-01 | / | 1440x900 | first-launch | PASS | dark default
UI_TEST | UI-THEME-02 | / | 1440x900 | interaction | PASS | toggle changes mode
UI_TEST | UI-THEME-03 | / | 1440x900 | persistence | PASS | refresh preserves selection
```

## UI-CHAT

Expected desktop output:

```text
conversation workspace occupies the dominant area
recent-chat rail is approximately 280–320px
composer remains visible without overlap
real messages render
no fake conversation history appears after failed API calls
```

Expected mobile output:

```text
recent-chat rail becomes drawer/sheet
main conversation remains usable
composer is reachable above the mobile keyboard where supported
no horizontal scroll
```

Example:

```text
UI_TEST | UI-CHAT-01 | /chat | 1440x900 | populated | PASS | main conversation dominant, rail 300px
UI_TEST | UI-CHAT-02 | /chat | 390x844 | populated | PASS | rail is drawer, composer reachable
UI_TEST | UI-CHAT-03 | /chat | 390x844 | api-error | PASS | truthful error + retry, no fake chats
```

## UI-CHAT-COMPOSER

Expected:

```text
focus works
Enter/submit behavior is documented
send is disabled while required
loading state prevents duplicate submission
failed send does not fabricate a response
consequential action approval is separate from plain message send
```

## UI-CHAT-CARD

For every card type, test:

```text
Vault note
Task
Council session
Memory
Decision
```

Expected:

```text
record ID/source exists in API response
visible summary matches returned record
click action maps to a real route/action
missing target produces truthful unavailable state
```

## UI-VAULT

Expected:

```text
only active documents in normal list
selected document content matches real file/API state
sync event updates the visible state once
reconcile-complete refreshes/invalidate state once
no fake actions
no prompt()/confirm() dependency
no stale debug console.log() in production behavior
```

## UI-MEMORY

Expected API failure output:

```text
UI_TEST | UI-MEMORY-ERROR-01 | /memory | 1024x768 | api-error | PASS | error message + Retry; zero fabricated records
```

Expected empty output:

```text
UI_TEST | UI-MEMORY-EMPTY-01 | /memory | 1024x768 | empty | PASS | Nothing here yet; zero fabricated records
```

## UI-SYSTEM

Expected:

```text
MUI components only
real runtime values
no raw page-level HTML visual system
no fabricated “operational” status
```

## UI-SETTINGS

Expected:

```text
implemented setting -> interactive + persisted
unimplemented setting -> disabled + explicit unavailable state
no machine-specific vault path exposed as a fake editable control
```

---

# 5. Accessibility output per component

Every interactive component must record:

```text
keyboard focusable = PASS|FAIL|N/A
focus visible = PASS|FAIL|N/A
accessible name = PASS|FAIL|N/A
button/link semantics = PASS|FAIL|N/A
form label = PASS|FAIL|N/A
error association = PASS|FAIL|N/A
mobile target size = PASS|FAIL|N/A
```

Required rules include:

```text
icon-only button -> aria-label
form control -> accessible label
keyboard path -> reaches every primary action
focus -> visible in both themes
no interaction depends only on color
```

---

# 6. Runtime/truthfulness output per component

Each component test must check for:

```text
console.error = 0
uncaught runtime exception = 0
unhandled promise rejection = 0
failed API call handled honestly = PASS
fake fallback record detected = 0
placeholder action detected = 0
hardcoded machine data detected = 0
```

A component that looks correct but fails a truthfulness check is `FAIL`.

---

# 7. UI root-cause isolation

Use the first incorrect layer:

```text
wrong route data            -> API / SERVICE
right data, wrong display   -> UI component/state
right display, no reaction  -> SSE / React lifecycle
layout overflow             -> UI / responsive CSS
keyboard failure            -> UI / accessibility
fake fallback               -> UI / API error handling
wrong theme                 -> THEME / UI
wrong event name            -> CONTRACT / SSE / UI
```

---

# 8. Component acceptance gate

A component can be marked `PASS` only when:

```text
functional behavior PASS
responsive behavior PASS
accessibility PASS
runtime-error check PASS
truthfulness check PASS
```

For a phase acceptance, **all mandatory components must pass at all mandatory viewports**.

