# LOGOS — Audit of `p0.3-prisma-sqlite-filesystem`

## Verdict

**Do not continue directly to P0.4.**

The branch is materially improved, but it needs a corrective `P0.3.1` foundation-alignment phase.

## Improvements found

The branch now has:
- document identity and document event tables,
- writer identity,
- Markdown-only watcher filtering,
- file-size protection,
- Map-based SSE client tracking,
- lightweight SSE payloads,
- reconciliation,
- vector ID mapping,
- JavaScript cosine-search fallback,
- multiple UI routes,
- initial LOGOS navigation shell,
- Hermes direction documents.

## Blocking findings

### 1. Runtime databases are committed

The tree contains checked-in `.db`, `.db-wal`, and `.db-shm` files under multiple locations.

Delete them from source control and ignore runtime database artifacts.

### 2. Database path is still coupled to source layout

`apps/api/src/db/index.ts` derives the database from `__dirname`.

Use an explicit `LOGOS_HOME` and place the database at:

```text
LOGOS_HOME/system/logos.db
```

### 3. Document identity is still path-derived

`generateDocumentId(path)` hashes the path.

That means rename changes identity.

Use a stable UUID as document identity and keep path mutable.

### 4. Reconciliation does not actually detect conflicts

The current implementation contains a hard-coded `conflicts = 0`.

That is not conflict detection.

Conflict must compare an expected base version/hash against the current state.

### 5. Rename/move is not truly implemented

The event types exist, but watcher behavior still produces add/change/unlink. Implement deterministic pending-delete + matching-add detection, and only claim rename when evidence supports it.

### 6. Vector search is a full table scan

The current fallback loads every embedding row and computes cosine similarity in JavaScript.

That is acceptable only as a small fallback. Make the retrieval backend explicit and introduce a provider abstraction.

### 7. Memory/event boundaries are still incomplete

Document changes should create document events. They should not automatically become full episodic memories.

Use:

```text
file change
-> document event
-> index update
-> optional diff
-> memory evaluation
-> promotion only when justified
```

### 8. API is still a giant raw HTTP application

`apps/api/src/index.ts` mixes:
- server bootstrap,
- watcher,
- SSE,
- routing,
- file writes,
- reconciliation,
- database access,
- system telemetry,
- logging.

Split responsibilities. Use one actual server architecture.

### 9. Configuration still uses ORION names

`.env.example` still contains `ORION_HOME`, `ORION_WORKSPACE_ROOT`, `ORION_API_URL`, and ORION model variables.

Rename to LOGOS configuration.

### 10. UI contains fake data

`home/page.tsx` still contains mock statistics, mock projects, mock recent activity, and fake progress.

Remove it. Use real data or explicit empty states.

### 11. UI still contains voice controls

`HomeClient.tsx` has `Mic`, `isListening`, and a voice-input handler.

Remove them. LOGOS is text-first.

### 12. Multiple Home implementations exist

There are overlapping Home entry points/components.

Choose one canonical Home route.

### 13. Purple/indigo gradients are still used

The current shell uses purple/indigo gradients and hard-coded colors.

This does not match the agreed LOGOS visual direction.

### 14. Theme state is fragmented

The Shell creates a theme, while Home separately attempts to manage light/dark mode.

Use one global theme provider and one theme preference.

### 15. Text/contrast problems are real

Multiple pages use hard-coded colors, opacity, and raw HTML. This explains the reported unreadable text.

All semantic colors must come from centralized light/dark theme tokens.

### 16. System page bypasses MUI

`system/page.tsx` uses raw HTML and inline styles.

Use MUI v9 consistently.

### 17. Web dependencies are inconsistent

Current web package mixes Next 16, React 19, React type packages 18, and `eslint-config-next` 14.

Normalize the toolchain.

### 18. Backup source is committed

Remove `apps/web/app/work/page.tsx.bak`.

### 19. Test artifacts are committed inside the vault

Files such as `agent-write-test.md`, `conflict-test.md`, and `sse-test2.md` belong in test fixtures, not the product vault.

### 20. Port configuration disagrees

`.env.example` says port 4000 while the API source defaults to 3001.

Use one source of truth.

## Alignment scorecard

```text
Foundation          PARTIALLY ALIGNED
Database            NEEDS CONSOLIDATION
Filesystem          IMPROVED / NEEDS HARDENING
Memory              PARTIALLY ALIGNED
Context Engine      NOT YET A REAL CONTEXT ENGINE
Vault Sync          IN PROGRESS
UI shell            PARTIALLY ALIGNED
UI product          NOT ALIGNED YET
Roadmap identity    NEEDS CLEANUP
```

Decision:

```text
DO NOT -> p0.4-vault-sync
DO     -> p0.3.1-foundation-alignment
THEN   -> p0.4-vault-sync
