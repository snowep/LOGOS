# LOGOS — UI Corrective Directive for P0.4.2

## Product direction

P0.4.2 should move the UI from an implementation/admin dashboard toward a calm personal workspace.

Use:

```text
docs/04_GENIE_INSPIRED_LOGOS_UI_BRIEF.md
```

as the reference for the conversational interaction pattern.

Do not copy Genie branding, artwork, exact copy, or proprietary visual assets.

---

## 1. Shell

`apps/web/app/layout.tsx` owns the only Shell.

No page may render another Shell.

Keep:

```text
collapsed rail = 64px
expanded rail = 248px
top bar = 56px
content max = 1120px
```

The theme toggle must actually call `useThemeMode()`.

---

## 2. Chat: implement the new primary workspace

Use this desktop pattern:

```text
┌───────────────┬───────────────────────────────────────────────────────────┐
│ Recent chats  │ Conversation                                             │
│               │                                                           │
│ + New chat    │ user message                                              │
│               │ LOGOS response                                            │
│ Today         │                                                           │
│ • item        │ contextual cards                                          │
│ • item        │                                                           │
│ Yesterday     │                                                           │
│ • item        │                                                           │
│               ├───────────────────────────────────────────────────────────┤
│               │ [ + ]  Ask LOGOS...                              [ Send ] │
└───────────────┴───────────────────────────────────────────────────────────┘
```

Internal conversation rail target: roughly 280–320px desktop.

The main conversation area must remain visually dominant.

Mobile: convert the conversation rail to a drawer.

---

## 3. Chat truthfulness

Do not seed the UI with fake conversation records.

The following must come from real data or be honestly unavailable:

```text
recent conversations
context
vault notes
council sessions
decisions
tasks
memories
```

Do not expose raw internal model reasoning in the normal UI.

Prefer:

```text
Sources
Why this result
Relevant context
```

over a raw `reasoning` field.

---

## 4. Context/result cards

Use MUI `Card`/`Paper`/`List`/`Chip` for meaningful records.

Examples:

```text
Vault note
Task
Council session
Memory proposal
Decision
```

Cards must be backed by real state or be omitted.

Buttons must execute real operations or be disabled with a clear unavailable explanation.

---

## 5. Vault

Keep the existing three-pane knowledge structure only if it remains useful:

```text
200px knowledge
320px document list
remaining preview
```

But ensure the normal document list contains only active records.

Remove stale handlers using:

```text
prompt()
confirm()
console.log()
```

Delete dead code rather than leaving it behind.

Keep sanitized Markdown rendering.

Replace hardcoded colors with valid MUI theme paths.

---

## 6. Memory

No fake fallback data.

On API failure:

```text
Unable to load memories.
[Retry]
```

When there are no records:

```text
Nothing here yet.
```

---

## 7. System

Rebuild with official MUI components.

Do not use page-level raw HTML + inline style as a second visual system.

Show real values only.

System may expose technical details because it is an advanced area, but values must be sourced from real runtime state.

---

## 8. Settings

Only show controls that are actually implemented.

Every control must be one of:

```text
real + persisted
```

or:

```text
disabled + unavailable
```

Remove hardcoded machine paths.

---

## 9. Theme

First launch:

```text
dark
```

No OS light-mode auto-selection without an explicit stored product preference.

The visible theme button must actually toggle and persist the mode.

Remove purple/indigo product colors.

Use the warm temporary accent:

```text
#B87945
```

and the existing semantic colors.

---

## 10. Data surfaces

Normal UI should answer:

```text
What matters?
```

Advanced System/Developer surfaces may answer:

```text
How does the machine work?
```

Do not put token counts, raw event names, worker IDs, implementation paths, or fabricated health claims in normal user surfaces.

---

## 11. Accessibility

Required:

- keyboard navigation,
- visible focus,
- `aria-label` on icon-only controls,
- readable heading hierarchy,
- sufficient contrast,
- no color-only meaning,
- no horizontal scroll.

Required viewport checks:

```text
1440x900
1280x800
1024x768
768x1024
390x844
```

---

## 12. Final UI verification

Hermes must manually inspect:

```text
/
/chat
/vault
/memory
/system
/settings
```

and compare each screen against:

```text
03_UI_CORRECTIVE_DIRECTIVE.md
04_GENIE_INSPIRED_LOGOS_UI_BRIEF.md
```

The final report must identify any screen that remains intentionally incomplete.

---

## 12. Required UI verification before acceptance

Use:

```text
06_UI_COMPONENT_TEST_MATRIX.md
07_RESPONSIVE_SIZE_AUDIT.md
```

No UI-affecting commit is accepted from a desktop-only visual check.

For every changed component, record:

```text
component
route
viewport
state
expected
actual
runtime errors
accessibility
truthfulness
PASS/FAIL
```

At minimum, rerun:

```text
320x568
390x844
768x1024
1024x768
1440x900
1920x1080
```

Then rerun all mandatory viewport sizes from the responsive audit before phase acceptance.
