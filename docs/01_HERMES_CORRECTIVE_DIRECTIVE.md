# LOGOS — Hermes Corrective Directive for P0.4.2

## Mission

Make `p0.4.2-vault-sync-integrity` a trustworthy vault synchronization foundation. Do not start P0.5 until this gate is closed.

## Branch baseline

```text
HEAD  373a4e14baae05a8c274a313176da297cdd84c23
PARENT 2763109c530d9c4e53047e78c03c71151451ef08
```

## Rule 0 — Do not trust commit-message claims

The current commit says all gates pass. GitHub shows no status checks and no workflow runs for this head. Hermes must verify commands directly and record their outputs or clearly report that they were not run.

---

## 1. Fix tombstone lifecycle first

Create explicit helpers:

```text
getActiveDocumentByPath(path)
getDocumentIncludingTombstone(id)
```

Define and implement one policy for:

```text
delete -> tombstone -> same-path recreate
```

Recommended default:

```text
recreate same path -> new identity
```

Do not silently mutate tombstoned rows.

Required tests:

```text
B4 B9 C7
```

---

## 2. Make document identity primitive idempotent

`getOrCreateDocumentIdentity()` must obey:

```text
same path + same hash -> no version change, no event
```

It must also have explicit behavior for tombstoned records.

Do not make callers responsible for preventing version inflation.

---

## 3. Establish a cross-resource recovery boundary

For create/update/delete:

```text
validate
precondition check
atomic/reversible FS action
verify FS result
SQLite transaction for row + event
finalize
```

Do not return success when DB/event commit fails after filesystem mutation.

For delete, use trash/staging where practical.

Add deterministic failure-injection tests for DB failure after filesystem preparation.

---

## 4. Correct actor identity

Remove `registerLogosWrite()` from public HTTP user routes.

Create a server-side actor/operation context under `services/`.

Only actual internal actors can register self-write suppression:

```text
LOGOS
AGENT
AUTOMATION
```

HTTP user writes must remain `USER`.

Implement and test:

```text
D1 D2 D3 D4 D5
```

---

## 5. Move internal document APIs out of routes

Delete the broken `writeDocumentInternal()` implementation from `routes/documents.ts`.

Place canonical internal APIs in `documentService.ts` or a dedicated service module.

Never use:

```text
id: ''
```

as an implicit path lookup.

---

## 6. Make active document listing actually active

Normal document list endpoints must exclude tombstones:

```sql
WHERE deleted_at IS NULL
```

Provide explicit history access separately.

Test that the Vault UI does not show deleted documents in the normal list.

---

## 7. Split request schemas

Use distinct Zod contracts for:

```text
create
update
delete
reconcile
```

Use a UUID schema for document IDs.

Validate delete expected version/hash entirely through middleware.

Do not use character count as the 10 MB content limit; validate UTF-8 bytes in the service.

---

## 8. Make watcher deletion and rename state transactional and deterministic

A confirmed deletion must:

```text
active document -> tombstoned
                  + deleted event
                  + broadcast
```

A rename/move must end with:

```text
old path = no pending state
new path = no stale pending state
same document ID
one rename/move event
no deleted event
```

Use explicit state transitions rather than duplicate ad-hoc SQL.

---

## 9. Reconcile only from complete scans

Add an explicit scan quality result:

```text
COMPLETE
PARTIAL
FAILED
```

Only COMPLETE scans may tombstone missing documents.

Read/stat errors must never be interpreted as absence.

Rename candidates must be active and uniquely supported by evidence.

Tombstoned matches are not automatic resurrection.

---

## 10. Unify SSE contract

Canonical event names:

```text
created
modified
deleted
renamed
moved
reconcile-complete
```

Update:

```text
packages/contracts/src/index.ts
apps/api/src/routes/events.ts
apps/api/src/services/reconcile.ts
apps/api/src/services/watcher.ts
apps/web/src/hooks/useVaultEvents.ts
Vault UI event handlers
```

Use metadata-only payloads.

---

## 11. Stabilize EventSource lifecycle

Use callback refs or stable callbacks.

The effect must not depend on inline callback identity from a rendering page.

`connect()` must avoid creating a second EventSource when one is already open/connecting.

Add an integration/React test or deterministic instrumentation test for render stability.

---

## 12. Close the local API security boundary

Keep:

```text
HOST=127.0.0.1
```

Replace wildcard CORS with configured local origins.

Decide whether direct API access requires API keys in the current phase. If it does, install `apiKeyAuth()` on mutation routes. If local-only unauthenticated mode remains the phase policy, document that explicitly and keep network exposure unsupported.

Do not leave the SSE route with a hardcoded `Access-Control-Allow-Origin: *`.

---

## 13. Unify filesystem security

Use one canonical safe-path implementation.

Delete or refactor the weaker duplicate in `packages/core/src/filesystem.ts`.

Tests must include:

```text
../secret.md
..\\secret.md
C:\\secret.md
\\\\server\\share\\secret.md
/etc/passwd
root-prefix sibling attack
symlink escape
junction escape
```

---

## 14. Remove stale configuration and phase metadata

`.env.example` must be portable. Prefer:

```text
LOGOS_HOME=~/.logos
LOGOS_WORKSPACE_ROOT=
LOGOS_API_URL=http://127.0.0.1:3001
PORT=3001
HOST=127.0.0.1
```

Remove hardcoded `localhost:3001` from `apps/web/next.config.js` where possible; use a server-side/configurable target.

Update phase metadata to reflect the actual branch intentionally.

---

## 15. Fix UI truthfulness and the Genie-inspired design direction

Follow both:

```text
docs/03_UI_CORRECTIVE_DIRECTIVE.md
docs/04_GENIE_INSPIRED_LOGOS_UI_BRIEF.md
```

Required Chat direction:

```text
Global LOGOS navigation
        |
        +-- Chat internal conversation rail
        |
        +-- Main conversation workspace
```

The rail should use real persisted conversations. Do not hardcode fake conversations.

Context/result cards must represent real records/actions only.

Do not expose raw model reasoning in the normal user interface.

Voice and vision remain out of scope.

---

## 16. Fix remaining UI violations

### Memory

Delete fabricated fallback data.

### System

Use MUI only and theme tokens.

### Settings

Remove no-op controls or mark them unavailable.

### Theme

```text
no stored preference -> dark
stored preference -> stored mode
```

Connect the actual toggle to `useThemeMode()`.

### Vault

Delete obsolete `console.log`, `prompt`, and `confirm` handlers instead of leaving dead code.

---

## 17. Normalize the web toolchain

Deliberately align:

```text
React
React DOM
Next
@types/react
@types/react-dom
eslint-config-next
TypeScript
```

Remove unnecessary duplicate animation libraries if not actually required by implemented UI.

Raise web TypeScript strictness when feasible without weakening the API/core standards.

---

## 18. Restore canonical product documentation

Keep phase audit docs separate from permanent project direction docs.

Ensure the repository has a discoverable canonical set for:

```text
PRD
ARCHITECTURE
DESIGN/UI
SECURITY
AGENTS
ROADMAP
```

Do not replace permanent product docs with a phase audit.

---

## 19. Required verification

Run:

```text
npm ci
npm run typecheck
npm run lint
npm run build
npm test
```

Then execute the full acceptance matrix.

The final report must distinguish:

```text
executed + passed
executed + failed
not executed
blocked
```

Never substitute the commit message for test evidence.

## Hermes final report

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

If any Severity 1 issue remains, report `BLOCKED`.
