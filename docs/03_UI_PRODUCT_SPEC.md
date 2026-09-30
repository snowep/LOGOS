# LOGOS — UI Product Specification

## Product Identity

LOGOS should feel:

> **welcoming, warm, informative, dark, minimal, and capable.**

The user explicitly prefers:

- minimal Apple-like visual restraint;
- dark theme;
- compact icon sidebar that expands;
- chat context panel only when relevant;
- a custom work model combining projects, tasks, decisions, memory, and activity;
- Vault focused on meaningful `.md` knowledge files;
- highly transparent memory;
- people-like identities with clear operational roles for agents/councils;
- technical internals available under System;
- balanced information density;
- almost no animation.

Brand colors will be supplied later.

Until then, define semantic color tokens rather than locking the interface to arbitrary colors.

---

## 1. Core UI Principle

Normal UI answers:

> **What matters?**

Advanced UI answers:

> **How does the system work?**

The interface must progressively expose complexity.

Normal level:

```text
What do you need?
```

Context level:

```text
What is LOGOS doing?
```

Evidence level:

```text
What information is LOGOS using?
```

Technical level:

```text
How did the system execute it?
```

---

## 2. Global Shell

Desktop:

```text
┌──────┬─────────────────────────────────────────────┐
│      │                                             │
│ NAV  │                 CONTENT                     │
│      │                                             │
└──────┴─────────────────────────────────────────────┘
```

Collapsed navigation:

```text
64 px
```

Expanded navigation:

```text
240–256 px
```

The navigation begins collapsed on desktop and expands explicitly.

Mobile uses a drawer.

---

## 3. Navigation

```text
LOGOS

Home
Chat
Work
Vault
Memory
People
Automations

────────────

Settings
System
```

The navigation is visually quiet.

Current location must be obvious without being loud.

---

## 4. Top Bar

Height target:

```text
56–64 px
```

Show page/context and a small LOGOS readiness indicator.

Do not show raw:

- CPU
- RAM
- latency
- throughput
- active streams
- embedding model
- filesystem paths
- API port

Those belong under System.

---

# HOME

## 5. Home Purpose

Home answers:

> **What should I do next?**

It should not be a system dashboard.

---

## 6. Home Opening

Preferred opening:

```text
Good morning.

What are we working on?
```

The greeting may vary naturally.

Immediately below it is one dominant command box.

```text
┌───────────────────────────────────────────────────────┐
│ Continue a project, ask a question, or tell LOGOS    │
│ what to do...                                         │
│                                                   ↑   │
└───────────────────────────────────────────────────────┘
```

Examples:

```text
Continue DROP 002.
```

```text
What did we decide about scarcity?
```

```text
Start the strategy council.
```

---

## 7. Continue Working

Show a small number of active projects.

Each item should answer:

- what is this?
- where did we leave it?
- what happens next?

Example:

```text
DROP 002
Brand project

Last activity
Council discussion about scarcity

Next
Review decision
```

Do not overload project cards with statistics.

---

## 8. Needs Attention

Only show when useful.

Example:

```text
Needs your attention

DROP 002
A council decision has not yet been applied
 to the project notes.

Review →
```

This is one of LOGOS's important proactive surfaces.

---

## 9. Recent

Use human-readable activity:

```text
Today

09:12   DROP 002 updated
08:44   Council meeting completed
08:31   Research note added
```

Do not surface raw event names in Home.

---

# CHAT

## 10. Chat Layout

Chat is the main working interface.

```text
┌───────────────────────────────────────────────────────┐
│ Chat                                  DROP 002  ▾     │
├───────────────────────────────────────────────────────┤
│                                                       │
│ conversation                                          │
│                                                       │
├───────────────────────────────────────────────────────┤
│ Ask LOGOS...                                  Send ↑ │
└───────────────────────────────────────────────────────┘
```

---

## 11. Context Panel

The context panel appears only when relevant.

Example:

```text
Context

DROP 002

3 related notes
1 council session
2 decisions
4 memories

View sources →
```

Do not permanently display context machinery.

---

## 12. Source Transparency

Normal response:

> I found three related notes and the last council discussion.

On demand, show:

```text
Sources
3 documents
1 council session
4 memories

Reason
Matched project + topic + recent decision
```

---

## 13. Approval UI

Consequential actions must present a meaningful proposal.

Example:

```text
LOGOS proposes

Update:
DROP 002.md
scarcity.md

Changes:
• Change release quantity
• Add council conclusion
• Preserve previous decision in history

Review changes

Approve
Cancel
```

Avoid generic “Are you sure?” dialogs when the system can describe the real change.

---

# WORK

## 14. Work Model

Work is not a copy of Notion, Linear, or a kanban dashboard.

It is a connected LOGOS project model:

```text
Project
├── Overview
├── Tasks
├── Decisions
├── Documents
├── Memory
├── People
├── Councils
└── Activity
```

---

## 15. Project Screen

Example:

```text
DROP 002

Brand project
Active

Overview  Tasks  Decisions  Documents
Memory  People  Councils  Activity
```

Main content should emphasize:

- current focus
- next actions
- important decisions
- open questions
- recent activity

---

# VAULT

## 16. Vault Definition

The Vault UI is **not an Obsidian replacement**.

It surfaces the meaningful Markdown knowledge layer.

Focus on corresponding `.md` files that save important information such as:

- councils
- memory
- projects
- decisions
- research
- people
- documentation

Do not make the user browse arbitrary filesystem internals by default.

---

## 17. Vault Layout

```text
┌──────────────┬────────────────────┬─────────────────────────┐
│ KNOWLEDGE    │ DOCUMENTS          │ PREVIEW                 │
│              │                    │                         │
│ Projects     │ DROP 002.md        │ # DROP 002              │
│ Councils     │ scarcity.md        │                         │
│ Memory       │ council-04.md      │ Scarcity is the core... │
│ People       │ brand.md           │                         │
│ Decisions    │                    │                         │
└──────────────┴────────────────────┴─────────────────────────┘
```

---

## 18. Vault Relationships

A document should show meaningful relationships:

```text
DROP 002.md

Related

Project
DROP 002

Decisions
Scarcity is the core

Council
Brand Council — Session 04

Memory
Production quantity

People
Brand Manager
Research Manager
```

This is what makes LOGOS more than a file browser.

---

## 19. Vault Actions

Contextual actions can include:

- Ask LOGOS
- Edit
- Rename
- Move
- Archive
- Show related
- Find conflicts
- Update using LOGOS

Destructive actions require explicit confirmation/authorization.

---

# MEMORY

## 20. Memory Screen

Primary heading:

> **What does LOGOS remember?**

Search:

```text
Search what LOGOS remembers...
```

Human-facing categories may include:

- Recent
- About you
- Projects
- Decisions
- Knowledge
- Ways of working

Underlying memory types such as episodic/semantic/procedural/working may be exposed in advanced detail rather than becoming the user's main mental model.

---

## 21. Memory Detail

Example:

```text
Scarcity is a core principle of DROP 002.

Source
Brand Council — Session 04

Related
DROP 002
scarcity.md

Confidence
High

Created
Sep 29, 2026

Status
Durable
```

Provenance must be inspectable.

---

# PEOPLE

## 22. People Screen

Show:

```text
You

LOGOS

Agents
Personas
Councils
```

Agents and councils should feel like identities while remaining clearly operational.

---

## 23. Agent Detail

Example:

```text
Research Manager

Research & validation

Status
Available

Responsibilities
Research
Source checking
Evidence collection

Permissions
Read: Research/
Write: Research/Drafts/
Cannot: Delete canonical files
```

---

# COUNCILS

## 24. Council Screen

A council is a structured reasoning room.

Example:

```text
Brand Council

Purpose
Challenge brand decisions.

Members
● Member A
● Member B
● Member C
● Member D

Current Session
Scarcity
```

Do not turn councils into theatrical character UI.

---

## 25. Council Session

```text
Brand Council
Session 04

Topic
Scarcity

Participants
4

Discussion
...

Arguments
...

Disagreements
...

Evidence
...

Synthesis
...

Decision
...

Actions
...
```

Disagreement must be preserved rather than visually hidden in favor of forced consensus.

---

# AUTOMATIONS

## 26. Automation Screen

Example:

```text
Automations

Daily project review
Every day · 09:00
● Active

When DROP 002 changes
Review project consistency
● Active

Weekly vault review
Sunday · 18:00
○ Paused
```

Automation details expose:

- trigger
- scope
- actions
- permissions
- last run
- result
- failures

---

# SYSTEM

## 27. System Screen

This is where the current developer dashboard information belongs.

Sections:

```text
System
├── Health
├── Storage
├── Retrieval
├── Events
├── Runtime
├── Logs
├── Configuration
└── Developer
```

Here it is appropriate to expose:

- API health
- SQLite
- sqlite-vec
- watcher
- SSE
- model provider
- embedding model
- memory counts
- event counts
- runtime metrics
- logs
- development phase information

Only show values backed by real runtime state.

---

# SETTINGS

## 28. Settings

User-facing settings:

- appearance
- notifications
- language
- workspace
- permissions
- memory behavior
- automation
- integrations

Technical environment configuration may be exposed under advanced/developer settings where appropriate.

---

# VISUAL LANGUAGE

## 29. Theme

Dark theme is mandatory for this direction.

Use a dark background that is comfortable for long sessions.

Do not default to pure black with neon highlights.

Do not use futuristic glowing HUD styling.

---

## 30. Brand Colors

Brand colors are intentionally not frozen yet.

Use semantic tokens:

```text
background
surface
surfaceElevated
border
textPrimary
textSecondary
accent
success
warning
error
info
```

Brand identity will later map onto these tokens.

---

## 31. Typography

Typography carries hierarchy.

```text
Page title
    ↓
Section title
    ↓
Primary information
    ↓
Supporting information
    ↓
Metadata
```

Do not use oversized decorative headings.

---

## 32. Surfaces

Use official MUI components.

Prefer restrained combinations of:

- Paper
- Card
- List
- Drawer
- Dialog
- Popover
- Menu
- Tabs
- Chip
- Button
- TextField

Do not put every piece of content inside a card.

A clean section with a heading and divider is often preferable.

---

## 33. Radius and Elevation

Use small/moderate corner radius and subtle elevation.

Elevation communicates hierarchy.

It is not decorative.

---

## 34. Animation

Animation is nearly absent.

Allowed:

- drawer transition
- dialog transition
- small hover state
- progress/state indicator
- message appearance

Avoid:

- animated backgrounds
- floating UI
- glowing AI brains
- constant movement
- animated gradients

---

## 35. LOGOS Working State

When performing work, LOGOS should communicate activity plainly.

Example:

```text
LOGOS is working…

Finding the relevant project notes.
```

Then:

```text
LOGOS is working…

Reviewing the council discussion.
```

Then:

```text
Ready

I found the relevant information.
```

Do not use a theatrical “AI thinking” animation.

---

## 36. Error State

Normal UI example:

```text
LOGOS couldn't reach the vault.

The vault watcher is offline.

Retry
Open System
```

Technical error details may be expanded.

Never expose raw technical jargon as the only error message.

---

## 37. The Old Dashboard

The current developer dashboard is considered a prototype and should not be incrementally polished into the final Home page.

Replace the old information hierarchy.

Move developer information into System/Developer.

Remove false or hard-coded metrics.

Remove unsupported claims such as:

- fake active subagent counts;
- fake GitHub Projects integration status;
- fake model readiness claims;
- hard-coded telemetry;
- fake roadmap completion.

---

## 38. Final UX Test

Ask these questions for every screen:

1. Does this help the user understand what matters?
2. Does it hide implementation details until useful?
3. Does it make LOGOS's action understandable?
4. Does it preserve transparency when the user wants it?
5. Does it avoid pretending unsupported capabilities exist?
6. Does it feel warm and welcoming while remaining serious?
7. Does it work in a dark theme without excessive glow?
8. Is the interface primarily composed of official MUI components?
