# LOGOS — UI Product Specification v1

## Product feeling

LOGOS must feel:

- welcoming
- warm
- informative
- calm
- capable
- dark by default
- minimal
- personal

It must not feel like an admin dashboard, monitoring console, generic SaaS app, neon HUD, or developer console on Home.

Core sentence:

> LOGOS is a quiet personal command center that understands what matters.

## MUI

Use Material UI v9 and official `@mui/icons-material`. MUI v9 is the current stable major version. MUI documents official SVG icon components and accessibility patterns for icon buttons. See the project references in the audit response.

Use official components such as:

```text
Box
Stack
Container
Paper
Card
CardContent
Typography
Button
IconButton
TextField
List
ListItem
Divider
Chip
Alert
Drawer
AppBar
Toolbar
Tabs
Dialog
Menu
Tooltip
Avatar
CircularProgress
LinearProgress
```

Do not build custom replacements for standard MUI controls.

## Global layout

Desktop:

```text
collapsed rail: 64 px
expanded rail: 248 px
top bar: 56 px
content max width: 1120 px
page padding: 32 px
section gap: 32 px
card gap: 16 px
```

Tablet:

```text
padding: 24 px
navigation: rail or drawer
```

Mobile:

```text
drawer navigation
padding: 16 px
top bar: 56 px
```

## Typography

Use one font family:

```text
Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

Sizes:

```text
body1       16 / 1.6
body2       14 / 1.5
caption     12 / 1.4
overline    11 / 1.3

page h1     32 / 1.2 / 600
page h2     28 / 1.25 / 600
h3          20 / 1.3 / 600
section     18 / 1.35 / 600
card title  16 / 1.4 / 600
```

Never use 48–64 px page headings.

The current Home header is too large.

## Icons

Use only official MUI icons.

```text
navigation: 22–24 px
normal: 20–24 px
button icon: 20 px
metadata: 18 px
empty state: <=32 px
```

Every icon-only interactive control needs `aria-label`.

Do not add an icon to every card.

Do not use decorative rockets/robots/analytics/terminal icons merely to fill space.

Remove the current Home microphone control. LOGOS is text-first.

## Buttons

Primary:

```text
contained
height: 40 px
font size: 14 px
padding: 16 px horizontal
disableElevation: true
```

Secondary:

```text
outlined
height: 40 px
```

Low emphasis:

```text
text
```

## Cards

Do not use statistic cards at the top of Home.

Home project cards:

```text
desktop width: 352–360 px
min height: 156 px
padding: 20 px
radius: 12 px
gap: 16 px
```

Three cards:

```text
352 + 16 + 352 + 16 + 352 = 1088 px
```

fits inside 1120 px.

At medium widths: 2 columns.

At mobile: 1 column, width 100%.

## Color system

Brand colors are not final yet. Use semantic tokens so the brand palette can be replaced later.

Temporary warm accent only:

```text
accent.main  #B87945
accent.light #D3A67B
accent.dark  #8C5630
```

### Dark theme

```text
background.default #0F0E0D
background.paper   #171514
surface.elevated   #1D1B19
divider            #34302C

text.primary       #F4F0EA
text.secondary     #B8B1A8
text.disabled      #746E68

success #6FBF8A
warning #D6A85E
error   #D97878
info    #7FA7C7
```

### Light theme

```text
background.default #F5F2ED
background.paper   #FFFDF9
surface.elevated   #FFFFFF
divider            #DDD7CF

text.primary       #211E1B
text.secondary     #655F59
text.disabled      #9B948C

success #3F7D55
warning #916D2D
error   #A64B4B
info    #4E6F8D
```

Do not use pure black/white for large surfaces.

Do not use low-opacity gray text for important information.

Do not use opacity 0.2 on semantic text/icons.

## Theme architecture

Create:

```text
apps/web/src/theme/tokens.ts
apps/web/src/theme/theme.ts
apps/web/src/theme/ThemeRegistry.tsx
```

One global ThemeProvider owns the theme.

Do not let Home manage its own theme.

Dark is default. Light is fully designed, not just an inverted background.

## Home

Purpose:

> What are we working on?

Order:

```text
Greeting
Command input
Continue Working
Needs Attention
Recent
```

Content width:

```text
1120 px
```

Greeting:

```text
32 px / 600
```

Second line:

```text
20 px / 400
```

Command box:

```text
max width: 760 px
min height: 104 px
```

Placeholder:

> Continue a project, ask a question, or tell LOGOS what to do…

Use real data or an honest empty state.

Remove:
- mockStats
- mockProjects
- fake activity
- fake progress
- system-status chip
- large rocket icon
- gradient title
- microphone/voice UI
- mock quick-action cards

## Continue Working

Maximum three project cards above the fold.

Each card displays exactly:

```text
project name
short description
last meaningful activity
next action
```

Example:

```text
DROP 002
Brand project

Council discussion about scarcity
Next: Review decision
```

No fake progress percentage.

## Needs Attention

Only render when real items exist.

Compact row/card:

```text
title
one-sentence explanation
one action
```

Example:

```text
DROP 002
A council decision has not been applied to the project notes.

Review
```

Do not use giant filled Alert banners for ordinary attention items.

## Recent

Maximum 8 Home items.

Each row:

```text
18 px icon
description
secondary context
time
```

Row height:

```text
56–64 px
```

## Chat

Conversation is dominant.

Chat content:

```text
max width: 840 px
```

Composer:

```text
min height: 56 px
max height: 180 px
```

Context appears only when useful.

A context drawer may show:

```text
3 sources
1 council session
4 memories
```

Consequential actions use an explicit approval surface:

```text
LOGOS proposes

Files:
DROP 002.md
scarcity.md

Changes:
...

Review changes
Approve
Cancel
```

## Work

Work is a custom LOGOS workspace, not a copy of another productivity app.

Project sections:

```text
Overview
Tasks
Decisions
Documents
Memory
People
Councils
Activity
```

A project connects these objects.

## Vault

Vault is not a generic filesystem browser.

Only meaningful Markdown knowledge is surfaced.

Categories:

```text
Projects
Knowledge
Memory
Councils
People
Decisions
Research
Documents
```

Desktop layout:

```text
left: 200 px
middle: 320 px
right: remaining
```

Right preview minimum:

```text
420 px
```

Show relationships such as:

```text
Project
Decision
Council
Memory
People
```

Hide raw Windows paths by default.

## Memory

Question:

> What does LOGOS remember?

Display:
- search,
- recent memories,
- project memories,
- decisions,
- personal context,
- knowledge.

Advanced details:
- source,
- confidence,
- created,
- updated,
- status,
- related documents,
- related project.

## People

Groups:

```text
You
LOGOS
Agents
Personas
Councils
```

Agent cards:

```text
name
purpose
status
scope
```

Never display invented activity.

## Councils

Council page:

```text
purpose
roster
current session
past sessions
decisions
```

Session page:

```text
topic
participants
arguments
disagreements
evidence
synthesis
decision
actions
```

## Automations

Show:

```text
name
trigger
schedule
status
last run
next run
```

Do not list integrations that do not exist.

## System

System is the technical dashboard.

Allowed:

```text
API health
database
document index
retrieval backend
embedding backend
SSE
runtime
logs
configuration
developer information
```

Still use MUI.

## Settings

User-facing:

```text
Appearance
Workspace
Memory
Notifications
Permissions
Automations
Integrations
```

Do not expose raw API URLs as the main settings experience.

## Responsive behavior

At <900 px:
- navigation becomes a drawer,
- project cards use 2 columns when possible,
- context panel becomes a drawer,
- vault preview can become a drawer/route.

At <600 px:
- one column,
- 16 px page padding,
- full-width cards,
- no horizontal page scrolling.

## Core UI rule

Normal UI answers:

> What matters?

System UI answers:

> How does the machine work?
