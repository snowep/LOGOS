# LOGOS — Current Branch Audit: P0.4.2 Vault Sync Integrity

## Audited branch

```text
repository: snowep/LOGOS
branch:     p0.4.2-vault-sync-integrity
head:       373a4e14baae05a8c274a313176da297cdd84c23
parent:     2763109c530d9c4e53047e78c03c71151451ef08
```

The branch is exactly one commit ahead of the prior P0.4.1 hardening branch.

## Executive result

```text
P0.4.1 headline integrity fixes       IMPLEMENTED / PARTIAL
Document service                    IMPROVED / STILL UNSAFE
Tombstone lifecycle                 PARTIAL / RECREATE BUG REMAINS
Watcher                             IMPROVED / STATE MODEL STILL UNSAFE
Reconciliation                      IMPROVED / TOMBSTONE + ATOMICITY GAPS
Concurrency                         PARTIAL / NOT INTEGRATION TESTED
Writer identity                     FAIL / HTTP WRITES STILL MISCLASSIFIED
SSE                                 FAIL / CONTRACT MISMATCH + RECONNECT INSTABILITY
Filesystem safety                   GOOD API LAYER / DUPLICATE WEAKER CORE REMAINS
API security                       FAIL / AUTH NOT INSTALLED + CORS *
Vault UI                            IMPROVED / STILL NOT PRODUCTION-COMPLETE
Chat UI                             NOT ALIGNED WITH GENIE BRIEF
Memory UI                           FAIL / FABRICATED FALLBACK REMAINS
System UI                           FAIL / RAW HTML + HARDCODED COLORS
Settings UI                         FAIL / MANY NO-OP CONTROLS
Theme                               FAIL / OS LIGHT PREFERENCE + NO-OP TOGGLE
Contracts                           FAIL / STALE VAULT EVENT VOCABULARY
Environment/toolchain               FAIL / LOCALHOST + VERSION DRIFT
Documentation continuity            FAIL / P0.4.1 audit metadata remains stale
CI                                  NOT VERIFIED / no status or workflow run
P0.4.2 release gate                 FAIL
P0.5 Context Engine                 DO NOT START
```

## What P0.4.2 fixed correctly

Compared with `2763109c...`, the branch correctly addresses the specific headline defects below:

1. Watcher deletion now calls a tombstone transition instead of only broadcasting deletion.
2. Reconciliation now tombstones missing documents instead of physically deleting rows.
3. Reconciliation rename candidates explicitly require `deleted_at IS NULL`.
4. Create now checks active DB state and filesystem existence before the write.
5. Update now requires the live file to exist and match the expected hash.
6. Deleted documents are rejected by update logic.
7. Rename/move matching removes the old pending state rather than leaving the documented stale state.
8. Vault no longer nests `Shell`.
9. Several old Vault actions are rendered disabled rather than pretending to be implemented.
10. Vault content uses the document API and sanitized Markdown rendering.

Those are real improvements. They do not close the phase.

---

# Severity 1 — Tombstoned path recreation is still broken

## Evidence

`apps/api/src/db/index.ts` defines:

```sql
SELECT * FROM documents WHERE path = ?
```

for `getDocumentByPath()` and returns tombstoned rows.

The watcher also uses `getDocumentByPath()` without requiring `deleted_at IS NULL`.

`getOrCreateDocumentIdentity()` likewise finds a tombstoned row by path and updates it without clearing `deleted_at`.

The actual failure sequence is:

```text
tracked file deleted
 -> row receives deleted_at
 -> same path is recreated
 -> getDocumentByPath() finds old tombstoned row
 -> watcher may treat it as existing
 -> identical content can be skipped
 -> different content can modify the tombstoned row
 -> deleted_at remains set
```

Therefore the required B9 / C7 lifecycle is still undefined in code.

## Required correction

Define exactly one explicit policy for reuse of a tombstoned path.

Recommended policy:

```text
tombstone + new file at same path
 -> create new identity
```

or an explicit restore operation that deliberately revives the original identity.

Do not silently modify a tombstoned identity.

Implement separate helpers such as:

```text
getActiveDocumentByPath()
getDocumentIncludingTombstone()
```

and make the caller choose explicitly.

---

# Severity 1 — Cross-resource atomicity is still incomplete

`documentService.ts` performs filesystem mutations and DB mutations as independent operations.

For update:

```text
write temp
 -> verify
 -> rename filesystem
 -> UPDATE documents
 -> INSERT event
```

For delete:

```text
unlink filesystem
 -> UPDATE documents
 -> INSERT event
```

The DB update and event insert are not protected by an explicit transaction spanning the complete logical state transition, and there is no recovery path if the DB operation fails after the filesystem has changed.

## Required correction

Use a local recovery boundary:

```text
validate
 -> reversible/atomic filesystem operation
 -> verify final filesystem state
 -> SQLite transaction: document row + event
 -> finalize filesystem operation
```

For delete, controlled trash/staging is strongly preferred over irreversible unlink before DB commit.

Failure must result in a recoverable state and must never return success with filesystem/DB disagreement.

---

# Severity 1 — Writer identity is still wrong for HTTP writes

`apps/api/src/routes/documents.ts` correctly maps HTTP context to `USER` but still performs:

```text
registerLogosWrite(...)
```

after public create/update calls.

That means the watcher can later classify a user-triggered file event as `LOGOS`.

## Required correction

Remove watcher self-write registration from public HTTP user routes.

Use explicit internal operation records/tokens only when the actual actor is:

```text
LOGOS
AGENT
AUTOMATION
```

The filesystem watcher must not infer authority from the fact that a route caused a write.

---

# Severity 1 — Internal update helper is still broken and is in the wrong layer

`apps/api/src/routes/documents.ts` still contains `writeDocumentInternal()` and calls:

```ts
updateDocument({ id: '' ... })
```

The service loads documents by ID, so the helper cannot perform its stated path-based update.

## Required correction

Move internal document APIs into `services/` and call them with a real document ID or an explicit path-resolution operation.

Routes should translate HTTP only.

---

# Severity 1 — SSE contract still mismatches

Backend reconciliation broadcasts:

```text
reconcile-complete
```

The browser hook still listens for:

```text
sync-complete
```

The shared contracts package still exposes the older watcher vocabulary:

```text
add / change / unlink / unlinkDir
```

while the runtime uses:

```text
created / modified / deleted / renamed / moved / reconcile-complete
```

## Required correction

Define one shared event contract and use it at every layer:

```text
shared contract
 -> backend producer
 -> EventSource client
 -> UI invalidation/refetch
```

Use `reconcile-complete` consistently.

---

# Severity 1 — SSE connection still recreates on render-sensitive callback identity

`useVaultEvents.ts` makes the EventSource effect depend on the `connect` callback.

`VaultContent` supplies inline `onEvent` and `onConnectionChange` callbacks. Because these functions are recreated during render, `connect` can also be recreated and the EventSource effect can tear down and reconnect after ordinary state updates.

## Required correction

Use stable callbacks (`useCallback`) or callback refs. The EventSource should be created once per component lifecycle/configuration, not once per render.

Also prevent `reconnect()` from creating duplicate connections when one is already active.

---

# Severity 1 — Public mutation API still has no installed authentication boundary

`apps/api/src/auth/index.ts` contains API-key middleware, but `apps/api/src/server.ts` does not install it.

The server still uses:

```text
CORS origin = '*'
```

and the SSE endpoint hardcodes:

```text
Access-Control-Allow-Origin: *
```

Default bind is correctly localhost, but a local-only bind is not the same as a complete browser security boundary.

## Required correction

Choose and document one supported local model:

```text
configured same-origin/local-origin policy
```

plus authentication for direct API access where required.

Do not ship wildcard CORS as the production default.

---

# Severity 1 — Reconciliation is still not a trustworthy state transition

P0.4.2 fixes physical deletion, but reconciliation still performs document-row updates, event inserts, and broadcasts independently.

It also uses `path LIKE 'prefix/%'` for subtree selection without an explicit scan-completeness state.

If a subtree scan is partial or permission-limited, the system must not treat the resulting missing set as authoritative.

## Required correction

Introduce a scan result state such as:

```text
COMPLETE
PARTIAL
FAILED
```

Only a COMPLETE subtree scan may cause tombstoning from the missing-set comparison.

Read/stat failures must remain skipped/partial and must never make deletion authoritative.

---

# Severity 1 — `getOrCreateDocumentIdentity()` remains non-idempotent

The helper increments version whenever the path exists, even when the incoming hash is identical.

Required invariant is:

```text
same path + same hash
 -> same identity
 -> same version
 -> no event
```

This is particularly dangerous now because tombstone handling also depends on path-based lookups.

## Required correction

Make the primitive itself idempotent. Do not rely on callers to remember a no-op check.

---

# Severity 2 — GET `/api/documents` returns tombstones as active documents

`apps/api/src/routes/documents.ts` uses:

```sql
SELECT * FROM documents ORDER BY updated_at DESC
```

with no `deleted_at IS NULL` filter.

The Vault page consumes this endpoint as its active document list.

## Consequence

A deleted/tombstoned document can remain visible in the normal Vault document list.

## Required correction

Separate active list and history list APIs.

Normal document listing should use:

```sql
WHERE deleted_at IS NULL
```

Tombstoned history should be explicit and separately surfaced when supported.

---

# Severity 2 — Create API contract requires irrelevant optimistic-concurrency fields

The public POST body schema uses `writeBody` with mandatory:

```text
expectedVersion
expectedHash
```

but `createDocument()` does not use them.

This makes a new-document API needlessly require state that does not yet exist.

## Required correction

Define separate schemas:

```text
createDocumentInput
updateDocumentInput
```

Create should not require expected version/hash unless a deliberate protocol needs them.

---

# Severity 2 — Conflict payload for create is misleading

When an active DB document exists, `createDocument()` constructs conflict data using the new requested hash rather than the existing document's actual hash.

The 409 response can therefore report misleading current state.

## Required correction

Conflict details must describe the actual current state:

```text
currentVersion
currentHash
expectedVersion
expectedHash
```

For a create conflict, either use a dedicated conflict schema or report the actual path/file conflict without manufacturing document state.

---

# Severity 2 — Document service does not own all eligibility invariants

The service accepts create/update content without enforcing the full vault eligibility rules used by watcher/reconcile.

Examples:

```text
extension eligibility
10 MB byte limit
ignored path rules
```

The route's `z.string().max(...)` is not equivalent to a UTF-8 byte limit.

## Required correction

Make service-level validation authoritative and shared.

For content size use:

```ts
Buffer.byteLength(content, 'utf8')
```

not JavaScript string length.

---

# Severity 2 — Route validation remains incomplete

The document ID schema is:

```text
z.string().min(1)
```

instead of a shared UUID schema.

DELETE still parses query parameters manually with `parseInt()` and raw string checks.

## Required correction

Use shared Zod schemas for:

```text
UUID
create input
update input
delete input
reconcile input
```

and validate the complete delete request through middleware.

---

# Severity 2 — Filesystem safety is duplicated

`apps/api/src/fs/safePath.ts` is materially stronger than:

```text
packages/core/src/filesystem.ts
```

The core implementation still relies on `startsWith(rootPath)` containment.

## Required correction

Use one canonical security implementation. The containment rule should use `path.relative()` and real-path validation, with Windows/UNC/junction/symlink cases covered by tests.

---

# Severity 2 — Environment and Next.js configuration still contain machine-specific localhost literals

`.env.example` still contains:

```text
LOGOS_WORKSPACE_ROOT=D:/Project/LOGOS/storage/workspace/vault
LOGOS_API_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001
```

`apps/web/next.config.js` also hardcodes:

```text
http://localhost:3001
```

## Required correction

Use portable examples:

```text
LOGOS_WORKSPACE_ROOT=
LOGOS_API_URL=http://127.0.0.1:3001
HOST=127.0.0.1
```

Prefer browser same-origin `/api/*` and server-side configuration rather than exposing environment-specific API URLs to the client.

---

# Severity 2 — Phase metadata remains stale

`apps/api/src/config/index.ts` still reports:

```text
version: 0.3.1
activePhase: P0.3.1
```

This branch is explicitly a P0.4.2 integrity branch.

## Required correction

Update phase metadata only when the phase status is intentionally defined. Do not leave stale P0.3.1 identifiers in a P0.4.2 branch.

---

# Severity 2 — Shared contract package remains stale

`packages/contracts/src/index.ts` still defines the old VaultEvent vocabulary:

```text
add/change/unlink/unlinkDir
```

That creates a parallel event model and increases the risk of silent UI/backend divergence.

## Required correction

Make the shared package the canonical source of the current event vocabulary and payload types.

---

# Severity 2 — Theme behavior remains incorrect

`ThemeRegistry.tsx` still checks the OS preference when no stored user preference exists.

Required behavior is:

```text
no stored preference -> dark
stored preference -> use stored preference
```

`Shell.tsx` still renders a theme-looking icon button without calling `useThemeMode()`.

## Required correction

Use the ThemeRegistry context in the visible theme control and remove OS auto-selection unless product requirements explicitly change.

---

# Severity 2 — Purple/indigo secondary branding remains

`apps/web/src/theme/theme.ts` still defines purple secondary colors.

This conflicts with the temporary LOGOS warm visual language.

## Required correction

Remove unused purple/indigo branding and use the temporary warm accent or neutral semantic tokens.

---

# Severity 2 — Memory page still fabricates production data on API failure

`apps/web/app/memory/page.tsx` still inserts hardcoded example memories in the catch path.

This directly violates the data-truthfulness rule.

## Required correction

Failure state must be:

```text
Error loading memories
Retry
```

No fake records.

---

# Severity 2 — System page still bypasses MUI

`apps/web/app/system/page.tsx` remains a raw HTML/inline-style page with hardcoded colors.

## Required correction

Rebuild with official MUI components and centralized theme tokens.

---

# Severity 2 — Settings page still contains no-op controls and machine-specific configuration

`apps/web/app/settings/page.tsx` still contains patterns such as:

```text
checked={true}
onChange={() => {}}
```

and a hardcoded Windows vault path.

## Required correction

Every visible setting must be either:

```text
real + persisted
```

or:

```text
disabled + explicit unavailable state
```

---

# Severity 2 — Vault UI has contradictory/unfinished behavior

The headline actions are now disabled, which is safer, but the component still contains old handler functions using:

```text
console.log()
prompt()
confirm()
```

They should be deleted, not merely made unreachable.

The page also still contains old hardcoded Markdown styling such as indigo link/border colors, inconsistent with the new warm theme.

`ConnectionIndicator` constructs color token strings such as `successLight` / `successMain`, which do not match normal MUI palette token paths.

## Required correction

Delete obsolete handlers and replace all styling with valid MUI theme paths/tokens.

---

# Severity 2 — Chat page does not yet implement the Genie-inspired workspace pattern

The current `/chat` implementation is primarily a full-width chat area with a right-side context drawer.

The supplied design brief calls for:

```text
internal recent-conversation rail
+
main conversation workspace
```

The current page lacks:

- a real conversation history rail,
- persisted conversations,
- a real new-chat lifecycle,
- real conversation selection/loading.

It also exposes `message.reasoning` through a `Show Sources/Reasoning` button, which is not aligned with the intended normal-user UI.

## Required correction

Implement the Genie-inspired interaction pattern described in:

```text
docs/04_GENIE_INSPIRED_LOGOS_UI_BRIEF.md
```

Keep it LOGOS-specific; do not copy source artwork or branding.

---

# Severity 2 — Web toolchain remains inconsistent

`apps/web/package.json` contains:

```text
React 19.x
Next 16.x
@types/react 18.x
@types/react-dom 18.x
eslint-config-next 14.x
TypeScript 5.4.x
```

while the root uses different versions of related packages.

`apps/web/tsconfig.json` still uses `strict: false` while root/API are strict.

## Required correction

Normalize versions and compiler policy intentionally. Do not let the package lock choose a mixed major-version toolchain accidentally.

---

# Severity 2 — CI is still absent/unverified

The branch has:

```text
no GitHub Actions workflow run
no commit status checks
```

The commit message claims:

```text
All gates pass: typecheck, lint, build, test (14 passing)
```

That is not independently verified by GitHub for this head.

## Required correction

Add CI or otherwise execute and capture the required commands in a trustworthy environment:

```text
npm ci
npm run typecheck
npm run lint
npm run build
npm test
```

Do not report the commit as verified merely because the commit message says the commands passed.

---

# Severity 2 — Audit/documentation metadata is stale

The repository's current `docs/00_CURRENT_BRANCH_AUDIT.md` and `docs/README.md` still describe:

```text
p0.4.1-vault-sync-hardening
```

while living on the P0.4.2 branch.

## Required correction

Update audit metadata whenever the branch under audit changes. Keep the earlier audit as history rather than silently relabeling it.

---

# Severity 2 — Canonical project documentation continuity is incomplete

The branch root currently exposes `IDEA.md` plus the audit documents, but the previously expected permanent project direction documents are not present at the repository root.

At minimum the project needs a discoverable canonical set for:

```text
PRD
ARCHITECTURE
ROADMAP
DESIGN/UI
SECURITY
AGENTS
```

## Required correction

Restore/retain canonical product direction docs alongside phase-specific audit/corrective documents.

---

# Release decision

```text
P0.4.2 = NOT ACCEPTED
P0.5   = DO NOT START
```

The branch should receive another corrective commit (or a fresh integrity follow-up branch) until all Severity 1 findings are closed, Severity 2 acceptance items are addressed, the full integration matrix passes, and the results are independently verifiable.
