# LOGOS — P0.3 Foundation Alignment Gate

## Branch

`p0.3.1-foundation-alignment`

## Goal

Make P0.3 a coherent foundation before P0.4 adds more synchronization behavior.

## 1. One database

Use exactly one runtime SQLite database:

```text
LOGOS_HOME/
  system/
    logos.db
  workspace/
    vault/
```

`LOGOS_HOME` must be explicit configuration.

Do not derive the database location from the current working directory or compiled source layout.

Recommended backend structure:

```text
apps/api/src/db/
  client.ts
  migrations/
  repositories/
```

`index.ts` should be bootstrap/composition, not the home of every SQL query.

## 2. Remove runtime artifacts

Delete from Git:

```text
*.db
*.db-wal
*.db-shm
```

including the currently committed database files.

Keep runtime storage local.

## 3. Document identity

Required document model:

```text
id             stable UUID
path           current relative path
current_hash   SHA-256
version        monotonically increasing integer
created_at
updated_at
last_writer
size
mime_type
```

Path is mutable. ID is not.

## 4. Write contract

A document write must support optimistic concurrency:

```json
{
  "path": "projects/drop-002.md",
  "content": "...",
  "expectedVersion": 7,
  "expectedHash": "abc123",
  "writer": "LOGOS"
}
```

If the current state is not v7/abc123, return a conflict instead of overwriting.

## 5. Filesystem security

`resolveSafePath()` must:
- reject absolute paths,
- reject traversal,
- use `path.relative()` containment,
- verify real paths,
- prevent symlink escape,
- not create a parent directory before containment is established.

Tests must cover:

```text
../secret.md
..\secret.md
C:\secret.md
\server\share\secret.md
symlink-to-outside/file.md
```

## 6. Vector search

The branch currently falls back to JavaScript cosine similarity.

That is acceptable temporarily, but it must be explicit.

Create a provider boundary such as:

```text
VectorSearchProvider
  -> SqliteVecProvider
  -> JavaScriptFallbackProvider
```

The API must report which backend is actually active.

Never claim sqlite-vec is active when it is not.

## 7. Memory embedding

Verify all embedding inputs.

Procedural embedding input must actually interpolate:

```ts
`${memory.name} ${memory.description ?? ""} ${memory.steps} ${memory.triggers ?? ""}`
```

Add a regression test for this exact bug class.

## 8. Event vs memory

Never automatically store the complete Markdown file as episodic memory for every edit.

Required flow:

```text
file change
-> document event
-> document index update
-> optional diff
-> memory evaluation
-> promotion if justified
```

## 9. API architecture

Use one actual server.

Preferred:

```text
Express
 -> middleware
 -> auth
 -> routes
 -> services
 -> repositories
```

Do not keep an unused Express dependency beside a raw HTTP router.

## 10. Request validation

Use Zod or equivalent validation for:
- path parameters,
- query limits,
- thresholds,
- body schemas,
- writer identity,
- pagination.

Reject NaN, negative limits, huge limits, malformed IDs, invalid paths, and unknown writers.

Do not expose raw internal exception messages.

## 11. Configuration

Use:

```text
LOGOS_HOME
LOGOS_WORKSPACE_ROOT
LOGOS_API_URL
LOGOS_MODEL_PROVIDER
LOGOS_MODEL_BASE_URL
LOGOS_MODEL_NAME
PORT
```

Keep any compatibility mapping temporary and documented.

For Next.js, do not use a Vite-style `VITE_API_URL` unless intentionally required.

## 12. Cleanup

Remove:
- committed database artifacts,
- `apps/api/server.log`,
- test files accidentally placed in the vault,
- `.bak` source files,
- stale ORION docs,
- fake UI data,
- dead code.

## 13. Verification

Run:

```text
npm ci
npm run typecheck
npm run lint
npm run build
npm test
```

Then manually verify:
- API starts from another cwd,
- database is created in LOGOS_HOME,
- Markdown watcher works,
- non-Markdown files are ignored,
- symlink escape is blocked,
- LOGOS writes do not loop,
- conflicts are detected,
- deletion works,
- rename/move behavior is deterministic,
- no fake telemetry is shown.
