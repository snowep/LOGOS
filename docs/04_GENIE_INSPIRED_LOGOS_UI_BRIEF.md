# LOGOS — Genie-Inspired UI Adaptation Brief for Hermes Agent

**Status:** Design direction proposal for P0.4.1 UI correction / post-P0.4.1 refinement  
**Reference:** Dribbble — “Genie Chatbot - Personal AI Assistant” by Jack R. for RonDesignLab  
**Reference URL:** https://dribbble.com/shots/25109551-Genie-Chatbot-Personal-AI-Assistant

## 1. Purpose

Use the referenced Genie design as a **visual and interaction reference**, not as a screen-by-screen copy.

LOGOS should borrow the reference's strongest product ideas:

- conversation is the primary workspace,
- recent work is visible without overwhelming the user,
- information is grouped into soft, understandable cards,
- the assistant feels like a persistent personal tool rather than an admin console,
- the interface uses strong whitespace, rounded surfaces, and clear visual hierarchy,
- the user can move between conversations and supporting AI capabilities without losing context.

LOGOS must remain its own product. Do **not** copy the Genie logo, mascot, exact illustrations, exact wording, exact colors, exact layout proportions, or proprietary visual assets.

The Dribbble project describes its design as a conversational UI with simplified card-based organization intended to reduce cognitive load. citehttps://dribbble.com/shots/25109551-Genie-Chatbot-Personal-AI-Assistant

## 2. Design translation: Genie → LOGOS

| Genie reference characteristic | LOGOS adaptation |
| --- | --- |
| Large chat workspace | Make Chat the central primary workspace |
| Secondary history / recent interaction column | Add an internal conversation rail inside Chat, separate from global navigation |
| Soft card groups | Use restrained MUI `Card`, `Paper`, `List`, and `Chip` surfaces for conversations, context, tasks, and results |
| Prominent assistant identity | Use LOGOS name/mark and subtle assistant-state treatment; no mascot required |
| Quick capability/result cards | Use contextual action cards such as “Open vault note”, “Review task”, “Resume council”, “View memory” |
| Lots of visual breathing room | Preserve generous spacing and a narrow content measure for readable conversation text |
| Product-like rather than technical feel | Hide implementation details from normal users; move diagnostics to System/Developer |
| Tablet/mobile split-screen composition | Build a responsive desktop split view and a single-column mobile view |
| Light pastel presentation | Keep LOGOS dark-by-default warm palette; use tonal surfaces and temporary warm accent tokens instead of copying Genie colors |

## 3. Core product principle

The screen should feel like **“my space with LOGOS”**, not **“a dashboard for operating an AI system.”**

The user should understand the following hierarchy immediately:

1. What is LOGOS doing / ready to do?
2. What was I doing recently?
3. What should I continue?
4. What information or action is attached to the current conversation?
5. Technical diagnostics only when explicitly requested.

Normal screens must not lead with telemetry such as request rates, worker counts, model internals, token statistics, raw event streams, or fictional system-health numbers.

## 4. Proposed desktop composition

### 4.1 Global shell

Keep the existing LOGOS shell contract:

- collapsed navigation: **64 px**
- expanded navigation: **248 px**
- top bar: **56 px**
- content max width: **1120 px**
- desktop page padding: **32 px**
- mobile page padding: **16 px**

The global navigation remains the product-wide navigation. Do not replace it with the Genie-style internal history rail.

### 4.2 Chat page

Inside `/chat`, use a two-zone composition:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ LOGOS shell / top bar                                                       │
├───────────┬─────────────────────────────────────────────────────────────────┤
│           │ Chat header                                                     │
│ Recent    │ Conversation title / status / actions                          │
│ chats     ├─────────────────────────────────────────────────────────────────┤
│           │                                                                 │
│ + New     │ User message                                                   │
│ Chat      │                                                                 │
│           │ LOGOS response                                                 │
│ Today     │                                                                 │
│ • item    │       contextual cards / files / task result                    │
│ • item    │                                                                 │
│           │                                                                 │
│ Yesterday │                                                                 │
│ • item    │                                                                 │
│ • item    │                                                                 │
│           ├─────────────────────────────────────────────────────────────────┤
│           │ Composer                                                        │
│           │ [ + ]  Ask LOGOS...                                  [ Send ]  │
└───────────┴─────────────────────────────────────────────────────────────────┘
```

Recommended internal chat rail width: **280–320 px** on desktop.

Main conversation area should remain visually dominant. The history rail is secondary and should never consume most of the viewport.

### 4.3 Conversation rail behavior

Show:

- `New chat`
- recent conversations grouped by date or recency,
- concise conversation titles generated from the conversation,
- small optional context indicators such as project/task/vault source,
- active conversation state.

Do not show:

- raw database IDs,
- model names unless relevant,
- token counts,
- internal agent IDs,
- filesystem implementation paths,
- debug event names.

A conversation row should be understandable without technical knowledge.

Example:

```text
Today

Design Drop 002
11:32

Vault cleanup
09:14

Council — scarcity
08:40

Yesterday

LOGOS architecture

Vendor pricing
```

## 5. Main chat experience

### 5.1 Header

Header content should be minimal:

- conversation title,
- small context label when useful, e.g. `Project · DROP 002`,
- optional secondary action menu,
- no oversized dashboard metrics.

### 5.2 Messages

Do not imitate generic consumer chat bubble styling too literally.

Use a calm document-like reading experience:

- user messages visually distinct but not oversized,
- LOGOS answers use readable text blocks,
- Markdown rendered naturally,
- links and citations are clear,
- code is contained in dedicated blocks,
- attachments appear as compact cards,
- long answers may expose a short summary before details.

### 5.3 Contextual result cards

The Genie reference uses card-based interaction to make capabilities and results easy to scan. LOGOS should adopt this selectively.

Examples:

**Vault card**
```text
DROP 002 — Canon
Vault / Lore
Updated 4 minutes ago

[ Open note ] [ Show related ]
```

**Task card**
```text
Prepare vendor quote
Due Friday
Project: DROP 002

[ Open task ]
```

**Council card**
```text
Council session
Scarcity as a brand principle
7 participants · 1 decision pending

[ Review session ]
```

**Memory card**
```text
Potential durable memory
“Scarcity is the core.”
Source: DROP 002 discussion

[ Review ] [ Dismiss ]
```

Cards must represent **real records or real actions**. Never populate them with fabricated demo data in production builds.

## 6. Home page adaptation

The reference should also influence `/` (Home), but Home is not simply a second Chat page.

Home should feel like a quiet personal command center.

Recommended structure:

```text
Good afternoon.

What should we work on?

┌─────────────────────────────────────────────────────────────┐
│ Ask LOGOS…                                                  │
│                                                             │
│                                                     [Send]  │
└─────────────────────────────────────────────────────────────┘

Continue

┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
│ DROP 002           │ │ Vault              │ │ Open tasks         │
│ Project            │ │ 3 recent changes  │ │ 2 due soon         │
│ [Continue]         │ │ [Open]            │ │ [Review]            │
└───────────────────┘ └───────────────────┘ └───────────────────┘

Recent conversations
...
```

Home should not become an analytics dashboard. Cards are for meaningful user context, not system metrics.

## 7. Responsive behavior

### Desktop ≥ 1200 px

- global shell remains visible,
- internal chat history rail visible,
- conversation content has a readable max width,
- secondary contextual cards may sit alongside a result when there is sufficient room.

### Tablet 768–1199 px

- global nav may remain collapsed,
- internal chat history rail narrows,
- contextual cards stack or wrap,
- conversation content keeps comfortable line length.

### Mobile < 768 px

- one-column layout,
- internal history opens as a drawer or modal,
- no horizontal scrolling,
- composer remains reachable and visually dominant,
- cards stack vertically,
- technical navigation remains secondary.

## 8. Visual language for LOGOS

Use the existing temporary LOGOS theme tokens from the UI corrective direction. Do not import Genie's color palette.

### Dark default

- background: `#0F0E0D`
- paper: `#171514`
- elevated surface: `#1D1B19`
- divider: `#34302C`
- primary text: `#F4F0EA`
- secondary text: `#B8B1A8`
- disabled text: `#746E68`
- accent: `#B87945`
- accent light: `#D3A67B`
- accent dark: `#8C5630`

Semantic states remain:

- success `#6FBF8A`
- warning `#D6A85E`
- error `#D97878`
- info `#7FA7C7`

### Surface strategy

Prefer **tonal separation** over heavy borders and shadows.

Example hierarchy:

```text
App background
  ↓
Paper surface
  ↓
Elevated surface
  ↓
Active/selected surface
  ↓
Temporary accent emphasis
```

Avoid:

- purple/indigo secondary branding,
- glossy glassmorphism everywhere,
- neon gradients,
- excessive shadows,
- decorative AI “magic” effects,
- oversized illustrations that compete with content.

## 9. Typography

Use the existing LOGOS typography contract.

- H1: 32 / 1.2 / 600
- H2: 28 / 1.25 / 600
- H3: 20 / 1.3 / 600
- section title: 18
- card title: 16
- body: 16 / 1.6
- secondary body: 14 / 1.5
- caption: 12 / 1.4
- overline: 11 / 1.3

Conversation text should prioritize readability over decorative type treatment.

## 10. MUI implementation rules

Use **MUI v9** components and theme APIs as the default implementation language.

Preferred building blocks:

- `AppBar`
- `Drawer`
- `Box`
- `Stack`
- `Grid`
- `Paper`
- `Card`
- `CardContent`
- `List`
- `ListItemButton`
- `Divider`
- `TextField`
- `IconButton`
- `Button`
- `Chip`
- `Avatar`
- `Tooltip`
- `Menu`
- `MenuItem`
- `CircularProgress`
- `Alert`
- `Skeleton`

Use `@mui/icons-material` for icons.

Do not create a new custom component system merely to reproduce the reference. Small application components are fine when they represent actual LOGOS behavior, but styling should stay centralized in the MUI theme wherever practical.

## 11. Existing LOGOS corrections that still apply

This adaptation does **not** replace the existing P0.4.1 corrective requirements.

The following remain mandatory:

- Vault page must not nest `Shell` when the root layout already owns it.
- Remove fake `Edit`, `Rename`, `Move`, `Archive`, `Show related`, and `Find conflicts` behavior unless backed by real API operations.
- Memory page must not fall back to fabricated example records.
- System page must use MUI and the centralized theme.
- Settings must contain only real backed controls or visibly unavailable controls.
- Theme behavior must default to dark when no preference is stored, while respecting an explicitly stored preference.
- Remove unused purple/indigo secondary branding.
- Normal UI must not expose debug/system internals by default.

## 12. Interaction details Hermes should implement

### New chat

Clicking `New chat` starts a clean conversation without deleting old history.

### Selecting a conversation

Selecting an existing conversation loads its actual messages and context.

### Composer

The composer must support the capabilities actually implemented by the current phase. Do not display controls for unsupported input types.

For the current LOGOS product definition, voice and vision are explicitly out of scope.

### Loading state

Use MUI `Skeleton` or a restrained progress indicator. Do not simulate AI thinking with fake technical logs.

### Error state

Use a clear human-readable message and retry action. Do not substitute sample data.

### Empty state

Example:

```text
Nothing here yet.

Start a conversation with LOGOS.

[ New chat ]
```

### Destructive actions

Require explicit confirmation where data can be deleted or moved to a destructive state.

## 13. Animation / motion

Motion should be subtle and functional.

Allowed:

- drawer open/close,
- card/row selection transitions,
- loading indicators,
- lightweight composer focus transitions.

Avoid:

- constant particle effects,
- decorative pulsing,
- animated gradients,
- fake neural-network visualizations,
- long intro animations.

The assistant should feel calm, not theatrical.

## 14. Accessibility

Every meaningful interactive element must be keyboard accessible.

Icon-only buttons require `aria-label`.

Maintain sufficient contrast for text and controls.

Do not encode meaning solely through color.

Focus states must be visible.

The conversation rail must have a logical heading/landmark structure.

The composer must be usable without a mouse.

## 15. Data truthfulness

Every visible item must have a data source.

Allowed sources:

- live API response,
- actual SQLite-backed record,
- actual filesystem/vault state,
- explicit local UI state,
- deterministic empty/error state.

Not allowed:

- hardcoded fake conversations presented as real,
- invented task counts,
- invented memory entries,
- invented health metrics,
- fake activity timestamps,
- `console.log` as the implementation of a user action,
- placeholder success messages that imply a mutation happened.

## 16. Suggested file-level implementation map

Hermes should first inspect the current repository and then map the design to the existing code instead of creating duplicate pages or shells.

Likely touch points:

```text
apps/web/app/layout.tsx
apps/web/app/page.tsx
apps/web/app/chat/page.tsx
apps/web/app/vault/page.tsx
apps/web/app/memory/page.tsx
apps/web/app/system/page.tsx
apps/web/app/settings/page.tsx
apps/web/app/components/*
apps/web/src/theme/tokens.ts
apps/web/src/theme/theme.ts
apps/web/src/theme/ThemeRegistry.tsx
apps/web/src/hooks/*
apps/web/src/api/*
packages/ui/*
packages/contracts/*
```

Before changing files, Hermes must verify which components already exist. Do not create a second `Shell`, second theme provider, second navigation implementation, or another chat page.

## 17. Suggested component hierarchy

```text
Shell
├── GlobalNavigation
├── TopBar
└── PageContent

ChatPage
├── ChatWorkspace
│   ├── ConversationRail
│   │   ├── NewChatButton
│   │   └── ConversationList
│   └── ConversationPane
│       ├── ConversationHeader
│       ├── MessageList
│       │   ├── UserMessage
│       │   ├── AssistantMessage
│       │   └── ContextCard
│       └── Composer
└── OptionalContextDrawer (tablet/mobile)
```

These names are conceptual. Reuse existing application components where they already satisfy the responsibility.

## 18. Acceptance criteria

### Visual

- [ ] Chat is the dominant workspace.
- [ ] Recent conversations are available without overwhelming the main view.
- [ ] Card surfaces are calm and restrained.
- [ ] Layout has generous whitespace and clear hierarchy.
- [ ] Dark theme is the default.
- [ ] No purple/indigo product branding remains.
- [ ] No copied Genie branding or assets are present.

### Functional

- [ ] New chat creates a real empty conversation.
- [ ] Selecting a conversation loads real data.
- [ ] Visible action cards execute real actions or are absent.
- [ ] Error/loading/empty states are truthful.
- [ ] Mobile history uses a drawer or equivalent responsive interaction.

### Architecture

- [ ] Global `Shell` is owned in one place.
- [ ] API/data fetching is not embedded as ad-hoc duplication across pages.
- [ ] Chat event/SSE behavior uses the shared contract.
- [ ] No UI code writes directly to SQLite.
- [ ] No new duplicate component framework is introduced.

### Accessibility

- [ ] Keyboard navigation works.
- [ ] Icon-only controls have accessible labels.
- [ ] Focus states are visible.
- [ ] Text and interactive states remain legible in dark and light themes.

### Truthfulness

- [ ] No fake production data.
- [ ] No placeholder actions disguised as working features.
- [ ] No unsupported voice/vision controls.
- [ ] No fabricated system metrics.

## 19. Hermes execution instruction

Treat this document as a **design adaptation brief** for LOGOS, not as permission to rewrite unrelated architecture.

Implementation order:

1. Inspect existing shell, theme, chat, vault, memory, system, and settings code.
2. Identify duplicate or fake UI behavior.
3. Build the Chat workspace around the two-zone composition.
4. Reuse MUI primitives and the existing theme system.
5. Make every visible interaction truthful and API-backed.
6. Validate desktop, tablet, and mobile layouts.
7. Run typecheck, lint, build, tests, and manual UI acceptance.
8. Report exact files changed, tests run, and remaining gaps.

Required report format:

```text
STATUS: COMPLETE | BLOCKED | FAILED
TASK:
FILES INSPECTED:
FILES CHANGED:
FINDINGS:
TESTS:
RISKS:
NEXT ACTION:
```

## 20. Reference note

The referenced Dribbble shot presents a personal AI assistant interface with a two-part workspace: recent interactions on one side and a larger conversation/result area on the other. Its project description explicitly identifies a simplified card-based conversational UI as part of the design approach. citehttps://dribbble.com/shots/25109551-Genie-Chatbot-Personal-AI-Assistant

The adaptation target is the **interaction pattern and visual clarity**, not the source artwork or brand identity.
