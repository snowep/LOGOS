# LOGOS — UI Acceptance Checklist

Use this checklist before declaring the redesigned UI complete.

## Global

- [ ] The app is recognizably LOGOS, not ORION.
- [ ] The theme is dark.
- [ ] The visual tone is warm and welcoming without being decorative or childish.
- [ ] The UI feels minimal and Apple-like in restraint.
- [ ] The interface does not look like an enterprise monitoring dashboard.
- [ ] There are no fake metrics.
- [ ] There are no unsupported feature claims.
- [ ] There are no hard-coded Windows paths in normal UI.
- [ ] There are no hard-coded API URLs in UI components.
- [ ] Brand colors are represented through semantic tokens so the final palette can be inserted later.

## Navigation

- [ ] Sidebar starts collapsed on desktop.
- [ ] Sidebar can expand.
- [ ] Navigation labels are exactly understandable.
- [ ] Current page is obvious.
- [ ] Mobile navigation uses a drawer.

## Home

- [ ] Greeting + “What are we working on?” is the primary opening.
- [ ] Main command input is the dominant control.
- [ ] Continue Working shows active projects.
- [ ] Needs Attention appears only when relevant.
- [ ] Recent activity is human-readable.
- [ ] Development roadmap is not the main Home content.
- [ ] Raw telemetry is absent from Home.

## Chat

- [ ] Conversation is primary.
- [ ] Context panel is hidden until useful.
- [ ] Sources can be inspected.
- [ ] Context is described in human language.
- [ ] Consequential actions show meaningful proposed changes.
- [ ] Approve/Cancel boundaries are clear.

## Work

- [ ] Projects are connected objects, not isolated cards.
- [ ] Tasks, decisions, documents, memory, people, councils, and activity can connect to a project.
- [ ] Important decisions are visible as first-class information.

## Vault

- [ ] Vault is not a generic filesystem browser.
- [ ] Important Markdown files are surfaced.
- [ ] Relationships between documents and system objects are visible.
- [ ] LOGOS actions are available contextually.
- [ ] Destructive actions require appropriate authorization.

## Memory

- [ ] The screen asks what LOGOS remembers rather than forcing database terminology.
- [ ] Memory is highly inspectable.
- [ ] Provenance is visible.
- [ ] Confidence/status can be inspected.
- [ ] Underlying memory types are available in advanced detail.

## People / Agents / Councils

- [ ] Agents feel like identities with clear operational responsibilities.
- [ ] Permissions are inspectable.
- [ ] Councils show their purpose and members.
- [ ] Council sessions show arguments and disagreements, not only a final answer.

## Automations

- [ ] Trigger, scope, actions, permissions, and history are inspectable.
- [ ] Automation state is based on real runtime data.

## System

- [ ] Technical metrics have moved here.
- [ ] Runtime information is real, not invented.
- [ ] Developer roadmap is here, not on Home.
- [ ] Storage/retrieval/event information is available here.

## MUI

- [ ] Official MUI components are used wherever practical.
- [ ] No unnecessary custom component framework has been created.
- [ ] Components are used semantically rather than as decorative boxes.

## Final Product Test

A first-time user should be able to answer immediately:

> What can I ask LOGOS to do?

A returning user should be able to answer immediately:

> What were we working on?

A technical user should be able to answer, by opening System:

> What is the system actually doing?

If any of these three answers requires reading source code, the UI hierarchy is not finished.
