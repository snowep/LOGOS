# LOGOS — Hermes Agent Corrective Directive
# P0.4.1 Vault Sync Hardening — Final Integrity Pass

## Mission

Take the current branch:

```text
p0.4.1-vault-sync-hardening
```

and finish the vault synchronization layer so that the filesystem, SQLite state, event history, actor identity, and browser synchronization semantics agree.

Do not start P0.5 Context Engine work.

Do not invent P1.0 projects, P0.8 agents, or P0.9 councils.

Do not preserve broken code merely because it already exists.

---

# 1. Core invariants

These rules are non-negotiable:

1. Markdown files are real files on disk.
2. SQLite is canonical runtime state for document identity/history, not a substitute for the file itself.
3. A successful document write must change the real file and verify its final hash.
4. A stale expected version/hash returns `409` and causes no mutation.
5. A missing live file for an active document is a conflict for update operations.
6. A create operation never overwrites an existing file.
7. A confirmed deletion creates a tombstone; it never destroys document history.
8. Rename/move preserves the original document ID only when evidence is unambiguous.
9. Duplicate-content files remain distinct unless identity evidence proves they are the same document.
10. Repeated path+hash watcher notifications are no-ops.
11. Writer identity comes from server-side actor context.
12. SSE producer and consumer event names must match exactly.
13. Browser UI never claims an action is implemented when it is not.
14. No production UI uses fabricated data.

---

# 2. Refactor document service into the authoritative mutation path

File:

```text
apps/api/src/services/documentService.ts
```

The document service must own create/update/delete semantics.

## 2.1 Create

Required order:

```text
validate relative path
 -> validate supported extension
 -> validate ignore policy
 -> validate UTF-8 byte size <= max
 -> check active document by path
 -> check filesystem path
 -> reject existing path/file without mutation
 -> atomic file write
 -> re-read/hash final file
 -> create or explicitly restore identity
 -> transactionally insert document + created event
 -> broadcast event
 -> return verified state
```

Separate create input from update input. Do not require fake expected version/hash values for a true create.

If a tombstoned identity exists at the same path, choose one explicit policy:

```text
restore same identity
```

or

```text
reject and require explicit restore
```

Do not silently create a second identity.

## 2.2 Update

Input:

```text
id
content
expectedVersion
expectedHash
actor
```

Required order:

```text
load active document
 -> verify DB expectedVersion
 -> verify DB expectedHash
 -> resolve safe path
 -> require file exists
 -> hash current file
 -> compare current file hash to expectedHash
 -> if mismatch: 409, no mutation
 -> atomic write
 -> re-read/hash final file
 -> DB transaction: version + event
 -> broadcast
 -> return verified state
```

Do not accept a missing file as an implicit opportunity to recreate it.

Version increments exactly once for a real hash change.

Same hash is a no-op.

## 2.3 Delete

Input:

```text
id
expectedVersion
expectedHash
actor
```

Required order:

```text
load active document
 -> verify DB expectedVersion/hash
 -> require current file and current hash to match expected state
 -> perform reversible/atomic delete strategy
 -> verify file is absent
 -> DB transaction: deleted_at + deleted event
 -> broadcast
 -> finalize filesystem removal if using trash staging
```

Do not hard-delete the document row.

---

# 3. Transaction and recovery boundary

Use SQLite transactions for:

```text
document row update
+
document event insert
```

Do not allow a success response when the file and DB disagree.

When a filesystem action succeeds but the database transaction fails, attempt an explicit recovery action and surface failure.

For delete, a staging/trash approach is preferred over immediate irreversible unlink.

---

# 4. Centralize document eligibility

Create or extend one authoritative validator for:

```text
.md
.markdown
10 MB maximum by bytes
ignored temp files
ignored backups
ignored logs
ignored databases
ignored node_modules
safe relative path
```

The document service, watcher, and reconciliation must use the same rules.

A public API request must not be able to create `foo.txt` or an oversized UTF-8 file merely because a watcher would ignore it later.

---

# 5. Fix watcher state semantics

File:

```text
apps/api/src/services/watcher.ts
```

## Add/change

```text
stat
 -> size check
 -> read
 -> hash
 -> actor resolution
 -> compare current state
 -> no-op if same hash
 -> mutate document state once
 -> record one event
 -> publish one event
```

## Unlink

```text
store pendingDelete
 -> do not emit delete yet
 -> wait bounded window
 -> matching add?
      yes -> rename/move and clear both states
      no  -> tombstone + deleted event + clear state
```

## Rename/move

Requirements:

- same directory => `renamed`
- different directory => `moved`
- same document ID preserved
- `previous_path` stored
- no transient `deleted` event
- no stale path state left behind

Do not match a tombstoned candidate as an active rename identity.

## Actor recognition

Remove the incorrect unconditional `registerLogosWrite()` behavior from HTTP routes.

Use an internal operation record/token such as:

```text
operationId
documentId
oldPath
newPath
expectedHash
actor
createdAt
```

Only internal LOGOS/AGENT/AUTOMATION operations should be registered as such.

A public HTTP request is `USER`.

---

# 6. Fix reconciliation

File:

```text
apps/api/src/services/reconcile.ts
```

## Full reconcile

Operate across the entire vault.

## Scoped reconcile

If `syncPath` is provided:

```text
only compare paths inside that subtree
```

Never mutate siblings outside the subtree.

## Deletion

Never use:

```sql
DELETE FROM documents
```

for normal vault reconciliation.

Use tombstones.

## Rename/move

Candidates must be active, uniquely identifiable, and not contradicted by another live path.

Identical-content duplicates remain independent documents.

## Errors

Read/stat/permission errors:

```text
skipped / partial / failed
```

Never:

```text
read error -> delete document
```

The reconcile result must distinguish a trustworthy clean scan from a partial scan.

---

# 7. Fix internal service API placement

Do not define document-service APIs in:

```text
apps/api/src/routes/documents.ts
```

Routes translate HTTP requests into service calls.

Internal calls belong under `services/`.

Create a canonical actor context type there:

```text
USER
LOGOS
AGENT
AUTOMATION
```

The internal update helper must use a real document ID or a real path-resolution function. Never pass `id: ''` as an implicit lookup mechanism.

---

# 8. Fix request validation

Use shared Zod schemas for:

```text
document UUID
create input
update input
delete input
reconcile input
```

Delete expected state must be validated through middleware, not `parseInt()` and raw strings in the route handler.

---

# 9. Fix SSE contract

Choose one canonical reconciliation event name:

```text
reconcile-complete
```

Use the same string in:

```text
backend broadcast
shared contract
browser EventSource listener
UI handler
```

Browser flow:

```text
SSE event
 -> invalidate/refetch relevant data
 -> render current API state
```

The EventSource connection must not reconnect merely because normal React component state changes.

Use stable callbacks or refs.

Keep payloads metadata-only.

---

# 10. API security boundary

File:

```text
apps/api/src/server.ts
```

Default remains:

```text
HOST=127.0.0.1
```

Do not leave:

```text
CORS origin = *
```

as the production default.

Use a configured origin or another explicit local security boundary.

Do not claim the API is safe for network exposure unless mutation routes are authenticated.

The existing API-key middleware must either be integrated for direct API access or explicitly documented as future-only while the server is local-only.

---

# 11. Fix the shared filesystem implementation

There must be one canonical safe path implementation.

Do not keep both:

```text
apps/api/src/fs/safePath.ts
packages/core/src/filesystem.ts
```

with materially different security properties.

Use:

```text
normalize
 -> reject absolute paths
 -> reject traversal
 -> resolve against root
 -> path.relative containment check
 -> realpath/junction protection
 -> only then create parent directories
```

Add tests for POSIX, Windows, UNC, traversal, junction/symlink escape, and the root sibling-prefix edge case.

---

# 12. Fix document identity helpers

`getOrCreateDocumentIdentity()` must be idempotent.

Rule:

```text
same path + same hash
 -> same document
 -> same version
 -> no new event
```

A helper named `getOrCreate...` must not manufacture a new semantic modification every time it is called.

---

# 13. Add real integration tests

Do not rely on the old `writeDocument()` tests.

Test the actual new path:

```text
createDocument
updateDocument
deleteDocument
watcher
reconcile
```

Use temporary directories and temporary SQLite databases.

For the live-file race test, introduce a deterministic barrier/hook in test mode rather than depending on timing luck.

---

# 14. Required exact integration cases

Implement tests for all items in:

```text
02_ACCEPTANCE_TEST_MATRIX.md
```

A phase is not complete until all cases pass.

---

# 15. UI corrections

Follow:

```text
03_UI_CORRECTIVE_DIRECTIVE.md
```

Do not add future roadmap functionality merely to make screens look populated.

---

# 16. Repository cleanup

Before declaring completion:

- update phase metadata to P0.4.1,
- remove machine-specific environment examples,
- align shared event contracts,
- remove duplicate filesystem security code,
- normalize web dependency versions,
- restore/retain canonical project direction documents,
- remove stale ORION/JARVIS product references where appropriate,
- do not use fake production fallback data.

---

# 17. Verification

Run these in the actual branch:

```text
npm ci
npm run typecheck
npm run lint
npm run build
npm test
```

Also run the complete manual matrix.

Do not write "all gates pass" unless the commands were actually executed in this branch.

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

If any Severity 1 item remains, return `BLOCKED`.
