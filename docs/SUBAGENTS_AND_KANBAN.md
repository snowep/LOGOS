# LOGOS Development Subagent Team & Kanban System

## 1. Subagent Team Structure

| Agent Role | Responsibility | Scope |
|---|---|---|
| **Git & Release Manager** | Versioning, semantic releases, branch strategy, commit linting, checkpoints | Entire workspace |
| **Frontend Engineer** | Next.js App Router, MUI v5/v6 components, state management, Live Dashboard | `apps/web/` |
| **Backend & Sync Engineer**| Express API, Chokidar file watcher, SSE streams, WebSocket fallback | `apps/api/` |
| **Database & Knowledge Specialist** | Prisma schema, SQLite migrations, safe path resolver, Markdown serialization | `packages/core/`, `storage/` |
| **QA & Verification Engineer** | Unit tests, integration tests, path traversal security, rollback verification | `tests/` |

---

## 2. Kanban Board Workflow (GitHub Projects v2)

```text
[ BACKLOG ] ──> [ IN PROGRESS ] ──> [ CODE REVIEW / QA ] ──> [ VERIFIED / DONE ]
```

### Active Phase Tracking
- **P0.1 Constitution & Skeleton**: `[ DONE ]`
- **P0.2 Web + API Dashboard**: `[ IN PROGRESS ]`
- **P0.3 SQLite + Prisma**: `[ BACKLOG ]`
- **P0.4 Bidirectional Sync**: `[ BACKLOG ]`
- **P0.5 Domain Model**: `[ BACKLOG ]`
- **P0.6 Context Engine**: `[ BACKLOG ]`
- **P0.7 Memory Lifecycle**: `[ BACKLOG ]`
- **P0.8 Model Provider**: `[ BACKLOG ]`
- **P0.9 Proposal & Approval**: `[ BACKLOG ]`
- **P0.10 Execution & Verification**: `[ BACKLOG ]`
