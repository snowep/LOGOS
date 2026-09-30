# LOGOS — Architecture Consolidation Gate Before P0.4

## Status

**BLOCKING GATE**

Substantial P0.4 work must not proceed until the issues in this document are resolved or explicitly documented as intentionally deferred with a safe reason.

---

## 1. Canonical Storage Architecture

There must be one runtime database architecture.

Preferred direction:

```text
LOGOS Runtime
    |
    +-- SQLite (`better-sqlite3`)
    |
    +-- sqlite-vec for vectors
    |
    +-- filesystem for Markdown/artifacts
```

Do not maintain all of these simultaneously as competing runtime authorities:

- Prisma domain schema
- standalone better-sqlite3 schema
- JSON-backed `Map` implementation called `SimpleSqliteDatabase`

### Required result

Delete or retire the fake JSON database implementation in `packages/core/src/db.ts`.

Do not describe JSON persistence as SQLite.

If Prisma is not the runtime authority, remove the unused Prisma architecture rather than maintaining a misleading second domain model.

---

## 2. Domain State Must Have One Owner

System entities must eventually have one authoritative persistence model.

The runtime architecture should be capable of representing, at minimum, coherent identifiers/relationships for:

- projects
- documents
- tasks
- decisions
- memories
- people/personas
- agents/managers
- councils
- council sessions
- events
- permissions/approvals

Do not define a large entity model in an unused schema and then implement a separate unrelated runtime schema.

---

## 3. Document Identity

Every important Markdown document must have a stable system identity independent of path.

Minimum conceptual fields:

```text
document.id
document.path
document.current_hash
document.version
document.created_at
document.updated_at
document.last_writer
```

This identity is required for:

- rename/move detection
- history
- conflict detection
- relationships
- provenance
- memory references

A path alone is not a sufficient identity.

---

## 4. Writer Identity

File operations must carry a source/writer identity.

Minimum categories:

```text
USER
LOGOS
AGENT
AUTOMATION
```

A richer identity can be layered above these categories.

This allows LOGOS to distinguish its own writes from external user changes and delegated agent changes.

---

## 5. Safe File Writes

A LOGOS write should be based on an expected document version/hash.

Conceptual flow:

```text
read document
    ↓
remember expected base hash/version
    ↓
prepare change
    ↓
authorize
    ↓
verify current base still matches
    ↓
write atomically
    ↓
verify resulting file
```

If the base changed unexpectedly, treat it as a real conflict.

---

## 6. Conflict Detection

The current concept of “two changes within one second” is not a sufficient conflict model.

Do not define concurrent editing solely from elapsed time.

Conflict should be based on state/version mismatch.

Example:

```text
LOGOS planned from hash A
current file is still hash A
→ safe to write
```

versus:

```text
LOGOS planned from hash A
current file is now hash B
→ conflict
```

Preserve conflict metadata so a human can understand what happened.

---

## 7. Vault Watcher Scope

Watcher behavior must be explicit.

At minimum:

- watch intended Markdown files rather than arbitrary binary files;
- ignore temporary/system files where appropriate;
- enforce practical file-size safeguards;
- normalize relative paths consistently;
- handle create/change/delete;
- model rename/move where possible;
- avoid recursive event loops caused by LOGOS writing its own changes.

---

## 8. Event vs Memory

A filesystem event is not automatically a memory.

Correct conceptual pipeline:

```text
filesystem event
    ↓
document event
    ↓
document index update
    ↓
optional diff
    ↓
meaning/importance evaluation
    ↓
possible memory promotion
```

Do not write the entire file into episodic memory every time the watcher sees a change.

Autosaves and normal editing must not generate huge repeated memories.

---

## 9. Vector Identity

Do not use UUID strings as implicit integer sqlite-vec rowids.

Use an explicit vector-key design that is compatible with sqlite-vec semantics, or maintain a robust mapping between application UUIDs and vector row identifiers.

The application ID and vector-storage ID may be different, but the mapping must be deterministic and integrity-safe.

---

## 10. Procedural Embedding Bug

Fix the procedural-memory embedding source string.

The current implementation escapes template interpolation, causing literal placeholder text instead of actual memory values.

The embedding must be generated from the real content, conceptually:

```ts
`${memory.name} ${memory.description || ''} ${memory.steps} ${memory.triggers || ''}`
```

---

## 11. API Architecture

There must be one real HTTP server architecture.

Do not keep:

- Express routers that are never mounted;
- a separate raw HTTP router duplicating endpoint logic.

Prefer one server stack with mounted routes, middleware, validation, auth, and error handling in one coherent path.

---

## 12. API Validation

Request inputs must be validated and bounded.

At minimum protect:

- limits
- thresholds
- IDs
- paths
- request bodies
- query parameters

Reject invalid values instead of allowing `NaN`, negative limits, unbounded queries, or malformed paths into the core services.

Use typed schemas where practical.

---

## 13. Authentication and Authorization

Auth code existing in a repository is not enough.

The actual runtime request path must enforce the intended permissions.

Important operations should have explicit authorization checks, especially:

- file writes
- deletes
- external communications
- sensitive data access
- automation
- agent actions
- system modifications

Follow the constitutional rule:

> LOGOS proposes → user approves → LOGOS executes → LOGOS verifies.

Do not let UI approval be the only place where this boundary exists.

---

## 14. Filesystem Security

The filesystem adapter must defend against:

- `..` traversal
- absolute-path bypasses
- prefix-based containment bypasses
- symlink escapes where applicable
- unintended write locations

Use robust `relative()`-based containment or equivalent rather than relying only on string prefix checks.

---

## 15. SSE Correctness

Client lifecycle must be correct.

Do not attempt to delete a stored client from a `Set` by constructing a new object with the same fields.

Store/retrieve the actual reference or use a `Map` keyed by client ID.

SSE should communicate lightweight metadata, not complete document contents.

Suggested payload:

```text
documentId
path
event
version
hash
timestamp
writer
```

The client can fetch document data when needed.

---

## 16. Manual Sync

A control labelled `Sync Now` must perform actual synchronization/reconciliation.

If the system cannot currently implement real manual reconciliation, remove the control instead of returning a false success state.

---

## 17. Configuration

Replace hard-coded paths and ports.

No UI component should contain a machine-specific path such as:

```text
D:\Project\LOGOS\...
```

The API and web application must use one coherent runtime configuration source.

Avoid having multiple different default ports across components.

---

## 18. ORION → LOGOS Rename

Complete the rename in:

- environment variable names
- documentation
- UI labels
- package metadata where appropriate
- service names where appropriate
- comments/instructions

Do not leave the product internally calling itself ORION unless the reference is explicitly historical.

---

## 19. Web Toolchain

Normalize the web package.

The current package contains mismatched versions for Next.js, React types, and `eslint-config-next`.

Bring the versions into a coherent Next.js/React toolchain and use an appropriate modern lint command for the installed Next version.

---

## 20. CI

Add a CI workflow after consolidation.

Minimum checks:

```text
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
```

The development branch should not rely solely on local claims that all checks pass.

---

## Exit Criteria

The gate is passed only when:

- one canonical DB architecture exists;
- document identity/versioning exists;
- writer identity exists;
- conflict semantics are real;
- watcher behavior is bounded;
- vault events are not automatically durable memories;
- vector IDs are correct;
- procedural embeddings are correct;
- one API server handles routes;
- auth is enforced in the actual runtime path;
- filesystem containment is robust;
- SSE lifecycle is correct;
- `Sync Now` is truthful;
- configuration is centralized;
- ORION references are cleaned up;
- web dependencies are coherent;
- CI verifies the repository.
