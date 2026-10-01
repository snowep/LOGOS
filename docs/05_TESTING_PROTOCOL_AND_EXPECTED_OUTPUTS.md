# LOGOS — Testing Protocol and Expected Outputs

## Purpose

This document defines how Hermes must test LOGOS after every update and how to determine **which layer caused a failure**.

The goal is not merely to obtain a green test run.

The goal is:

```text
change
  -> run the same verification contract
  -> compare expected vs actual behavior
  -> identify the first violated invariant
  -> isolate the responsible layer
  -> fix the cause
  -> rerun the original failing test
  -> rerun the complete phase gate
```

A test failure must never be “fixed” by weakening the assertion, deleting the test, hiding the error, replacing real behavior with mock data, or changing the expected result without a documented product decision.

---

# 1. The verification loop for every update

Hermes must use the following loop for every non-trivial code update.

## Step 1 — Record the baseline

Before changing code, record:

```text
BRANCH:
COMMIT:
WORKTREE:
NODE VERSION:
NPM VERSION:
OS:
LOGOS_HOME:
VAULT ROOT:
DB PATH:
```

Also record the current gate result:

```text
npm ci
npm run typecheck
npm run lint
npm run build
npm test
```

Do not report a baseline as passing unless the commands were actually executed.

## Step 2 — Define the invariant being changed

Every implementation change must name the behavior it is supposed to preserve or change.

Examples:

```text
Watcher delete -> active document becomes tombstoned.
Create existing path -> reject before filesystem mutation.
Update missing live file -> 409, zero mutation.
Same path + same hash -> no version increment, no event.
HTTP document write -> USER writer identity.
Reconcile rename -> preserve UUID only with unique active evidence.
```

## Step 3 — Run the smallest targeted test first

Run the test that directly exercises the changed invariant.

Examples:

```text
changed watcher delete logic
 -> watcher integration test

changed create safety
 -> create-existing-path test

changed reconciliation
 -> scoped reconcile + rename + tombstone tests

changed SSE client
 -> SSE contract/re-render stability tests
```

## Step 4 — Run the full phase gate

After the targeted test passes:

```text
npm ci
npm run typecheck
npm run lint
npm run build
npm test
```

Then run manual acceptance for the affected phase.

## Step 5 — Compare state, not just exit codes

A command returning `0` is necessary but not sufficient.

For stateful tests compare:

```text
filesystem
DB row
DB version
DB hash
DB deleted_at
DB event history
SSE event
API response
UI-visible state
```

A test is not successful when only one of these is correct.

---

# 2. Standard expected command outputs

The exact number of tests may change as coverage grows. Do **not** hardcode a historical test count such as “14 passing” as the acceptance criterion.

The required semantic result is:

### `npm ci`

Expected:

```text
exit code = 0
clean dependency installation
lockfile accepted without unresolved dependency errors
```

Failure indicates a **toolchain/dependency layer** problem before application behavior is evaluated.

### `npm run typecheck`

Expected:

```text
exit code = 0
no TypeScript errors
no unresolved imports
no contract/type mismatch diagnostics
```

Failure indicates:

```text
contracts
imports
interfaces
module configuration
component/API shape
```

Do not continue treating runtime behavior as trustworthy until type errors are resolved.

### `npm run lint`

Expected:

```text
exit code = 0
zero lint errors
```

Warnings may be allowed only when intentionally documented by the repository policy.

Lint must not be disabled to make a phase pass.

### `npm run build`

Expected:

```text
exit code = 0
production build completes
no missing module errors
no build-time route/configuration errors
```

A successful development server is not a substitute for a successful production build.

### `npm test`

Expected:

```text
exit code = 0
all committed automated tests pass
no skipped mandatory tests
no focused-test residue such as .only()
```

If the command reports fewer tests than expected, inspect why before accepting it.

### Manual acceptance

Expected:

```text
actual user-visible behavior matches the documented phase contract
```

A visually correct screen with fake data is a failure.

A green backend test with broken UI behavior is a failure.

---

# 3. Standard test record format

Every phase-level verification report should capture each important test using:

```text
TEST ID:
PURPOSE:
PRECONDITION:
ACTION:
EXPECTED:
ACTUAL:
FILES TOUCHED:
DB STATE BEFORE:
DB STATE AFTER:
FILESYSTEM STATE BEFORE:
FILESYSTEM STATE AFTER:
EVENTS BEFORE:
EVENTS AFTER:
HTTP STATUS / RESPONSE:
PASS/FAIL:
ROOT-CAUSE LAYER:
ROOT-CAUSE:
REGRESSION TEST:
```

The `ROOT-CAUSE LAYER` must use one of:

```text
UI
API ROUTE
SERVICE
WATCHER
RECONCILE
DATABASE
FILESYSTEM
CONTRACT
AUTH
SSE
CONFIGURATION
TOOLCHAIN
TEST HARNESS
DOCUMENTATION
```

---

# 4. State invariants that must never be violated

These are stronger than individual test cases.

## Document identity

```text
one live document = one stable UUID
path may change
UUID must not change merely because path changes
```

## Versioning

```text
version increments exactly once for a real content mutation
same content does not increment version
failed operation does not increment version
```

## Hashing

```text
DB current_hash = hash(actual live file content)
```

for a successfully active document.

## Tombstone

```text
external confirmed delete
 -> deleted_at set
 -> document row preserved
 -> deleted event recorded
```

Never:

```text
normal vault deletion -> DELETE FROM documents
```

## Failed mutation

For a failed create/update/delete operation:

```text
no unintended filesystem mutation
no unintended DB mutation
no success event
no success response
```

## Writer identity

```text
HTTP public user operation -> USER
LOGOS internal operation -> LOGOS
AGENT internal operation -> AGENT
AUTOMATION internal operation -> AUTOMATION
```

The client must not be able to impersonate another actor by putting a writer value into a public request body.

## Reconciliation

A clean second reconcile must be idempotent:

```text
created = 0
updated = 0
deleted = 0
renamed = 0
conflicts = 0
```

assuming nothing changed between runs.

## SSE

A filesystem/database change produces one canonical event vocabulary:

```text
created
modified
deleted
renamed
moved
reconcile-complete
```

The producer and browser consumer must agree on the event names.

---

# 5. Phase-by-phase expected behavior

The historical phases below define what Hermes should use as the regression contract when reviewing subsequent changes.

The exact implementation may evolve, but the invariants must remain intact unless a later phase explicitly changes them.

---

## P0.1 — Foundation

### Purpose

Establish the repository, project documentation, executable application shell, and basic development workflow.

### Expected outputs

```text
repository structure is understandable
project starts locally
frontend renders
backend can start
canonical project docs exist
basic verification commands are defined
```

Expected verification:

```text
npm ci                  -> success
npm run typecheck      -> success
npm run lint           -> success
npm run build          -> success
npm test               -> success, where tests exist
```

### Failure isolation

If the application cannot start:

```text
check package.json
check workspace scripts
check Node version
check environment loading
```

If the UI builds but backend does not:

```text
inspect apps/api
inspect root workspace scripts
inspect shared packages
```

If documentation disagrees with code:

```text
DOCUMENTATION layer failure
```

Do not fix this by silently rewriting product direction during an unrelated implementation change.

---

## P0.2 — Context / Memory Infrastructure

### Purpose

Establish the conceptual and storage boundary for working context, episodic memory, semantic memory, and procedural memory.

### Expected outputs

```text
working context exists as a distinct concept
memory types have explicit boundaries
memory is not automatically equated with filesystem events
metadata identifies provenance/actor where required
```

A filesystem event must not automatically become durable memory.

Expected behavioral distinction:

```text
file changed
 -> synchronization event

promotion decision
 -> memory operation
```

### Failure isolation

If a file event unexpectedly creates a memory:

```text
SERVICE / MEMORY boundary
```

If two memory types are being stored interchangeably:

```text
DATABASE / CONTRACT layer
```

If UI shows memory that does not exist in storage:

```text
UI truthfulness layer
```

---

## P0.3 — SQLite + Filesystem Foundation

### Purpose

Establish one canonical runtime database, document identity, versioning, filesystem safety, and API foundations.

### Expected outputs

```text
one canonical SQLite database
stable document UUIDs
mutable relative paths
content hashes
monotonic versions
preserved document history
safe path resolution
shared writer identity vocabulary
```

The database must be outside repository source layout for normal runtime use.

Expected document lifecycle:

```text
create
 -> UUID
 -> version 1
 -> hash
 -> DB row
 -> event history
```

Expected path safety:

```text
relative safe path -> accepted
absolute path -> rejected
traversal -> rejected
root-prefix sibling escape -> rejected
symlink/junction escape -> rejected
```

### Failure isolation

DB missing or recreated unexpectedly:

```text
CONFIGURATION / DATABASE
```

Document UUID changes after rename:

```text
DATABASE / DOCUMENT IDENTITY
```

Path traversal succeeds:

```text
FILESYSTEM safety
```

Runtime data appears in Git:

```text
REPOSITORY / GITIGNORE
```

---

## P0.3.1 — Foundation Alignment

### Purpose

Align the foundation around Express services/routes, Zod validation, optimistic concurrency, the consolidated UI shell, and the first coherent phase-wide contracts.

### Expected outputs

```text
routes -> services -> repositories/core
Zod validates public inputs
optimistic version/hash checks exist
one canonical Shell
shared theme tokens
truthful early UI
```

Expected API mutation behavior:

```text
matching expected version/hash -> success
stale version -> 409
wrong hash -> 409
```

### Failure isolation

Validation bypass:

```text
API ROUTE / CONTRACT
```

Stale write succeeds:

```text
SERVICE / DATABASE concurrency
```

UI page creates a second shell:

```text
UI / ARCHITECTURE
```

---

## P0.4 — Vault Synchronization

### Purpose

Synchronize real Markdown files with canonical SQLite document state and detect external create/modify/delete/rename/move activity.

### Expected outputs

```text
Markdown eligibility rules are shared
watcher observes eligible files
reconcile scans eligible files
rename/move may preserve identity when evidence is sufficient
duplicate content does not automatically mean rename
read errors do not become deletion
```

Expected watcher transitions:

```text
add
 -> created

change with new hash
 -> modified + version increment

change with same hash
 -> no-op

unlink beyond rename window
 -> deletion/tombstone

unlink + matching add
 -> rename/move or same-path recreation according to evidence
```

### Expected reconcile behavior

First clean scan may create/update/rename as needed.

Second scan without changes must be:

```text
0 created
0 updated
0 deleted
0 renamed
0 conflicts
```

### Failure isolation

Watcher works but reconcile disagrees:

```text
RECONCILE layer
```

Reconcile works but watcher reports wrong writer:

```text
WATCHER / WRITER identity
```

A duplicate-content file is merged incorrectly:

```text
RECONCILE identity evidence
```

Read failure causes deletion:

```text
RECONCILE scan/error handling
```

---

## P0.4.1 — Vault Sync Hardening

### Purpose

Strengthen the synchronization core around document service boundaries, tombstones, atomic writes, SSE, writer identity, and UI truthfulness.

### Expected document-service lifecycle

Create:

```text
validate
 -> check active DB path
 -> check live filesystem path
 -> atomic write
 -> verify hash
 -> DB insert
 -> created event
 -> response
```

Update:

```text
load active document
 -> expected version/hash match
 -> live file exists
 -> live file hash matches DB
 -> atomic write
 -> verify hash
 -> DB update
 -> modified event
```

Delete:

```text
load active document
 -> expected state match
 -> live file matches if present
 -> controlled delete/reversible delete strategy
 -> tombstone
 -> deleted event
```

### Expected UI behavior

```text
real documents
real content
real state
truthful empty/error states
no fake actions
```

### Failure isolation

If filesystem state is correct but DB state is stale:

```text
DATABASE transaction/recovery
```

If DB state is correct but SSE is stale:

```text
SSE contract/consumer
```

If action appears operational but only logs to console:

```text
UI truthfulness
```

---

## P0.4.2 — Vault Sync Integrity

### Purpose

Close the remaining integrity defects discovered during the P0.4.1 audit.

### Required expected outputs

#### A. Tombstone consistency

External confirmed deletion:

```text
file absent
DB row remains
DB deleted_at != NULL
one deleted event
active document listing excludes row
```

#### B. Create safety

Existing file:

```text
create request
 -> conflict
 -> original bytes unchanged
 -> no accidental overwrite
 -> no new DB identity
```

#### C. Update safety

Missing live file:

```text
update request
 -> 409
 -> file remains absent
 -> DB unchanged
 -> no event
```

Changed live file:

```text
update request with stale hash
 -> 409
 -> external file preserved
 -> DB unchanged
```

#### D. Rename/move identity

Unique live active candidate:

```text
same UUID
new path
one renamed/moved event
previous_path recorded
```

Ambiguous duplicate content:

```text
no silent merge
```

Tombstoned candidate:

```text
must not silently resurrect
```

#### E. Idempotence

Same path + same hash:

```text
same version
no semantic modification
no duplicate event
```

#### F. Writer identity

Public HTTP API:

```text
USER
```

Internal actor:

```text
LOGOS / AGENT / AUTOMATION
```

depending on explicit internal actor context.

#### G. SSE contract

Reconciliation producer and browser listener use exactly:

```text
reconcile-complete
```

A file event uses one event envelope, not an unrelated parallel vocabulary.

#### H. Security boundary

Default API binding:

```text
127.0.0.1
```

Browser/API origin policy must not silently become unrestricted for production usage.

### Failure isolation

See Section 8 and Section 9 below. P0.4.2 failures must be traced to the earliest violated invariant rather than treated as generic “sync bugs”.

---

# 6. Target test cases with exact expected results

These cases are mandatory for the current vault synchronization core.

## T01 — Create a new Markdown document

### Arrange

```text
empty safe test vault
empty test DB
```

### Act

Create:

```text
projects/a.md
content = "# Hello"
```

### Expect

```text
HTTP = 201
file exists
file content exactly matches
DB row exists
version = 1
deleted_at = NULL
current_hash = SHA-256(file)
one created event
writer = USER for public HTTP
```

## T02 — Create existing path

### Arrange

```text
projects/a.md contains original content
```

### Act

Attempt `createDocument(projects/a.md, new-content)`.

### Expect

```text
HTTP/Service = conflict
original bytes unchanged
DB unchanged
document count unchanged
no created event for the failed operation
```

## T03 — Update correct expected state

### Arrange

```text
version = 1
hash = A
file = content A
```

### Act

Update with expected `(1, A)` to content B.

### Expect

```text
success
file = B
DB hash = hash(B)
version = 2
one modified event
```

## T04 — Update stale version

### Expect

```text
409
file unchanged
DB unchanged
no event
```

## T05 — Update stale hash

### Expect

```text
409
file unchanged
DB unchanged
no event
```

## T06 — Update externally changed file

### Arrange

```text
DB expects A
external filesystem now contains B
```

### Expect

```text
409
B remains on disk
DB still records A
version unchanged
no successful modified event
```

## T07 — Update externally deleted file

### Arrange

```text
DB says active
file is externally deleted
```

### Expect

```text
409
file remains absent
DB row remains active until watcher/reconcile processes deletion
update does not recreate file
no update event
```

## T08 — Watcher external delete

### Expect

After the bounded deletion window:

```text
file absent
DB deleted_at set
one deleted event
active-list excludes document
history still queryable
```

## T09 — Watcher rename

### Act

```text
projects/a.md -> projects/b.md
```

### Expect

```text
same UUID
path = projects/b.md
one renamed event
previous_path = projects/a.md
no deleted event
no second document identity
```

## T10 — Watcher move

### Act

```text
projects/a.md -> archive/a.md
```

### Expect

```text
same UUID
path = archive/a.md
one moved event
previous_path = projects/a.md
```

## T11 — Duplicate content is not rename

### Arrange

```text
projects/a.md = X
projects/b.md = X
```

### Expect

```text
two UUIDs
two active documents
no rename classification merely from equal hash
```

## T12 — Tombstoned hash must not resurrect silently

### Arrange

```text
a.md existed
then was tombstoned
new file b.md has identical content
```

### Expect

```text
historical document stays tombstoned
new file is a new identity
OR an explicit documented restore path is invoked
```

No silent resurrection.

## T13 — Same content is idempotent

### Act

Process the same file with unchanged bytes repeatedly.

### Expect

```text
version unchanged
no modified event
no duplicate mutation SSE
```

## T14 — Full reconcile twice

### Expect

First run:

```text
state converges to filesystem
```

Second run:

```text
created = 0
updated = 0
deleted = 0
renamed = 0
conflicts = 0
```

## T15 — Scoped reconcile

### Arrange

```text
projects/a.md
archive/b.md
```

### Act

Reconcile `projects/`.

### Expect

```text
projects/ can change
archive/b.md is not deleted/modified merely because it is outside scope
```

## T16 — Reconcile read error

### Expect

```text
scan reports skipped/partial condition
no deletion based solely on read failure
```

## T17 — HTTP writer identity

### Act

Send public document write.

### Expect

```text
writer_identity = USER
```

Any client-supplied writer field must not override this.

## T18 — Internal writer identity

### Expect

Explicit internal actor produces exactly its declared writer identity:

```text
LOGOS
AGENT
AUTOMATION
```

## T19 — SSE reconcile event

### Act

Run reconcile.

### Expect

Browser receives:

```text
event name = reconcile-complete
```

not `sync-complete`.

## T20 — SSE re-render stability

### Act

Cause repeated React state updates while `/chat` or `/vault` is mounted.

### Expect

```text
one persistent EventSource connection
no reconnect loop caused by callback identity changes
```

## T21 — Filesystem traversal

### Expect

Each is rejected:

```text
../secret.md
..\\secret.md
C:\\secret.md
\\\\server\\share\\secret.md
/etc/passwd
```

Also reject:

```text
symlink escape
junction escape
root-prefix sibling escape
```

## T22 — Authentication boundary

For any route documented as authenticated:

```text
missing credentials -> 401
invalid credentials -> 401
insufficient permission -> 403
valid permission -> allowed
```

Do not declare security complete when an auth module exists but middleware is not mounted.

---

# 7. Fault-injection tests

Normal tests prove the happy path.

Fault-injection tests prove that LOGOS fails safely.

Hermes should add deterministic test hooks where necessary instead of relying on timing races.

## F01 — DB failure after filesystem preparation

Force the DB transaction/event insert to fail.

Expected:

```text
no false success
filesystem recovered or safely left in a documented recoverable state
DB has no partial success record
no success event
```

## F02 — File disappears during update

Use a deterministic barrier:

```text
validate live file
pause
external delete
resume update
```

Expected:

```text
409 or safe failure
no silent file recreation
no version increment
no success event
```

## F03 — File changes during update

Expected:

```text
409 or safe failure
external content preserved
DB does not claim a content version it did not successfully establish
```

## F04 — Watcher receives duplicate events

Expected:

```text
one semantic state change
one version increment at most
one relevant semantic event
```

## F05 — Reconcile encounters unreadable file

Expected:

```text
skip/partial result
no false deletion
```

## F06 — Duplicate-content rename ambiguity

Expected:

```text
no identity merge
no silent path reassignment when evidence is ambiguous
```

---

# 8. Failure-isolation decision tree

When a test fails, Hermes must identify the **first incorrect layer**.

## Case A — Test does not compile

Inspect in this order:

```text
contract/type
 -> import
 -> tsconfig/module system
 -> generated types
```

Do not debug filesystem behavior until compilation is clean.

## Case B — API returns wrong HTTP status

Inspect:

```text
Zod validation
 -> route mapping
 -> service error type
 -> safe error handler
```

## Case C — API status is correct but state is wrong

Inspect:

```text
service preconditions
 -> filesystem operation
 -> DB transaction
 -> event recording
```

## Case D — DB is correct but filesystem is wrong

Inspect:

```text
resolveSafePath
 -> precondition check
 -> atomic write/delete
 -> verification
 -> recovery path
```

## Case E — Filesystem is correct but DB is wrong

Inspect:

```text
transaction boundary
 -> commit failure handling
 -> stale DB lookup
 -> event transaction
```

## Case F — DB and filesystem are correct but event is wrong

Inspect:

```text
recordDocumentEvent
 -> event type
 -> writer identity
 -> payload construction
 -> broadcast
```

## Case G — Backend event is correct but UI does not react

Inspect:

```text
shared contract
 -> EventSource listener name
 -> JSON parsing
 -> React callback stability
 -> refetch/invalidation
```

## Case H — UI looks correct but contains fake data

Inspect:

```text
API fetch
 -> loading/error branch
 -> fallback branch
 -> hardcoded state
```

Remove the fabricated source. Do not merely hide it visually.

## Case I — Test is green but behavior is wrong manually

Inspect:

```text
test realism
 -> wrong fixture
 -> wrong environment
 -> test bypasses actual service
 -> mocked dependency hides defect
```

Then add an integration test against the actual path.

---

# 9. Root-cause evidence collection

When a current-branch test fails, Hermes must capture enough information to eliminate the cause rather than guess.

For synchronization bugs capture:

```text
1. exact commit SHA
2. exact test ID
3. expected filesystem state
4. actual filesystem state
5. expected DB row
6. actual DB row
7. expected event sequence
8. actual event sequence
9. expected HTTP status
10. actual HTTP status/body
11. writer identity
12. current watcher state if observable
13. reconcile scope
14. content hashes
15. timestamps for race-sensitive operations
16. relevant stack trace
17. changed files in the commit
```

For UI bugs additionally capture:

```text
viewport
route
visible state
API response used by screen
component state
console/runtime error
```

For toolchain bugs capture:

```text
Node version
npm version
lockfile state
workspace package versions
exact command
full first error
```

---

# 10. How to compare an update against the previous state

Every Hermes correction should be reviewed as a delta:

```text
BEFORE
  ↓
expected invariant
  ↓
code change
  ↓
AFTER
```

For each changed invariant, Hermes should answer:

```text
What was broken?
What exact line/module caused it?
What changed?
What test proves it?
What new regression risk did the fix introduce?
```

A good corrective commit should make the explanation mechanically traceable.

---

# 11. Phase acceptance rule

A phase can only be marked accepted when all applicable layers pass:

```text
A. compile/type
B. lint
C. production build
D. unit tests
E. integration tests
F. fault-injection tests where required
G. manual acceptance
H. truthfulness scan
I. security checks
J. documentation consistency
```

A single Severity 1 unresolved invariant blocks phase acceptance.

A green command with a known violated invariant is still a failed phase.

---

# 12. Required Hermes final report

Hermes must return:

```text
STATUS: COMPLETE | BLOCKED | FAILED

BRANCH:
COMMIT:

BASELINE:
- npm ci:
- typecheck:
- lint:
- build:
- test:

TARGETED TESTS:
- test ID:
- expected:
- actual:
- result:

FULL GATE:
- npm ci:
- npm run typecheck:
- npm run lint:
- npm run build:
- npm test:

MANUAL ACCEPTANCE:

STATE VERIFICATION:
- filesystem:
- database:
- events:
- API:
- UI:

FILES INSPECTED:
FILES CHANGED:

FINDINGS:

ROOT CAUSE:

REGRESSION COVERAGE:

RISKS:

NEXT ACTION:
```

For a failure, Hermes must add:

```text
FIRST FAILED INVARIANT:
FAILED LAYER:
PROBABLE ROOT CAUSE:
EVIDENCE:
WHY THE FAILURE IS NOT IN THE ADJACENT LAYER:
```

---

# 13. Prohibited verification shortcuts

Never accept any of the following as a phase result:

```text
“the code looks correct”
“the commit says all gates pass”
“the app starts”
“the UI looks good”
“the test count is unchanged”
“the error disappeared”
“we mocked it because the real environment is hard”
```

Also prohibited:

```text
removing a failing test
loosening an assertion without product justification
adding catch-all fallbacks that hide defects
returning sample data on API failure
changing a 409 into success just to keep the UI moving
silently dropping events
ignoring database errors
marking CI green without CI evidence
```

---

# 14. Release evidence for every phase

The final phase record should contain:

```text
phase
branch
commit
verification date
Node/npm versions
all command results
test results
manual acceptance results
known limitations
open risks
```

This creates a chain:

```text
P0.1 evidence
   ↓
P0.2 evidence
   ↓
P0.3 evidence
   ↓
P0.3.1 evidence
   ↓
P0.4 evidence
   ↓
P0.4.1 evidence
   ↓
P0.4.2 evidence
   ↓
P0.5
```

A later phase must not erase the verification history of an earlier phase.

---

# 15. Definition of “cause eliminated”

A bug is considered fixed only when all of the following are true:

```text
1. the original failing test passes,
2. a regression test exists for the original failure,
3. the relevant invariant is restored,
4. the neighboring state transitions are still correct,
5. the full phase gate passes,
6. manual behavior agrees with automated evidence,
7. documentation reflects the resulting behavior.
```

The objective is not merely:

```text
FAIL -> PASS
```

It is:

```text
FAIL
 -> isolate first broken invariant
 -> identify root cause
 -> correct root cause
 -> prove original failure is gone
 -> prove adjacent behavior is still safe
 -> prevent recurrence
```

---

# 16. UI component and viewport verification

The UI verification contract is expanded by two dedicated documents:

```text
06_UI_COMPONENT_TEST_MATRIX.md
07_RESPONSIVE_SIZE_AUDIT.md
```

Hermes must use them for every UI-affecting update.

Minimum UI evidence:

```text
component-level test output
loading/empty/error/populated state result
runtime/console error result
truthfulness result
accessibility result
viewport result
```

Minimum responsive evidence:

```text
320x568
390x844
768x1024
1024x768
1440x900
1920x1080
```

The full viewport matrix in `07_RESPONSIVE_SIZE_AUDIT.md` is the authoritative expanded set.

UI acceptance is not complete when the desktop screenshot looks correct. The required component and size tests must pass.
