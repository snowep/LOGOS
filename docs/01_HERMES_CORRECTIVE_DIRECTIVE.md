# LOGOS — Hermes Agent Directive: P0.4.1 Vault Sync Hardening

## Mission

Take the existing `p0.4-vault-sync` implementation and make it reliable enough to serve as the real Markdown synchronization foundation for LOGOS.

Do not add P0.5 Context Engine features.

Do not invent project/agent/council functionality that belongs to later phases.

Do not preserve broken code merely because it already exists.

Branch:

```text
p0.4.1-vault-sync-hardening
```

Base:

```text
p0.4-vault-sync
```

---

## Non-negotiable truths

1. SQLite stores runtime state; Markdown files remain real files in the configured vault.
2. A successful LOGOS write must change the real file.
3. A write is not successful until the resulting file hash has been verified.
4. A rename/move is only a rename/move when identity evidence supports it.
5. A deletion is not confirmed until the pending rename window expires.
6. A conflict must return `409` and must not partially mutate state.
7. Document history must survive deletion.
8. Writer identity must come from server-side execution context.
9. Browser UI must not fabricate projects, statuses, metrics, or actions.
10. P0.4 must not start P0.5 until the acceptance matrix passes.

---

# Part A — Document service

## Create

Implement:

```ts
createDocument()
```

Behavior:

1. Validate the relative path.
2. Confirm `.md` or `.markdown` extension.
3. Reject ignored locations.
4. Enforce the 10 MB limit.
5. Check for an existing document at that path.
6. Write the real file atomically.
7. Read/hash the resulting file.
8. Create a stable UUID document record.
9. Record one `created` document event.
10. Return the verified document state.

A create request must not require fake expected version/hash values when the file does not exist.

## Update

Implement:

```ts
updateDocument()
```

Inputs:

```text
id
content
expectedVersion
expectedHash
actor
```

Order:

```text
load document
 -> verify expected DB version/hash
 -> resolve safe filesystem path
 -> hash/check current file state
 -> if mismatch: 409, no mutation
 -> atomically write file
 -> re-read and hash final file
 -> update DB version
 -> record modified event
 -> return verified state
```

Version increments exactly once for a real content change.

If the incoming hash equals the current hash, do not create a new version.

## Delete

Implement:

```ts
deleteDocument()
```

Require expected version/hash.

Order:

```text
load document
 -> verify expected state
 -> atomically remove file
 -> mark document deleted
 -> record deleted event
```

Do not hard-delete the document row.

---

# Part B — Document state model

Change the document model to support tombstones.

Preferred shape:

```text
documents
- id
- path
- current_hash
- version
- created_at
- updated_at
- deleted_at nullable
- last_writer
- size
- mime_type
```

Document events must remain queryable after deletion.

Remove `ON DELETE CASCADE` from document event history.

Do not destroy history to make the current-state table smaller.

---

# Part C — Filesystem safety

Keep one canonical safe-path implementation.

Required properties:

- reject POSIX absolute paths,
- reject Windows drive paths,
- reject UNC paths,
- reject `../` and `..\\`,
- reject symlink/junction escapes,
- prove containment before creating parent directories,
- normalize separators consistently,
- never trust a browser-supplied absolute path.

The API must resolve paths from the configured vault root.

Do not allow `DB_PATH` or another environment variable to silently move the canonical database outside the expected LOGOS runtime layout unless that override is explicitly documented and intended.

---

# Part D — Watcher

Refactor `apps/api/src/services/watcher.ts` into a deterministic state machine.

## Events

Handle only:

```text
add
change
unlink
```

for supported Markdown files.

## Add/change

1. verify file exists,
2. verify size,
3. read content,
4. calculate hash,
5. identify actor if this was a LOGOS/agent/automation operation,
6. compare with known document state,
7. no-op when hash is unchanged,
8. otherwise update state and record one event.

## Unlink

Do not immediately emit `deleted`.

Store:

```text
pendingDeleteId
path
hash
seenAt
```

Then wait the bounded rename window.

If a matching add appears:

```text
same directory -> renamed
new directory  -> moved
```

Update the existing document ID.

Record one event.

If no match appears after the window:

```text
deleted
```

Record and publish the confirmed deletion.

Clear pending state after resolution.

## Repeated watcher events

A repeated event with the same path + hash is not a new modification.

Do not increment document version for duplicate events.

## Lifecycle

`startWatcher()` must not create multiple live watchers.

`stopWatcher()` must:

- close the watcher,
- clear timers,
- clear pending rename/delete state,
- clear operation-registration state.

---

# Part E — Reconciliation

Refactor `apps/api/src/services/reconcile.ts`.

## Full reconcile

The full vault is the comparison scope.

## Scoped reconcile

If a relative subpath is supplied:

```text
compare only that subtree
```

Never delete/mark missing documents outside the subtree.

## Eligibility

Use the exact same eligibility rules as the watcher:

- `.md`
- `.markdown`
- ignore node_modules,
- ignore dotfiles/directories that are not part of the supported vault model,
- ignore temp files,
- ignore backups,
- ignore logs,
- ignore databases,
- enforce max file size.

## Idempotence

No changes:

```text
created 0
updated 0
deleted 0
renamed 0
conflicts 0
```

Running the same reconcile twice must not create a second modification event.

## Rename detection

Do not use a single global `getDocumentByHash()` result as sufficient evidence.

Correct approach:

```text
candidate file has no row at current path
 -> identify missing prior document candidate(s)
 -> require unique identity evidence
 -> if exactly one valid candidate: rename/move
 -> otherwise: create new document
```

Identical-content duplicates must remain distinct documents.

## Error handling

Do not convert permission/read/stat errors into deletion.

Return an explicit failed/partial reconciliation result when the scan cannot be trusted.

---

# Part F — Concurrency

Define one canonical compare-and-swap rule.

A write request is based on:

```text
expectedVersion
expectedHash
```

The server must verify both against the current state before mutating the file.

On mismatch:

```http
409 Conflict
```

Response should include:

```text
currentVersion
currentHash
expectedVersion
expectedHash
```

No file mutation.

No DB mutation.

No event.

Add a test that proves the conflict remains safe even when the live file changes between the initial read and the attempted write.

---

# Part G — Writer identity

Remove writer authority from public JSON bodies.

The server creates the actor context.

Use:

```text
USER
LOGOS
AGENT
AUTOMATION
```

as internal actor values.

A public HTTP body may request an operation, but cannot self-declare its identity.

---

# Part H — SSE

Keep event payloads lightweight.

Required payload:

```json
{
  "documentId": "...",
  "event": "modified",
  "path": "projects/drop-002.md",
  "version": 8,
  "hash": "...",
  "writer": "USER"
}
```

Do not put full Markdown content into SSE.

Implement browser consumption:

```text
EventSource('/api/vault/events')
 -> connection state
 -> event handler
 -> invalidate/refetch documents
```

Use the browser's EventSource reconnect behavior rather than implementing a second custom transport.

---

# Part I — API boundary

Keep the Express architecture simple:

```text
server
 -> middleware
 -> routes
 -> document/vault service
 -> repositories/db
```

Do not have routes perform raw SQL for core document workflows.

Move document mutations into a service layer.

Keep repositories focused on persistence.

---

# Part J — Security boundary

Default the API to local-only operation.

Use:

```text
HOST=127.0.0.1
```

unless the user explicitly configures a different bind address.

Do not leave wildcard CORS as the unqualified production default.

If direct API exposure is supported, require authentication for mutations.

The available API-key middleware must either be integrated or explicitly scoped as future-only with the API bound to localhost.

---

# Part K — Configuration cleanup

Replace machine-specific example values.

`.env.example` should contain:

```text
LOGOS_HOME=~/.logos
LOGOS_WORKSPACE_ROOT=
LOGOS_API_URL=http://127.0.0.1:3001
PORT=3001
HOST=127.0.0.1
```

Do not put:

```text
D:\Project\...
```

into product UI or canonical source configuration examples.

Remove `NEXT_PUBLIC_API_URL` unless the browser genuinely requires it.

Prefer same-origin browser requests through Next route handlers.

Replace hardcoded `localhost:3001` rewrites with server configuration or remove unnecessary rewrites.

---

# Part L — Remove stale competing architecture

Before finishing the branch:

- remove unused Prisma configuration/dependencies,
- consolidate duplicate Zod schemas,
- remove or replace the weaker `packages/core/src/filesystem.ts`,
- align `packages/contracts` with the real P0.4 event schema,
- remove obsolete ORION/JARVIS references,
- update phase metadata to reflect P0.4.1.

Do not leave obsolete abstractions active merely because they compile.

---

# Part M — Required regression tests

Add integration coverage for:

```text
create markdown
modify markdown
unchanged markdown no-op
delete markdown
rename markdown
move markdown
ambiguous identical-content duplicate
rapid repeated edits
ignore non-markdown
ignore .bak
ignore .db
ignore node_modules
reject >10MB
LOGOS write reaches filesystem
AGENT write reaches filesystem
AUTOMATION write reaches filesystem
stale expected version -> 409
wrong expected hash -> 409
file changed during write -> 409
scoped reconcile does not touch sibling folders
full reconcile idempotence
reconcile rename
reconcile duplicate-content create
reconcile read error does not delete document
SSE connect
SSE event
SSE close/reconnect
API restart
API start from another cwd
```

Use temporary fixture directories and databases.

Do not place test files in the real product vault.

---

# Part N — Verification

Run:

```text
npm ci
npm run typecheck
npm run lint
npm run build
npm test
```

Also run the manual acceptance matrix in `02_ACCEPTANCE_TEST_MATRIX.md`.

Do not state "all gates pass" unless the commands were actually run in this branch.

---

# Hermes completion format

Return exactly:

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

Do not hide unresolved risks.
