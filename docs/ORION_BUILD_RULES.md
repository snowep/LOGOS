# ORION — BUILD RULES

Version: 1.1
Status: Canonical (Updated to allow TypeScript)

## 1. Language
TypeScript and TSX are preferred.
JavaScript and JSX are still allowed for gradual migration.
No Python.

## 2. Stack
- Next.js
- React
- Node.js
- Express
- MUI
- SQLite
- Markdown/filesystem
- TypeScript

## 3. Model
Nemotron is a replaceable provider.
OpenClaw is not ORION.
Open WebUI is not ORION.

## 4. Naming
Use names that explain the job.
Good:
```text
findRelevantContext
createProposal
approveProposal
executeApprovedAction
verifyResult
```
Avoid unclear names like:
```text
hydrateCtxGraph
runStage7
mutateV2
```

## 5. Errors
Every external operation can fail.
Handle:
- network errors
- database errors
- model errors
- filesystem errors
- permission errors
- timeout
- conflicts
Do not hide them.

## 6. API validation
Treat all browser input as untrusted.
Validate:
- IDs
- strings
- paths
- limits
- enum values
- object shapes

## 7. Business logic
Do not put core business logic inside React pages.
The UI displays and requests.
The backend decides and performs.

## 8. Model output
Never do:
```javascript
await fs.writeFile(modelOutput.path, modelOutput.content);
```
Instead:
```text
model
→ structured intent
→ proposal
→ approval
→ execution
```

## 9. Tests
Every new important behavior needs tests.
At minimum:
- success
- bad input
- permission/security failure
- important edge case

## 10. UI
Every important screen needs:
- loading
- empty
- error
- success
- approval state where relevant

## 11. Dependencies
Before adding a package, ask:
- why is it needed?
- is existing code enough?
- is it maintained?
- is the license acceptable?
- can the project avoid it?

## 12. Free-first
Prefer:
1. open source
2. free
3. self-hostable
4. replaceable
5. maintained
Paid services may be optional adapters.

## 13. Database
Start with SQLite.
Do not add another database until a real measured need exists.

## 14. Queue
Start with a SQLite-backed queue.
Do not add Redis or distributed infrastructure without a demonstrated reason.

## 15. Git
Use checkpoints before large changes.
Do not destroy valuable history.

## 16. Phase discipline
Implement only the current phase.
Do not sneak later features into the current phase because they seem easy.

## 17. Completion
A feature is complete only when:
- behavior works
- errors are handled
- tests exist
- documentation is accurate
- old conflicting behavior is removed
- no placeholder is hiding unfinished work

## 18. Stop rule
Stop and report when:
- a security decision is unclear
- a migration could lose data
- a required dependency is missing
- the phase depends on an unbuilt later phase
Do not invent a fake solution just to keep going.