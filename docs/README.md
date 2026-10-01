# LOGOS — P0.4.1 Vault Sync Hardening Audit Pack

Audited branch:

```text
p0.4.1-vault-sync-hardening
commit 2763109c530d9c4e53047e78c03c71151451ef08
```

## Decision

**DO NOT advance to P0.5 yet.**

The branch is materially improved over `p0.4-vault-sync` and fixes several previous blockers, but the vault synchronization core still has correctness problems that can leave filesystem state and database state inconsistent.

The most important remaining failures are:

- watcher deletion does not update the document tombstone,
- reconciliation still physically deletes document rows instead of preserving tombstones,
- create can overwrite an existing filesystem file before the database insert is known to be safe,
- update does not treat a missing live file as a conflict,
- writer registration incorrectly marks HTTP user writes as LOGOS writes,
- the claimed internal writer helper is broken,
- SSE event names do not match between reconciliation and the browser hook,
- the Vault page still nests `Shell`,
- Memory/Settings/System UI still contain non-production behavior,
- existing tests do not exercise the new document service and watcher end-to-end,
- no GitHub Actions workflow/status independently verifies the commit.

## Recommended sequence

```text
p0.4.1-vault-sync-hardening
        |
        +--> corrective commits on this branch
        |
        +--> acceptance matrix passes
        |
        +--> P0.5 Context Engine
```

If a clean phase boundary is preferred, create `p0.4.2-vault-sync-integrity` from this commit and apply the same corrective directive there.

## Files

- `00_CURRENT_BRANCH_AUDIT.md` — detailed findings and evidence
- `01_HERMES_CORRECTIVE_DIRECTIVE.md` — implementation instructions
- `02_ACCEPTANCE_TEST_MATRIX.md` — required tests
- `03_UI_CORRECTIVE_DIRECTIVE.md` — UI cleanup needed before phase completion
- `04_GENIE_INSPIRED_LOGOS_UI_BRIEF.md` — detailed LOGOS UI adaptation brief based on the supplied Genie reference
