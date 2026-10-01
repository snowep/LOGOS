# LOGOS — Verification and Release Standard

## Every phase

Run:

```text
npm ci
npm run typecheck
npm run lint
npm run build
npm test
```

Then perform manual acceptance.

## Backend

Verify:
- API starts/stops cleanly,
- migrations work,
- database path is correct,
- config is validated,
- filesystem root is protected,
- invalid requests return useful errors,
- authorization works.

## Vault

Verify:
- create,
- modify,
- delete,
- rename,
- move,
- reconcile,
- conflict,
- large file,
- ignored file,
- restart,
- concurrent change.

## Memory

Verify:
- creation,
- retrieval,
- ranking,
- provenance,
- promotion,
- contradiction,
- supersession,
- expiry,
- forgetting.

## Agents

Verify:
- permissions,
- context,
- assignment,
- failure,
- timeout,
- cancellation,
- result verification,
- evaluation.

## Councils

Verify:
- roster,
- shared context,
- disagreement,
- synthesis,
- decision,
- action items,
- persistence,
- project update.

## UI

Open:

```text
1440x900
1280x800
1024x768
768x1024
390x844
```

Verify:
- no clipping,
- no unreadable text,
- no giant headings,
- no horizontal overflow,
- no fake content,
- correct loading state,
- correct empty state,
- correct error state,
- keyboard navigation,
- visible focus,
- accessible icon labels.

## Truthfulness scan

Search source for:

```text
mock
fake
demo
placeholder
hardcoded
localhost
D:ORION
99.9%
1.2k req/s
System Operational
```

Every occurrence must be removed or intentionally documented as development-only.

## Release gate

Before v1.0:
- clean install works,
- fresh database works,
- migrations work,
- existing vault works,
- backup/restore works,
- permissions work,
- destructive actions require authorization,
- important actions are verifiable,
- docs match code,
- no stale ORION product identity remains,
- no runtime database is committed.
