# LOGOS — P0.4.1 Acceptance Test Matrix

## A. Filesystem round-trip

### A1 Create

Action:

```text
create projects/test.md through API
```

Verify:

- file exists on disk,
- content matches request,
- DB row exists,
- version = 1,
- one created event exists,
- returned hash equals actual file hash.

### A2 Update

Write v2 with expected v1 version/hash.

Verify:

- real file changes,
- DB hash changes,
- version increments exactly once,
- one modified event exists.

### A3 Same content

Write identical content.

Verify:

- file unchanged,
- version unchanged,
- no duplicate modification event.

### A4 Delete

Delete with expected state.

Verify:

- file is gone,
- document is tombstoned,
- deleted event exists,
- prior event history still exists.

---

## B. Rename / move

### B1 Rename

Rename:

```text
projects/a.md -> projects/b.md
```

Verify:

- same document ID,
- new path stored,
- `previous_path = projects/a.md`,
- exactly one rename event,
- no transient deletion event is published.

### B2 Move

Move:

```text
projects/a.md -> archive/a.md
```

Verify:

- same document ID,
- event type moved,
- previous path recorded.

### B3 Duplicate content

Create:

```text
projects/a.md
projects/b.md
```

with identical content but as two independent files.

Verify:

- two different document IDs,
- not classified as rename.

---

## C. Reconciliation

### C1 Clean reconcile

Run twice without changes.

Expected second run:

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

Verify nothing in `archive/` changes state.

### C3 Missing file

Remove a file externally.

Reconcile.

Verify a tombstone + deleted event, not destructive history removal.

### C4 Read error

Make one test file unreadable or force a controlled fixture error.

Verify it does not become a deletion merely because the scanner could not read it.

### C5 Oversized file

Create a Markdown file larger than 10 MB.

Verify it is skipped/rejected without reading the whole file into memory unnecessarily.

---

## D. Concurrency

### D1 Stale version

Client has:

```text
v7
```

File is advanced to:

```text
v8
```

Client writes expecting v7.

Expected:

```text
409 Conflict
```

Verify no file or DB mutation from the stale write.

### D2 Wrong hash

Expected version is correct but hash is wrong.

Expected:

```text
409 Conflict
```

### D3 Live file changed during write

Force the file to change between state validation and mutation.

Expected:

```text
409 Conflict
```

No silent overwrite.

---

## E. Writer identity

Perform equivalent writes from:

```text
USER
LOGOS
AGENT
AUTOMATION
```

Verify the recorded actor comes from the execution context, not an arbitrary browser field.

---

## F. SSE

### F1 Connect

Open:

```text
/api/vault/events
```

Verify the stream connects.

### F2 Event

Create/modify a Markdown file.

Verify browser receives metadata only:

```text
documentId
path
event
version
hash
writer
timestamp
```

No Markdown body.

### F3 Reconnect

Close the connection and reconnect.

Verify the UI returns to a usable state and refetches current data.

---

## G. Security

### G1 Path traversal

Reject:

```text
../secret.md
..\\secret.md
C:\\secret.md
\\\\server\\share\\secret.md
/etc/passwd
```

### G2 Symlink escape

Create a vault child path that points outside the vault.

Verify read/write/list operations reject it.

### G3 Network exposure

Start API with default configuration.

Verify it is bound to localhost only unless explicitly configured otherwise.

---

## H. UI truthfulness

### H1 Home

Verify no fabricated project statuses or next actions.

### H2 Vault

Select a document.

Verify preview contains actual document content.

### H3 Sync status

Only display `Synced just now` after actual reconciliation completes.

### H4 System

All values shown are real runtime values.

### H5 Settings

No fake toggles claim to change system behavior.

---

## I. Lifecycle

### I1 API restart

Restart API.

Verify:

- existing documents remain,
- versions remain,
- event history remains,
- watcher restarts cleanly.

### I2 Different working directory

Start the API from outside the repository directory.

Verify the runtime still resolves:

```text
LOGOS_HOME/system/logos.db
```

and the configured vault root correctly.
