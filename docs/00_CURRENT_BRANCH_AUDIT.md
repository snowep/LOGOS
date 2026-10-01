# LOGOS — Current Branch Audit: P0.4 Vault Sync

## Audited branch

```text
p0.4-vault-sync
commit e0ae32a2981f57ddf59da25e9f6975226be57cb3
```

The commit message claims all gates pass, but GitHub reports no CI status checks and no workflow runs for this commit. Treat the commit message as an implementation claim, not independent verification.

## Executive result

```text
P0.3.1 foundation direction      IMPROVED
P0.4 document identity           PARTIALLY CORRECT
P0.4 watcher                     NOT RELIABLE ENOUGH
P0.4 reconciliation              NOT SAFE ENOUGH
P0.4 LOGOS filesystem writes     NOT IMPLEMENTED
P0.4 conflict handling           PARTIALLY CORRECT
P0.4 SSE                         BACKEND EXISTS / CLIENT NOT WIRED
P0.4 security boundary           NOT SAFE FOR NETWORK EXPOSURE
UI product alignment             PARTIALLY ALIGNED
P0.4 release gate                FAIL
```

## Severity 1 — LOGOS writes do not write files

### Evidence

`apps/api/src/routes/documents.ts`

The POST and PUT handlers call:

```ts
writeDocument({ ... })
registerLogosWrite(...)
```

`apps/api/src/db/index.ts`

`writeDocument()` updates the `documents` table, but contains no filesystem write.

### Consequence

The database can claim a new hash/version while the real Markdown file is unchanged or missing.

That breaks the required flow:

```text
Intent
 -> Read current document
 -> Check expected version/hash
 -> Authorize
 -> Atomic write
 -> Register actor
 -> Watcher observes
 -> Recognize actor
 -> Update state
 -> Verify final hash
```

### Required correction

Move filesystem mutation into the document service/write path.

Required order:

```text
validate path
 -> load current state
 -> check expected version/hash
 -> register operation actor
 -> atomic filesystem write
 -> read/hash resulting file
 -> update document row + event transactionally
 -> return verified result
```

Do not make SQLite the source of truth for a write that never reached the vault.

---

## Severity 1 — Reconciliation can delete documents outside a requested subtree

### Evidence

`apps/api/src/services/reconcile.ts`

`syncPath` changes the scan root, but the final deletion loop does:

```ts
const allDocs = db.prepare('SELECT * FROM documents').all()
```

and compares every document against `seenPaths`.

`seenPaths` only contains files found below the requested target.

### Consequence

Reconciling one folder can make documents in unrelated folders appear missing and delete their database rows.

This is a silent data-loss path.

### Required correction

When `syncPath` is present:

- only compare documents whose paths are inside that subtree,
- never delete or mark unrelated documents as missing.

Add a regression test proving a subtree reconcile cannot affect siblings.

---

## Severity 1 — Deleted document history is destroyed

### Evidence

`apps/api/src/db/index.ts`

`document_events.document_id` uses:

```sql
FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
```

`reconcile.ts` later executes:

```sql
DELETE FROM documents WHERE id = ?
```

### Consequence

Deleting the document row can cascade-delete the event history that was supposed to preserve the document lifecycle.

### Required correction

Use a tombstone model instead of hard deletion.

Preferred:

```text
documents.deleted_at nullable
```

Keep the row and keep its events.

Do not use cascade deletion for document history.

A deleted document must remain historically queryable.

---

## Severity 1 — Rename detection is emitted too late and also emits the wrong event sequence

### Evidence

`apps/api/src/services/watcher.ts`

On `unlink`, the implementation immediately records and broadcasts `deleted`, while also placing the document in `pendingDeletes`.

When a matching `add` arrives later, it then records `renamed` or `moved`.

### Consequence

A normal rename can produce:

```text
deleted
renamed
```

instead of one semantic rename event.

The UI can briefly believe a document was deleted when it was only renamed.

### Required correction

For an unlink:

```text
store pending deletion
wait bounded window
if matching add arrives -> rename/move
otherwise -> confirmed delete
```

Do not publish `deleted` during the pending window.

Clear pending entries when the watcher stops.

Remove unused `pendingAdds` code unless it becomes part of a real algorithm.

---

## Severity 1 — Reconciliation rename detection can misclassify duplicate content as a rename

### Evidence

`reconcile.ts` uses:

```ts
getDocumentByHash(contentHash)
```

and immediately treats the match as rename/move when the current path has no document row.

### Consequence

Two files may legitimately contain identical content.

A new second file with identical content is not necessarily a rename.

A hash-only global lookup can attach the new path to the wrong document identity.

### Required correction

Rename/move detection during reconciliation must require evidence:

1. old path is absent,
2. candidate document is uniquely identifiable,
3. no conflicting duplicate file remains at the old path,
4. only then classify as rename/move.

If identity is ambiguous, report `created` and preserve the old identity.

Never silently steal identity between duplicate-content documents.

---

## Severity 1 — Reconciliation is not safe against scan errors and large files

### Evidence

`scanMarkdownFiles()` recursively scans the tree without enforcing the same ignore policy and file-size guard used by the watcher.

`reconcile()` reads files before checking the configured maximum size.

### Consequence

Reconciliation can:

- inspect ignored folders/files,
- read oversized Markdown files into memory,
- produce inconsistent results after partial filesystem errors.

### Required correction

Centralize Markdown file eligibility:

```text
isSupportedMarkdownPath()
shouldIgnorePath()
checkFileSize()
```

Use the same rules in watcher and reconciliation.

A read/stat failure must not be interpreted as a deletion.

A reconciliation with scan errors should return a failed/partial result rather than silently mutating missing documents.

---

## Severity 1 — Conflict detection is not yet a real filesystem concurrency guarantee

### Evidence

`writeDocument()` correctly checks expected version/hash against the DB row.

However, the file itself is not read immediately before the write and there is no atomic compare/write cycle against the actual vault state.

`reconcile.ts` also attempts conflict inference from a `document_events` query, but that does not establish a reliable compare-and-swap relationship with the live filesystem.

### Required correction

For a document write, establish one explicit concurrency contract:

```text
client snapshot
 -> server checks DB snapshot
 -> server checks current filesystem hash
 -> server writes atomically
 -> server verifies resulting hash
 -> server commits new version/event
```

Any mismatch with the expected snapshot returns `409` and changes nothing.

Add a test where the file changes after the client reads it but before the write commits.

---

## Severity 1 — Writer identity is client-controlled

### Evidence

`documents.ts` accepts:

```ts
writer: z.enum(['USER', 'LOGOS', 'AGENT', 'AUTOMATION'])
```

### Consequence

A caller can claim to be `LOGOS`, `AGENT`, or `AUTOMATION` merely by putting that value in JSON.

### Required correction

Writer identity must come from the server-side execution context.

For example:

```text
HTTP user session -> USER
LOGOS internal service -> LOGOS
agent execution context -> AGENT
scheduler execution context -> AUTOMATION
```

Do not trust a public request body field as proof of actor identity.

---

## Severity 1 — API is not safe to expose on a network

### Evidence

`apps/api/src/server.ts` does not install the available `apiKeyAuth` middleware.

`apps/api/src/config/index.ts` uses wildcard CORS by default.

`apps/api/src/index.ts` calls `server.listen(config.port)` without an explicit local-only host.

### Consequence

The current API exposes document write/delete operations without the authorization layer that already exists in the codebase.

### Required correction

For the local-first LOGOS runtime:

```text
HOST=127.0.0.1
```

should be the default.

Direct API mutation routes must not become remotely reachable without authentication.

Either:

- bind locally and document the local-only boundary, or
- enforce authentication and permission checks on all mutation routes.

Do both before any deployment beyond the local machine.

---

## Severity 2 — Document version increments even when content did not change

### Evidence

`getOrCreateDocumentIdentity()` increments `version` whenever the path already exists, even when the new hash equals `current_hash`.

### Consequence

Repeated watcher events can inflate versions without a semantic change.

### Required correction

If:

```text
existing.current_hash === incomingHash
```

then do not bump the document version.

Emit no new `modified` event unless there is a real state change.

---

## Severity 2 — LOGOS self-write registration is incomplete

### Evidence

`registerLogosWrite()` is keyed by path and content hash.

Delete does not register a LOGOS operation before unlinking.

Rename/move operations have no equivalent actor registration.

### Required correction

Track a server-side operation token or operation record containing:

```text
operationId
documentId
oldPath
newPath
expectedHash
actor
createdAt
```

The watcher should use it to recognize its own filesystem effects without duplicating state changes.

---

## Severity 2 — SSE backend exists but the browser is not actually consuming it

### Evidence

The API exposes `/events/vault` and a Next proxy exists at:

```text
apps/web/app/api/vault/events/route.ts
```

But there is no `EventSource` consumer in the current web component tree.

### Required correction

Implement:

```text
EventSource('/api/vault/events')
 -> on message/event
 -> invalidate relevant document query
 -> refetch
 -> update UI
```

Do not copy the database into React state.

Include reconnect behavior and connection state.

---

## Severity 2 — Vault UI is still partially fake

### Evidence

`apps/web/app/vault/page.tsx`:

- preview content is explicitly placeholder text,
- edit/rename/move/archive/show-related/find-conflicts handlers only log to the console,
- raw HTML is rendered with `dangerouslySetInnerHTML` after Markdown parsing,
- the page wraps itself in `Shell` even though the root layout already wraps all pages in `Shell`.

### Required correction

The Vault page must:

- fetch and show the real document content,
- disable actions until implemented or implement them,
- sanitize rendered Markdown HTML,
- use one Shell only,
- hide raw filesystem paths unless explicitly requested.

---

## Severity 2 — Home still invents project semantics

### Evidence

`apps/web/app/page.tsx` converts every document into a `Project` object.

`HomeClient.tsx` hardcodes:

```text
status = active
nextAction = Continue editing
```

The API does not yet have real project entities; P1.0 is the roadmap phase for that.

### Required correction

Until P1.0 exists, Home must not call arbitrary documents "projects".

Use honest sections such as:

```text
Recent
Recent document activity
```

or show an empty Continue Working section stating that project entities arrive in P1.0.

Do not fabricate status or next action.

---

## Severity 2 — Home cannot populate Needs Attention

`attentionItems` is initialized to an empty array and never loaded from any backend source.

Therefore the section can never represent real conflicts.

### Required correction

Populate it from actual reconciliation/conflict state, or leave the section absent.

---

## Severity 2 — Home project click can point to a route that does not exist

`HomeClient.tsx` navigates to:

```text
/work/{project.id}
```

but the current tree only contains:

```text
apps/web/app/work/page.tsx
```

There is no dynamic `/work/[id]` route in this branch.

### Required correction

Do not link to a non-existent route.

---

## Severity 2 — Theme behavior violates the chosen product default

`ThemeRegistry.tsx` checks the operating-system color preference and can start in light mode.

The LOGOS UI spec says dark is the product default.

`Shell.tsx` also renders a theme-looking icon button that is not connected to `useThemeMode()`.

### Required correction

- dark is the default,
- user setting overrides it,
- system preference must not silently override the product default,
- the visible theme control must actually work.

---

## Severity 2 — System page still bypasses MUI

`apps/web/app/system/page.tsx` uses raw `div`, `section`, `h1`, `h2`, `pre`, and inline styles.

### Required correction

Rebuild System entirely with MUI components and centralized theme tokens.

---

## Severity 2 — Settings contains non-functional controls and a machine-specific path

`apps/web/app/settings/page.tsx` contains hardcoded values, no-op change handlers, and:

```text
D:\Project\LOGOS\storage\workspace\vault
```

### Required correction

Do not present non-functional settings as active configuration.

Use real values from the API or mark future settings as unavailable/coming later.

Do not hardcode a developer's machine path in the product UI.

---

## Severity 2 — Environment configuration still contains hardcoded localhost / Windows examples

`.env.example` contains a concrete Windows vault path and `NEXT_PUBLIC_API_URL=http://localhost:3001`.

`next.config.js` also hardcodes `http://localhost:3001`.

### Required correction

Use environment-driven configuration.

Prefer same-origin browser requests through `/api/*` and `/api/vault/events`.

Keep backend target configuration server-side.

Do not ship machine-specific paths in source.

---

## Severity 2 — Runtime phase metadata is wrong for a P0.4 branch

`apps/api/src/config/index.ts` still says:

```text
version: 0.3.1
activePhase: P0.3.1
```

### Required correction

Phase metadata must describe the actual branch/runtime state.

For the hardening branch, use an explicit P0.4.1 identity until the phase is accepted.

Do not mark P0.4 complete while its acceptance matrix is failing.

---

## Severity 3 — Duplicate architecture and stale dependencies remain

Examples:

- `apps/api/src/schemas/index.ts` duplicates route-local Zod schemas.
- `@prisma/config` remains in root development dependencies even though the runtime database implementation is better-sqlite3.
- `packages/core/src/filesystem.ts` contains a second, weaker path-safety implementation and does not match `apps/api/src/fs/safePath.ts`.
- `packages/contracts/src/index.ts` still defines an older `VaultEvent` model (`add/change/unlink`) that does not match the P0.4 event model (`created/modified/deleted/renamed/moved`).

### Required correction

There must be one canonical implementation for each responsibility.

Either make the shared package authoritative or remove the duplicate.

Do not keep old abstractions merely because they already exist.

---

## Severity 3 — Web toolchain is internally inconsistent

`apps/web/package.json` declares React 19 while its development dependencies declare React type packages 18 and an older Next ESLint configuration.

### Required correction

Normalize the web toolchain before further UI work.

At minimum verify:

```text
npm ls react react-dom @types/react @types/react-dom next eslint-config-next
```

and make the versions intentionally compatible with the installed Next/MUI stack.

---

## Final gate

The branch is **not ready for P0.5** until all Severity 1 and Severity 2 findings are closed and the acceptance matrix passes.
