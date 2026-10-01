# LOGOS — P0.4.2 Vault Sync Integrity Acceptance Matrix

A phase is not accepted until the actual implementation passes the relevant cases below.

## A. Document service

### A1 Create new Markdown

Verify `.md`/`.markdown`, safe relative path, byte limit, exact file content/hash, DB row, version 1, one created event.

### A2 Create existing path

Existing filesystem content must remain byte-for-byte unchanged. DB and event history must remain unchanged. Return an explicit conflict.

### A3 Create contract

Create must not require update-only optimistic concurrency fields unless a deliberate protocol specifies why.

### A4 Same-content update

No version increment and no modification event.

### A5 External file changed before update

Expected state is stale. Verify `409`, no overwrite, no DB mutation, no event.

### A6 External file deleted before update

Verify `409`. The update must not recreate the missing file.

### A7 Delete

File disappears or enters controlled trash; row remains; `deleted_at` is set; exactly one deleted event; history remains queryable.

### A8 DB failure after FS preparation

Force the DB transaction/event write to fail. Verify no misleading success and recoverable filesystem/DB state.

---

## B. Tombstone lifecycle

### B1 External delete -> tombstone

Tracked file deleted directly on disk. After the bounded window the row is tombstoned and absent from the active list.

### B2 Tombstone history

Historical events remain queryable after deletion.

### B3 Same-path recreate

Delete a tracked file, allow tombstone, recreate the same path.

Verify the documented policy exactly. No file may remain present while its row is unintentionally tombstoned.

### B4 Same-content recreate

Same-path recreate with identical content must not be silently treated as a no-op against the old tombstone unless an explicit restore policy exists.

### B5 Different-content recreate

Same-path recreate with different content must not mutate the tombstone in place unless explicit restore semantics say so.

---

## C. Watcher

### C1 External create

Correct identity, hash, version, actor `USER`, one created event.

### C2 External modify

Exactly one version increment and one modified event.

### C3 Duplicate notifications

Repeated watcher events with unchanged content produce no version inflation.

### C4 Rename

Same ID, updated path, previous path captured, one rename event, no deleted event.

### C5 Move

Same ID, updated path, previous path captured, one moved event.

### C6 Rename state cleanup

No stale old/new `pending_*` state after successful rename/move.

### C7 Duplicate content files

Two independent files with identical content remain two identities; hash equality alone is never enough to merge them.

---

## D. Reconciliation

### D1 Full clean reconcile twice

Second run is zero-delta:

```text
created 0
updated 0
deleted 0
renamed 0
conflicts 0
```

### D2 Scoped reconcile

Changes inside subtree do not tombstone siblings outside it.

### D3 Missing file

Complete scan + missing tracked file -> tombstone + deleted event.

### D4 Partial/read failure

Injected scan failure returns PARTIAL/FAILED and does not tombstone files solely because they were unreadable.

### D5 Oversized file

File over byte limit is skipped/rejected without unnecessary full payload loading.

### D6 Rename detection

Unique active evidence preserves identity. Ambiguous evidence does not silently rename.

### D7 Tombstone candidate

Tombstoned document hash must not become an automatic rename candidate.

### D8 Same-path tombstone recreate

Reconcile behavior matches the explicit restore/new-identity policy.

---

## E. Writer identity

### E1 HTTP create/update

Actor = `USER`.

### E2 Internal LOGOS write

Actor = `LOGOS`.

### E3 AGENT write

Actor = `AGENT`.

### E4 AUTOMATION write

Actor = `AUTOMATION`.

### E5 Public spoof attempt

A request body attempting `writer=LOGOS` cannot change the recorded actor.

---

## F. Concurrency

### F1 Stale version

`409`, zero mutation.

### F2 Wrong hash

`409`, zero mutation.

### F3 Live-file race

Deterministic barrier changes the real file after validation but before mutation. Verify `409` and no silent overwrite/version increment.

### F4 Event transaction failure

Forced event failure does not create a partially committed document state.

---

## G. SSE

### G1 Connect

`/events/vault` reaches connected state.

### G2 File events

Payload is metadata-only and uses the canonical vocabulary.

### G3 Reconcile completion

Producer and browser both use `reconcile-complete`.

### G4 Re-render stability

Repeated React renders do not create repeated EventSource connections.

### G5 Reconnect stability

Connection loss reconnects without duplicated active connections.

---

## H. Filesystem security

Reject absolute paths, traversal, Windows drive paths, UNC paths, root-prefix sibling attacks, symlink escapes, and junction escapes.

Parent directories must not be created until containment is proven.

---

## I. API security/configuration

### I1 Local bind

Default bind is `127.0.0.1`.

### I2 CORS

Only configured browser origins are permitted for mutation requests; no wildcard production default.

### I3 Authentication policy

Direct mutation access follows the documented local-auth model and is actually installed where required.

### I4 Portable configuration

No machine-specific vault path or hardcoded localhost target remains in shipped config examples/build configuration unless deliberately documented.

---

## J. UI truthfulness

### J1 Shell

Exactly one Shell is rendered.

### J2 Vault

Only active documents appear in the normal list. Real content is displayed.

### J3 Vault actions

Unavailable actions are absent or clearly disabled; dead prompt/confirm/log handlers are removed.

### J4 Memory

API failure produces error/retry, never fabricated memory records.

### J5 System

MUI-only and theme-token-based.

### J6 Settings

No no-op controls claim to change the system.

### J7 Theme

First launch is dark; actual toggle changes mode; stored preference is respected.

---

## K. Genie-inspired LOGOS UI

### K1 Chat composition

Desktop has an internal conversation rail plus dominant main conversation workspace.

### K2 Real conversation lifecycle

New chat and conversation selection operate on real persisted data or show truthful unavailable states.

### K3 Context/result cards

Cards correspond to real vault/task/council/memory records and real actions only.

### K4 Responsive behavior

Desktop, tablet, and mobile follow the design brief without horizontal scrolling.

### K5 Normal-user simplicity

Technical telemetry and raw model reasoning are not the primary conversational UI.

---

## L. Documentation and release

### L1 Phase metadata

Runtime and docs identify the intended P0.4.2 branch/phase state.

### L2 Canonical product docs

Permanent product direction documents remain available alongside audit documents.

### L3 Reproducible verification

Record the actual outputs/status for:

```text
npm ci
npm run typecheck
npm run lint
npm run build
npm test
```

### L4 CI

Prefer a GitHub Actions workflow with a real run associated with the release candidate commit.

---

# M. Expanded UI and responsive verification

The following documents are mandatory for UI-affecting changes:

```text
06_UI_COMPONENT_TEST_MATRIX.md
07_RESPONSIVE_SIZE_AUDIT.md
```

Acceptance requires:

```text
component behavior -> PASS
accessibility -> PASS
truthfulness -> PASS
runtime/console errors -> PASS
responsive viewport audit -> PASS
```

The responsive audit includes exact mandatory viewport sizes and orientation checks; desktop-only visual inspection is insufficient.
