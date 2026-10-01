# LOGOS — Target Repository Structure

Create folders only when their phase requires them.

```text
LOGOS/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── app.ts
│   │   │   ├── server.ts
│   │   │   ├── config/
│   │   │   ├── auth/
│   │   │   ├── db/
│   │   │   │   ├── client.ts
│   │   │   │   ├── migrations/
│   │   │   │   └── repositories/
│   │   │   ├── documents/
│   │   │   ├── vault/
│   │   │   ├── memory/
│   │   │   ├── retrieval/
│   │   │   │   └── providers/
│   │   │   ├── context/
│   │   │   ├── agents/
│   │   │   ├── councils/
│   │   │   ├── projects/
│   │   │   ├── tasks/
│   │   │   ├── decisions/
│   │   │   ├── automation/
│   │   │   ├── scheduling/
│   │   │   ├── execution/
│   │   │   ├── evaluation/
│   │   │   ├── model/
│   │   │   │   └── adapters/
│   │   │   ├── api/
│   │   │   │   ├── routes/
│   │   │   │   ├── middleware/
│   │   │   │   └── schemas/
│   │   │   └── observability/
│   │   └── tests/
│   │       ├── unit/
│   │       ├── integration/
│   │       └── fixtures/
│   └── web/
│       ├── app/
│       │   ├── page.tsx
│       │   ├── chat/
│       │   ├── work/
│       │   ├── vault/
│       │   ├── memory/
│       │   ├── people/
│       │   ├── automations/
│       │   ├── settings/
│       │   ├── system/
│       │   └── components/
│       ├── src/
│       │   ├── theme/
│       │   │   ├── tokens.ts
│       │   │   ├── theme.ts
│       │   │   └── ThemeRegistry.tsx
│       │   ├── api/
│       │   ├── hooks/
│       │   ├── types/
│       │   └── utils/
│       └── tests/
├── packages/
│   ├── contracts/
│   ├── core/
│   └── ui/
├── docs/
├── storage/
│   └── workspace/
│       └── vault/
└── package.json
```

## Function boundaries

### Documents

```text
createDocument
getDocument
updateDocument
deleteDocument
listDocuments
reconcileDocuments
```

### Vault

```text
startWatcher
stopWatcher
normalizeEvent
identifyWriter
readDocument
writeDocument
deleteDocument
moveDocument
```

### Conflicts

```text
checkExpectedVersion
checkExpectedHash
createConflict
resolveConflict
```

### Memory

```text
createMemory
searchMemory
promoteMemory
supersedeMemory
expireMemory
forgetMemory
```

### Context

```text
buildContext
rankContext
trimContext
explainContext
```

### Agents

```text
registerAgent
assignTask
runAgent
pauseAgent
replaceAgent
evaluateAgent
```

### Councils

```text
createCouncil
updateRoster
startSession
addArgument
recordDisagreement
synthesizeSession
finalizeSession
```

### Execution

```text
createProposal
approveProposal
executeProposal
verifyExecution
recordExecution
```

## Dependency direction

```text
routes
  ↓
services
  ↓
repositories/providers
  ↓
core/platform
```

Never:

```text
repository -> route
core -> UI
database -> React
UI -> direct SQL
```
