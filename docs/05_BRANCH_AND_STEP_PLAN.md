# LOGOS — Exact Branch and Step Plan

## Branch 1: corrective work

Create:

```text
p0.3.1-foundation-alignment
```

Do not continue P0.4 until this branch passes.

### Step 1 — Configuration
Create one validated config source using:

```text
LOGOS_HOME
LOGOS_WORKSPACE_ROOT
LOGOS_API_URL
LOGOS_MODEL_PROVIDER
LOGOS_MODEL_BASE_URL
LOGOS_MODEL_NAME
PORT
```

### Step 2 — Database
Use:

```text
LOGOS_HOME/system/logos.db
```

Add migrations. Remove checked-in runtime DB files.

### Step 3 — Repository layer
Split SQL from server/bootstrap code.

### Step 4 — Document identity
Replace path-derived IDs with stable UUIDs.

### Step 5 — Filesystem security
Implement robust traversal/symlink protection and tests.

### Step 6 — Vector provider
Make actual retrieval backend explicit.

### Step 7 — Memory bug
Fix procedural embedding interpolation and add regression tests.

### Step 8 — API
Use one actual server architecture and mount all routes.

### Step 9 — Validation
Add schemas and bounded inputs.

### Step 10 — Cleanup
Remove test artifacts from vault, logs, backups, stale ORION names.

### Step 11 — Theme
Create centralized MUI v9 light/dark theme.

### Step 12 — Shell
Implement:
- 64 px collapsed rail,
- 248 px expanded rail,
- 56 px top bar,
- active route state,
- no gradients,
- no fake avatar.

### Step 13 — Home
Delete prototype dashboard and rebuild from `03_UI_PRODUCT_SPEC.md`.

### Step 14 — UI audit
Run `04_UI_ACCEPTANCE_CHECKLIST.md`.

### Step 15 — Verification
Run:

```text
npm ci
npm run typecheck
npm run lint
npm run build
npm test
```

## Branch 2: P0.4

Create:

```text
p0.4-vault-sync
```

Implement:
- watcher,
- document indexing,
- reconciliation,
- optimistic concurrency,
- conflict detection,
- rename/move detection,
- writer identity,
- atomic writes,
- SSE metadata,
- sync UI,
- integration tests.

## Branch 3: P0.5

Create:

```text
p0.5-context-engine
```

Implement real Context Engine:

```text
request
-> intent
-> project
-> conversation
-> documents
-> memory
-> decisions
-> tasks
-> people/agents
-> context bundle
```

Retrieval finds candidates. Context assembly decides relevance.

## Branch 4: P0.6

```text
p0.6-memory-lifecycle
```

Implement:

```text
short-term
candidate
durable
superseded
expired
forgotten
```

with provenance, confidence, contradiction, promotion, and audit.

## Branch 5: P0.7

```text
p0.7-permissions-execution
```

Implement:

```text
proposal
-> approval
-> execution
-> verification
-> result
```

## Branch 6: P0.8

```text
p0.8-agents-managers
```

Implement agent registry, roles, scopes, permissions, assignment, execution, evaluation, pause, replace, archive.

## Branch 7: P0.9

```text
p0.9-councils
```

Implement councils, roster, sessions, arguments, disagreement, synthesis, decisions, actions, persistence.

## Branch 8: P1.0

```text
p1.0-projects-tasks-decisions
```

Make projects, tasks, decisions, and relationships first-class runtime entities.

## Branch 9: P1.1

```text
p1.1-automation-scheduling
```

Implement schedules, triggers, permissions, execution history, retry, failure, notifications.

## Branch 10: P1.2

```text
p1.2-model-orchestration
```

Implement replaceable ModelProvider, streaming, structured tool calls, cancellation, timeout, retries, and usage accounting.

## Branch 11: P1.3

```text
p1.3-evaluation-retrieval
```

Implement retrieval, context, answer, tool, memory, and regression evaluation.

## Branch 12: P1.4

```text
p1.4-self-improvement
```

Implement failure analysis, workflow improvement proposals, instruction versioning, controlled experiments, and rollback.

## Branch 13: P1.5

```text
p1.5-hardening
```

Implement backup/restore, migrations, corruption detection, audit logs, structured logging, health checks, graceful shutdown, and crash recovery.

## Branch 14: release

```text
release/v1.0.0
```

Only after clean install, migration, vault continuity, memory, agents, councils, automation, approval, verification, UI, documentation, and backup/restore are proven.
