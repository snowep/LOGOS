# LOGOS — Hermes Agent Master Directive

## Purpose

This document is the top-level instruction for Hermes Agent working on the LOGOS repository.

Repository:
- GitHub: `snowep/LOGOS`
- Current development line: `p0.2-context-engine`
- Product name: **LOGOS**

LOGOS is a persistent, text-first personal AI assistant and digital command center.
It is not merely a chatbot, not merely a memory database, and not merely an automation engine.

The core product goal is:

> **Understand the user's world well enough to act within it intelligently.**

The fundamental operating loop is:

> **Understand → Contextualize → Plan → Authorize → Delegate → Execute → Verify → Persist → Report → Learn**

The system must preserve this identity throughout implementation.

---

## Non-Negotiable Product Principles

1. LOGOS is the primary intelligence and coordinator.
2. Subagents are specialists managed by LOGOS, not replacements for LOGOS.
3. Councils are structured multi-perspective reasoning groups.
4. The Obsidian vault is human-readable persistent knowledge, not the entire runtime database.
5. SQLite is system state/storage; Markdown is human-readable knowledge/artifacts.
6. Retrieval and context assembly are different responsibilities.
7. Memory is not the same thing as file history.
8. File changes must not automatically become durable memories.
9. Consequential actions follow the constitutional model:
   **LOGOS proposes → user approves → LOGOS executes → LOGOS verifies.**
10. LOGOS must never claim success without evidence that the intended result actually happened.
11. Technical internals must exist, but normal UI must not force the user to see them.
12. LOGOS is text-first. Voice and vision are not required capabilities.
13. Prefer simple, inspectable, local-first architecture where practical.
14. Do not accumulate architecture merely because a feature can be added. Remove contradictions.
15. Do not preserve bad code merely because it already exists. Deletion/replacement is allowed.

---

## Current Development Rule

P0.1–P0.3 have substantial implementation work already present, but they are **not considered fully closed until architecture consolidation passes the entry gate defined in `01_ARCHITECTURE_CONSOLIDATION_GATE.md`.**

Do not extend an inconsistent foundation merely to increase the phase number.

Before continuing substantial P0.4 work, stabilize the architecture.

---

## Technical Constraints

- TypeScript/TSX is preferred.
- Python is not used.
- React + Next.js for the web application.
- Node.js for backend/runtime services.
- Material UI v9 as the UI component foundation.
- Use official MUI components rather than creating a large custom design system.
- SQLite + `better-sqlite3` is the preferred canonical system database direction.
- `sqlite-vec` may be used for vector retrieval.
- The vault is local Markdown/Obsidian content.
- Avoid hard-coded machine paths.
- Avoid hard-coded localhost ports in application components.
- Configuration belongs in a coherent runtime configuration layer.

---

## What Hermes Must NOT Do

Do not:

- continue expanding the old dashboard UI without redesigning it according to the UI specification;
- keep multiple competing database architectures alive;
- keep an unused Prisma schema as a supposed source of truth while runtime uses a separate schema;
- treat JSON/Map storage as SQLite;
- call an endpoint successful when it only broadcasts an event but does not perform the requested operation;
- treat rapid file edits as proof of a conflict;
- store complete file contents as episodic memory on every watcher event;
- expose internal hashes, runtime metrics, ports, filesystem paths, or model plumbing on the normal Home screen;
- invent product state such as active agents, integrations, metrics, or roadmap completion that is not backed by runtime data;
- silently grant permissions to itself or to subagents;
- silently change safety or authorization rules while implementing features.

---

## Working Method

For each meaningful implementation change:

1. Inspect current code and current branch state first.
2. Identify whether the change improves or worsens architectural coherence.
3. Prefer deleting contradictory code over adding adapters around it.
4. Implement the smallest coherent design.
5. Add/update tests.
6. Run typecheck, lint, build, and relevant tests.
7. Verify behavior rather than trusting a successful process exit alone.
8. Update documentation when the architecture changes.
9. Report exactly what changed and what remains incomplete.

Never report a feature as complete merely because files compile.

---

## Definition of Done

A change is complete only when:

- the intended behavior exists;
- the data model is coherent;
- authorization is correct for the operation;
- failures are explicit;
- the operation can be verified;
- tests cover meaningful failure paths;
- the UI does not falsely imply unsupported capabilities;
- documentation matches the implementation.

---

## Priority Order

When trade-offs are necessary, prioritize:

1. correctness
2. data integrity
3. authorization/safety
4. architectural coherence
5. verifiability
6. maintainability
7. user experience
8. visual polish

Do not sacrifice the first six for speed of feature accumulation.
