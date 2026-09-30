# LOGOS — Hermes Implementation Order

## Objective

Bring the repository from its current mixed foundation to a coherent P0.4-ready state, then implement the redesigned UI without reintroducing architectural contradictions.

---

## Phase A — Freeze Feature Expansion

Do not add new councils, automation engines, subagent frameworks, or major AI orchestration features while the storage/sync foundation remains contradictory.

---

## Phase B — Consolidate Storage

1. Choose SQLite + better-sqlite3 + sqlite-vec as canonical runtime persistence.
2. Remove or retire the fake JSON `SimpleSqliteDatabase`.
3. Remove unused Prisma architecture if it is not going to be the runtime authority.
4. Establish migrations/schema initialization in one place.
5. Establish repositories/services around the canonical schema.
6. Ensure application IDs and vector IDs are safely mapped.

Verification:

- clean database initialization;
- restart preserves state;
- reads and writes use the same database;
- no second database implementation is silently active.

---

## Phase C — Establish Document Identity and Versioning

1. Create document identity.
2. Track path + hash + version + writer.
3. Support rename/move without changing logical identity.
4. Implement robust path safety.

Verification:

- create;
- edit;
- rename;
- delete;
- restart;
- stale-write conflict.

---

## Phase D — Implement Real P0.4 Synchronization

1. Normalize watcher events.
2. Restrict watcher scope.
3. Persist document events.
4. Detect real conflicts using expected base version/hash.
5. Distinguish USER/LOGOS/AGENT/AUTOMATION writers.
6. Prevent self-write loops.
7. Implement real manual reconciliation.
8. Emit lightweight SSE notifications.
9. Verify SSE reconnect/disconnect lifecycle.

---

## Phase E — Correct Memory Boundary

1. File event is an event.
2. Memory promotion is a separate decision.
3. Preserve provenance.
4. Preserve confidence/status.
5. Do not duplicate entire files as memories on ordinary edits.
6. Fix procedural-memory embedding construction.

---

## Phase F — API Coherence

1. Use one actual server architecture.
2. Mount actual routes.
3. Apply validation.
4. Enforce auth/permissions in the runtime path.
5. Normalize configuration and ports.
6. Avoid returning raw internal errors as the public contract.

---

## Phase G — Replace the UI

Delete/replace the current Home dashboard rather than polishing it.

Implement in this order:

1. application shell
2. collapsed/expanded navigation
3. Home
4. Chat
5. Work
6. Vault
7. Memory
8. People
9. Automations
10. Settings
11. System/Developer

Use `03_UI_PRODUCT_SPEC.md` as the source of truth.

---

## Phase H — Verification

Run:

```text
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
```

Also perform manual UI verification:

- desktop;
- narrow desktop/tablet;
- mobile;
- empty data;
- active data;
- loading;
- working;
- success;
- conflict;
- error;
- disconnected watcher.

---

## Final Reporting Format

When done, Hermes should report:

```text
Implemented
- ...

Fixed
- ...

Removed
- ...

Verified
- typecheck
- lint
- tests
- build

Remaining limitations
- ...
```

Do not claim complete if any required verification is missing.
