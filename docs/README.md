# LOGOS — P0.4 Vault Sync Audit & Hermes Corrective Pack

This pack evaluates branch `p0.4-vault-sync` at commit `e0ae32a2981f57ddf59da25e9f6975226be57cb3`.

## Decision

**DO NOT treat P0.4 as complete.**

Create:

```text
p0.4.1-vault-sync-hardening
```

Complete the corrective work in this pack before starting P0.5 Context Engine.

## Why

The branch contains real improvements:

- runtime SQLite artifacts are ignored rather than committed,
- `LOGOS_HOME` is now the normal storage root,
- document IDs are generated as UUIDs rather than path hashes,
- rename/move detection exists,
- writer identity exists,
- conflict responses return HTTP 409,
- reconciliation exists,
- SSE exists,
- Zod validation exists,
- filesystem safety tests exist,
- the procedural embedding interpolation regression is covered.

However, several implementation details are still unsafe or incorrect for a real personal vault.

The most important failure is this:

> `POST /api/documents` and `PUT /api/documents/:id` call `writeDocument()`, but `writeDocument()` only updates SQLite state. It does not write the requested Markdown content to the filesystem.

Therefore the advertised LOGOS write flow is not implemented end-to-end.

## Required sequence

1. Read `00_CURRENT_BRANCH_AUDIT.md`.
2. Read `01_HERMES_CORRECTIVE_DIRECTIVE.md`.
3. Read `02_ACCEPTANCE_TEST_MATRIX.md`.
4. Read `03_UI_CORRECTIVE_DIRECTIVE.md`.
5. Create `p0.4.1-vault-sync-hardening` from `p0.4-vault-sync`.
6. Fix backend correctness and security first.
7. Add integration tests before calling the implementation complete.
8. Apply the UI corrections without inventing P1.0 entities.
9. Run the complete verification gate.
10. Only after all acceptance tests pass, continue to `p0.5-context-engine`.
