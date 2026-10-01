# LOGOS — Current Branch Audit: P0.4.1 Vault Sync Hardening

## Audited branch

```text
p0.4.1-vault-sync-hardening
commit 2763109c530d9c4e53047e78c03c71151451ef08
parent    e0ae32a2981f57ddf59da25e9f6975226be57cb3
```

## Executive result

```text
P0.3.1 foundation             IMPROVED / MOSTLY STABLE
Document service              IMPROVED / IMPORTANT EDGE CASES REMAIN
Document tombstones           PARTIALLY IMPLEMENTED
Watcher                       NOT SAFE ENOUGH
Reconciliation                NOT SAFE ENOUGH
Concurrency                   PARTIAL
Writer identity               PARTIAL / INCORRECT IN CURRENT ROUTING
SSE                           PARTIAL / CONTRACT MISMATCH
Filesystem safety             GOOD IN API PATH CHECK, DUPLICATED IN CORE
Vault UI                      IMPROVED / STILL NOT PRODUCTION-COMPLETE
System UI                     NOT ALIGNED
Memory UI                     NOT TRUTHFUL
Settings UI                   NOT TRUTHFUL
Toolchain                     INCONSISTENT
CI                            NOT VERIFIED
P0.4.1 release gate           FAIL
P0.5 Context Engine           DO NOT START
```

## What this branch fixed correctly

The hardening commit introduced several good changes:

- a dedicated `documentService.ts`,
- real filesystem writes for create/update/delete operations,
- atomic temp-file replacement for writes,
- post-write hash verification,
- `deleted_at` tombstone field,
- removal of `ON DELETE CASCADE` from document events,
- shared watcher/reconcile eligibility rules,
- bounded pending-delete handling,
- unique-hash requirement for reconciliation rename detection,
- scoped deletion comparison for reconciliation,
- server-side writer selection in HTTP routes,
- localhost binding through `HOST=127.0.0.1`,
- browser SSE consumer hook,
- real document content fetching,
- sanitized Markdown rendering dependency.

Those changes are directionally correct. The problems below are implementation details that still break the intended guarantees.

---

# Severity 1 — Watcher confirmed deletion never tombstones the document

## Evidence

`apps/api/src/services/watcher.ts` defines `emitDeleted()` as recording the event and broadcasting it. It does not update `documents.deleted_at`.

The current flow is effectively:

```text
unlink
 -> wait 2s
 -> emitDeleted()
 -> document row remains active
```

The document can therefore remain visible in `GET /api/documents` after its file has been deleted.

## Consequences

- DB state says document is active while the file is gone.
- A later recreate can interact with stale identity state.
- Reconciliation and watcher can disagree about whether the document exists.
- The tombstone model is only partially implemented.

## Required correction

Confirmed watcher deletion must perform the same authoritative state transition as the document service:

```text
set deleted_at
record deleted event
broadcast deleted event
```

Do not duplicate slightly different deletion semantics in watcher and document service. Extract a shared document-state operation if necessary.

---

# Severity 1 — Reconciliation still hard-deletes document rows

## Evidence

`apps/api/src/services/reconcile.ts` still contains:

```sql
DELETE FROM documents WHERE id = ?
```

inside the missing-document loop.

This directly contradicts the tombstone design introduced by migration 3.

## Consequences

The branch claims document history survives deletion, but reconciliation can still remove the document identity row itself.

A later query cannot reliably reconstruct the deleted document state from the document table.

## Required correction

Replace physical row deletion with:

```text
UPDATE documents
SET deleted_at = timestamp,
    updated_at = timestamp
WHERE id = ?
```

then record exactly one `deleted` event.

Do not delete historical document identities during reconciliation.

---

# Severity 1 — Create can overwrite an existing file before database safety is established

## Evidence

`apps/api/src/services/documentService.ts#createDocument()` resolves the target path and writes it before inserting the document row.

There is no authoritative pre-write conflict check for an existing active document/path or an existing filesystem file that is not safely represented by the DB.

The write sequence can therefore become:

```text
existing file exists
 -> overwrite file
 -> database INSERT fails or conflicts
 -> old content is already gone
```

## Required correction

Create must first establish that the path is safe to create.

Required behavior:

```text
validate path + extension + size
 -> check active document at path
 -> check filesystem path
 -> if already exists: return conflict/error without mutation
 -> atomic write
 -> verify hash
 -> insert DB row
```

Never overwrite an existing user file through a create operation.

Also define behavior for a tombstoned document whose old path is reused. Prefer explicit restore/reuse semantics over creating a second identity.

---

# Severity 1 — Update treats a missing live file as writable instead of as a conflict

## Evidence

`updateDocument()` verifies the filesystem hash only when the file exists:

```text
if (fs.existsSync(fullPath)) {
    check hash
}
```

When the expected document row exists but the real file is missing, the code continues to the write operation.

## Consequence

A user can delete the file externally, then a stale LOGOS update can recreate it without returning `409 Conflict`.

That violates the intended live filesystem compare-and-swap contract.

## Required correction

For an active document update:

```text
DB says active
AND expected version/hash match
AND filesystem exists
AND filesystem hash == expected hash
```

If the filesystem file is missing or has a different hash:

```text
409 Conflict
no file mutation
no DB mutation
no document event
```

Deletion must be treated as a state change, not as an acceptable missing-file condition.

---

# Severity 1 — Cross-resource atomicity is still incomplete

The branch now has real filesystem writes and DB updates, but the filesystem mutation and DB transaction are still separate operations.

Examples:

```text
filesystem write succeeds
 -> DB update fails
```

or:

```text
filesystem delete succeeds
 -> DB tombstone update fails
```

The code has no rollback/recovery strategy for those cases.

## Required correction

Use the strongest practical local guarantee:

1. validate all preconditions,
2. perform filesystem operation using an atomic temp/rename or reversible delete strategy,
3. verify final state,
4. execute DB state change + event insertion in a single SQLite transaction,
5. if the DB transaction fails, perform an explicit filesystem recovery action where possible,
6. surface failure instead of claiming success.

For deletes, consider moving the file into a controlled temporary/trash location before committing the tombstone, then removing it permanently only after the DB transaction succeeds.

The implementation does not need distributed transactions, but it must have an explicit failure/recovery contract.

---

# Severity 1 — Writer identity still becomes incorrect for HTTP-triggered document writes

## Evidence

The route correctly resolves the public HTTP actor to `USER`.

However, after `createDocument()` and `updateDocument()`, the route still calls:

```text
registerLogosWrite(...)
```

This records the operation as a LOGOS write for the watcher even though the actual route actor is `USER`.

## Consequence

A user-triggered write can be recorded as:

```text
writer = LOGOS
```

instead of:

```text
writer = USER
```

The actor model is therefore not yet trustworthy.

## Required correction

Remove the unconditional `registerLogosWrite()` call from HTTP user routes.

Instead, carry a server-side operation identity from the actual actor context:

```text
USER
LOGOS
AGENT
AUTOMATION
```

The watcher should match against operation records created by internal actors, not infer LOGOS identity merely because a route caused the write.

---

# Severity 1 — Internal update helper is broken

## Evidence

`apps/api/src/routes/documents.ts` defines:

```text
writeDocumentInternal(path, content, expectedVersion, expectedHash, context)
```

but calls `updateDocument()` with:

```text
id: ''
```

The comment claims the ID will be resolved by path, but `updateDocument()` actually loads the document by ID.

Therefore the helper cannot successfully update an existing document.

## Required correction

Do not place internal document service APIs in a route module.

Move them into `documentService.ts` and define one correct internal API, for example:

```ts
updateDocumentInternal({
  id,
  content,
  expectedVersion,
  expectedHash,
  actor,
})
```

If path-based lookup is intentionally supported, implement that explicitly rather than passing an empty ID.

---

# Severity 1 — Reconciliation still has incorrect rename/delete semantics for tombstones

The new unique-hash logic is better, but it searches the document table without consistently excluding deleted/tombstoned rows.

A tombstoned document can therefore become a candidate for a new file with matching content.

## Required correction

Define candidate sets explicitly:

```text
active candidates
= deleted_at IS NULL
```

For a new filesystem file:

```text
active unique candidate
 -> possible rename/move
multiple candidates or only tombstoned candidates
 -> create new identity or explicit restore flow
```

Never silently resurrect a historical document merely because content hashes match.

---

# Severity 1 — Watcher rename state can leak and old pending state is not fully cleared

The watcher uses:

```text
pending_delete
pending_rename
```

When a rename/move match is found, the implementation updates the database and stores a `pending_rename` state for the new path.

The old path's expiration handler can see the new pending state and avoid deletion, but the old pending state is not explicitly removed in that branch.

This leaves stale state in `pathStates` until another event happens to clean it.

## Required correction

When a rename/move is resolved:

```text
old pending delete -> delete immediately
new path -> no pending state unless a new operation is actually pending
```

A successful rename/move should end with no stale state for either path.

Add tests that assert internal pending state is empty after rename/move completion.

---

# Severity 2 — `getOrCreateDocumentIdentity()` still violates idempotence

The function in `apps/api/src/db/index.ts` still increments the document version whenever the path exists, even if the incoming content hash is identical.

The watcher currently performs an upstream no-op check, but the database helper itself is not safe as a general document state primitive.

## Required correction

Make the primitive itself idempotent:

```text
same path + same hash
 -> same version
 -> no event
```

A document identity helper should never manufacture semantic changes from duplicate notifications.

---

# Severity 2 — SSE contract mismatch: `reconcile-complete` vs `sync-complete`

`reconcile.ts` broadcasts:

```text
reconcile-complete
```

The browser hook listens for:

```text
sync-complete
```

This is an explicit producer/consumer contract mismatch.

## Required correction

Choose one canonical event name and use it everywhere.

Preferred:

```text
reconcile-complete
```

because it describes the operation actually being reported.

Update the shared contract and browser hook accordingly.

---

# Severity 2 — SSE hook reconnects unnecessarily because callback identity changes

`useVaultEvents()` includes `onEvent` and `onConnectionChange` in the `connect()` dependency list.

`VaultContent` creates those callbacks inline on every render.

Therefore the hook can recreate the EventSource whenever component state changes, even when the underlying connection is healthy.

## Required correction

Use stable callback refs or `useCallback()` around consumer callbacks, or make the hook store callbacks in refs so connection lifecycle does not depend on render identity.

The EventSource connection should be stable across ordinary UI renders.

---

# Severity 2 — API authentication is still not actually installed

The repository contains API-key authentication code, but `apps/api/src/server.ts` still does not install authentication middleware.

The API now binds to `127.0.0.1`, which is an improvement, but wildcard CORS plus unauthenticated mutation endpoints still means arbitrary web pages may be able to issue requests to the local API.

## Required correction

Before considering the local API boundary complete, choose one explicit model:

### Preferred local model

- bind `127.0.0.1`,
- restrict CORS to the configured web origin,
- protect mutation endpoints with a local auth mechanism or a secret token,
- do not expose mutating routes to arbitrary origins.

If authentication is intentionally deferred, state that explicitly and treat any non-local bind as unsupported.

---

# Severity 2 — Path and file eligibility are not enforced at the document-service boundary

Watcher and reconciliation use shared eligibility, but `documentService.createDocument()` and `updateDocument()` accept arbitrary paths without explicitly checking:

```text
.md / .markdown
ignored patterns
10 MB byte limit
```

The public route schema limits characters, not actual UTF-8 byte size, and accepts arbitrary extensions.

## Required correction

The authoritative document service must enforce its own invariants.

Do not rely on a caller or watcher to enforce security-sensitive file rules.

---

# Severity 2 — Delete query parameters are not schema-validated

`DELETE /api/documents/:id` parses:

```text
expectedVersion
expectedHash
```

manually from `req.query`.

This bypasses the project's Zod validation boundary.

## Required correction

Define a Zod schema for delete query/body parameters and validate it through the existing middleware.

---

# Severity 2 — Document route IDs should use UUID validation

The document route currently accepts:

```text
id: z.string().min(1)
```

while the schema package already has a UUID definition.

## Required correction

Use one shared UUID schema for document IDs.

---

# Severity 2 — The current tests do not test the new P0.4.1 document service

The existing `concurrency.test.ts` still imports and tests `writeDocument()` from `apps/api/src/db/index.ts`.

It does not exercise:

```text
documentService.createDocument()
documentService.updateDocument()
documentService.deleteDocument()
watcher
reconcile
SSE
```

The branch commit message says 14 tests pass, but the important new hardening behavior is not adequately covered by the visible test files.

## Required correction

Add integration tests against temporary filesystem/database fixtures for the actual P0.4.1 service path.

Do not treat unit tests for the old DB helper as proof of the new document service.

---

# Severity 2 — Current tests still contain no real watcher/reconcile integration matrix

The acceptance specification calls for:

```text
create
modify
delete
rename
move
rapid edits
duplicate content
scoped reconcile
read error
oversized file
restart
```

The visible tests do not cover this end-to-end behavior.

## Required correction

Implement deterministic temporary-vault integration tests.

Where true OS races are difficult to reproduce, inject a controlled hook/barrier into the document service so the race is deterministic and testable.

---

# Severity 2 — Vault page still nests `Shell`

`apps/web/app/layout.tsx` already wraps all pages with:

```text
<Shell>{children}</Shell>
```

`apps/web/app/vault/page.tsx` also imports and renders `Shell` around loading, error, and normal states.

This creates nested application shells.

## Required correction

Pages must render page content only. `Shell` belongs in the root layout.

---

# Severity 2 — Vault actions are still presented as if implemented

The current Vault page still contains handlers that call `console.log()` or use browser `prompt()`/`confirm()` followed by comments such as "Implement ... API call".

Visible actions include:

```text
Edit
Rename
Move
Archive
Show related
Find conflicts
```

## Required correction

Until the underlying backend exists:

- remove those actions, or
- render them disabled with a clear unavailable state.

Do not make a UI action look operational when it is not.

---

# Severity 2 — Memory page still uses fabricated fallback records

`apps/web/app/memory/page.tsx` still populates example memories when the API request fails.

This remains a production truthfulness violation.

## Required correction

On API failure:

```text
show error state
provide retry
leave data empty
```

Never invent memory to make the interface look populated.

---

# Severity 2 — System page still bypasses MUI

`apps/web/app/system/page.tsx` still uses raw HTML and inline styling.

## Required correction

Use MUI throughout the page and pull all semantic colors from the centralized theme.

Keep technical detail here, but do not regress into a separate ad-hoc visual system.

---

# Severity 2 — Settings page still contains no-op controls and machine-specific configuration

`apps/web/app/settings/page.tsx` still has controls whose `onChange` handlers do nothing and includes a concrete local Windows vault path.

## Required correction

Only render settings that are actually backed by state.

For future settings, use:

```text
Not available yet
```

or disable the control and explain the phase dependency.

Remove machine-specific paths from UI.

---

# Severity 2 — Theme control is still not functional and system preference can override product default

`ThemeRegistry.tsx` still checks `prefers-color-scheme` and can select light mode before the user's explicit setting.

`Shell.tsx` still displays a theme-looking icon button that is not wired to `useThemeMode()`.

## Required correction

The product default is dark.

Use:

```text
stored user preference -> use it
no stored preference -> dark
```

The visible theme button must actually toggle the shared registry state.

---

# Severity 2 — Purple secondary palette remains in the supposedly warm LOGOS theme

`apps/web/src/theme/theme.ts` still defines a purple `secondary` palette.

This conflicts with the current warm, restrained product identity.

## Required correction

Remove unused purple/indigo product identity.

Retain only the temporary warm semantic accent until the final brand palette is supplied.

---

# Severity 2 — `.env.example` still contains a machine-specific Windows path and localhost endpoint

The example environment still contains:

```text
LOGOS_WORKSPACE_ROOT=D:/Project/LOGOS/storage/workspace/vault
LOGOS_API_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Required correction

Use environment-driven placeholders:

```text
LOGOS_HOME=~/.logos
LOGOS_WORKSPACE_ROOT=
LOGOS_API_URL=http://127.0.0.1:3001
PORT=3001
HOST=127.0.0.1
```

Prefer same-origin browser requests and keep backend connection targets server-side.

---

# Severity 2 — Runtime phase metadata remains P0.3.1

`apps/api/src/config/index.ts` still reports:

```text
version: 0.3.1
activePhase: P0.3.1
```

That metadata is stale for a P0.4.1 branch.

## Required correction

Set explicit P0.4.1 phase metadata until acceptance passes.

Never use phase metadata to claim completion automatically.

---

# Severity 3 — Duplicate filesystem implementations remain

`packages/core/src/filesystem.ts` still contains the older weaker path containment logic, while `apps/api/src/fs/safePath.ts` contains the stronger implementation.

## Required correction

Keep one canonical secure filesystem implementation.

Either:

- move the strong implementation into the shared core package and use it everywhere,
- or remove the weaker shared implementation until it is rewritten.

Do not leave two competing path-security definitions in the repository.

---

# Severity 3 — Shared contracts remain stale

`packages/contracts/src/index.ts` still defines the old watcher vocabulary:

```text
add
change
unlink
unlinkDir
```

while P0.4 uses:

```text
created
modified
deleted
renamed
moved
```

## Required correction

Align the shared contract with the actual P0.4 event model.

The same contract should be used by backend event producers and browser consumers.

---

# Severity 3 — Canonical project direction docs were replaced rather than preserved

The hardening commit removed the earlier canonical direction documents and replaced them with an audit pack in `docs/`.

This is risky because future work can lose the original product architecture, UI rules, roadmap, and subagent behavior instructions.

## Required correction

Restore or relocate canonical project-direction documents alongside the audit pack.

Audit instructions are supplementary; they should not replace the project's permanent architecture/product specification.

---

# Severity 3 — Commit identity still says ORION

The current hardening commit metadata uses:

```text
author: ORION <orion@example.com>
```

This is not a runtime defect, but it is stale identity metadata in a project now named LOGOS.

## Required correction

Use LOGOS-consistent Git identity for future commits where practical.

---

# Final gate

The branch is **not ready for P0.5**.

At minimum, all Severity 1 and Severity 2 findings above must be resolved and the integration acceptance matrix must pass against the actual P0.4.1 service path.
