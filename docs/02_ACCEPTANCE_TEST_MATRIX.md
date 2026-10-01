# LOGOS — P0.4.1 Vault Sync Acceptance Test Matrix

## A. Document service

### A1 Create new Markdown

Verify:

- `.md` or `.markdown` only,
- safe relative path,
- file exists,
- exact content matches,
- final file hash matches returned hash,
- DB row exists,
- version = 1,
- one `created` event exists.

### A2 Create existing path

Precondition:

```text
projects/a.md exists with user content
```

Attempt create at the same path.

Verify:

- request is rejected,
- original file content remains unchanged,
- DB remains unchanged,
- no new document identity is created.

### A3 Update

Write v2 using expected v1 version/hash.

Verify:

- file changes,
- DB hash changes,
- version increments exactly once,
- one `modified` event.

### A4 Same-content update

Write identical content.

Verify:

- no version increment,
- no modification event,
- no duplicate SSE mutation event.

### A5 External file changed before update

Client snapshot:

```text
v1 / hash A
```

Change live file externally to hash B.

Update using snapshot A.

Verify:

```text
409 Conflict
```

and:

- no overwrite,
- no DB mutation,
- no event from failed operation.

### A6 External file deleted before update

Client snapshot says active file exists.

Delete live file externally.

Attempt update.

Verify:

```text
409 Conflict
```

Do not recreate the file.

### A7 Delete

Delete using expected state.

Verify:

- file is gone,
- document row remains,
- `deleted_at` is set,
- one deleted event exists,
- previous event history remains queryable.

---

## B. Watcher

### B1 External create

Create a Markdown file directly on disk.

Verify:

- document identity created,
- created event recorded,
- correct hash,
- actor = USER.

### B2 External modify

Modify an existing file.

Verify one version increment and one modified event.

### B3 Duplicate watcher notification

Force repeated change events with unchanged content.

Verify no version inflation.

### B4 External delete

Delete a tracked file.

Wait beyond rename window.

Verify:

- tombstone exists,
- deleted event exists,
- history remains,
- document is no longer listed as active.

### B5 Rename

```text
projects/a.md -> projects/b.md
```

Verify:

- same document ID,
- path updated,
- previous_path recorded,
- one rename event,
- no deleted event.

### B6 Move

```text
projects/a.md -> archive/a.md
```

Verify same identity and one moved event.

### B7 Rename state cleanup

After rename resolution, verify no stale pending state remains for old/new paths.

### B8 Duplicate content files

Create two independent files with identical content.

Verify:

- two document IDs,
- neither is misclassified as rename.

### B9 Delete then recreate same path

Delete tracked file and allow tombstone.

Create a new file at the same path.

Verify behavior matches the documented restore/new-identity policy.

Do not leave a file present with `deleted_at` still set unless the policy explicitly says so.

---

## C. Reconciliation

### C1 Full clean reconcile

Run twice without changes.

Second run must report:

```text
created 0
updated 0
deleted 0
renamed 0
conflicts 0
```

### C2 Scoped reconcile

Have documents in:

```text
projects/
archive/
```

Reconcile only `projects/`.

Verify archive state is untouched.

### C3 Missing file

Remove tracked file externally, then reconcile.

Verify tombstone + deleted event.

Verify document event history remains.

### C4 Read/stat error

Inject a controlled scan failure.

Verify:

- result reports partial/skipped state,
- file is not marked deleted solely because it could not be read.

### C5 Oversized file

Create a Markdown file larger than 10 MB.

Verify it is rejected/skipped without loading the whole payload unnecessarily.

### C6 Reconcile rename

Move/rename a file outside the watcher event path and reconcile.

Verify existing identity is preserved only when evidence is unique.

### C7 Tombstone candidate

Have a tombstoned document with a hash matching a new file.

Verify the reconcile logic does not silently resurrect it as an active rename.

---

## D. Writer identity

### D1 HTTP user write

Use the public HTTP API.

Verify actor = USER.

### D2 Internal LOGOS write

Invoke the internal service with actor = LOGOS.

Verify actor = LOGOS.

### D3 Agent write

Invoke internal service with actor = AGENT.

Verify actor = AGENT.

### D4 Automation write

Invoke internal service with actor = AUTOMATION.

Verify actor = AUTOMATION.

### D5 Public actor spoofing

Send a JSON body attempting:

```text
writer = LOGOS
```

Verify the public API ignores/rejects that field and records USER.

---

## E. Concurrency

### E1 Stale version

Expected v7, current v8.

Verify `409` and zero mutation.

### E2 Wrong hash

Expected version correct, expected hash wrong.

Verify `409` and zero mutation.

### E3 Live-file race

Use a deterministic test barrier to change the real file after validation but before mutation.

Verify `409`, no silent overwrite, and no successful DB version increment.

### E4 Database event transaction

Force the event insert to fail after document state mutation is prepared.

Verify the document row does not commit partially.

---

## F. SSE

### F1 Connect

Open:

```text
/api/vault/events
```

Verify connection state becomes connected.

### F2 File event

Create/modify a Markdown file.

Verify payload contains metadata only:

```text
documentId
path
event
version
hash
writer
timestamp
```

### F3 Reconcile completion

Run reconciliation.

Verify producer and browser use the same event name.

### F4 Re-render stability

Cause repeated React state updates.

Verify the EventSource is not recreated on every render.

### F5 Reconnect

Break the connection.

Verify the UI reconnects and eventually reaches a usable state.

---

## G. Filesystem safety

Reject:

```text
../secret.md
..\\secret.md
C:\\secret.md
\\\\server\\share\\secret.md
/etc/passwd
```

Reject:

```text
root-prefix sibling attack
symlink escape
junction escape
```

Do not create parent directories before containment is proven.

---

## H. API boundary

### H1 Local bind

Start with defaults.

Verify API binds to:

```text
127.0.0.1
```

### H2 CORS

Verify only configured web origins are allowed for browser mutation requests.

### H3 Authentication

Verify direct mutation access follows the documented local-auth model.

---

## I. UI truthfulness

### I1 Shell

Verify exactly one Shell is rendered.

### I2 Vault

Select a document.

Verify real document content is displayed.

### I3 Vault actions

Verify unavailable actions are not presented as operational.

### I4 Memory

When API fails, verify no fabricated memory appears.

### I5 System

Verify MUI-only page with real runtime values.

### I6 Settings

Verify no no-op setting claims to have changed the system.

### I7 Theme

Verify first launch defaults to dark and visible toggle actually changes theme.

---

## J. Lifecycle

### J1 API restart

Verify documents, versions, tombstones, and event history remain intact.

### J2 Start from another working directory

Verify `LOGOS_HOME/system/logos.db` and configured vault path resolve correctly.
