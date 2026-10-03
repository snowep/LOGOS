# LOGOS — P0.4.2 API Route, Proxy, and SSE Corrective Directive

## Objective

Repair the API routing architecture so every browser request resolves to exactly one backend endpoint, without duplicated prefixes, accidental 404→500 masking, or broken SSE paths.

This directive addresses the current Vault failure:

```text
GET /api/documents?limit=100
-> Next route returns 500
-> upstream API returned 404
```

## Current root cause

The Express application mounts routers with path prefixes while the routers themselves also include those prefixes.

Example:

```text
server.ts
  app.use('/api/documents', documentsRouter)

routes/documents.ts
  router.get('/api/documents', ...)
```

The effective route is therefore wrong.

The same architectural defect exists across documents, memory, system, and events.

## Required correction

Choose exactly one routing convention and apply it consistently.

Required convention:

```text
server.ts owns the mount prefix
route files define paths relative to that prefix
```

Therefore:

```text
app.use('/api/documents', documentsRouter)
router.get('/', ...)
router.get('/:id', ...)
router.get('/:id/events', ...)
router.post('/', ...)
router.put('/:id', ...)
router.delete('/:id', ...)
```

Apply the same rule to:

```text
apps/api/src/routes/memory.ts
apps/api/src/routes/system.ts
apps/api/src/routes/events.ts
```

For events, the canonical mounted endpoint must remain:

```text
GET /api/events/vault
```

Then the Next.js proxy and browser hook must use that exact endpoint, or a deliberate documented alternate. There must be only one canonical URL.

## Next.js proxy requirements

Inspect:

```text
apps/web/app/api/documents/route.ts
apps/web/app/api/documents/[id]/route.ts
apps/web/app/api/system/route.ts
apps/web/app/api/vault/events/route.ts
apps/web/next.config.js
apps/web/src/server/apiBase.ts
```

Rules:

1. A proxy must not turn an upstream 404 into a generic 500 when the caller can safely receive the original semantic status.
2. The proxy must not hardcode `localhost` as its only backend target.
3. Server-to-server backend URL comes from `LOGOS_API_URL`; browser-facing requests should use same-origin `/api/*` paths wherever practical.
4. SSE must preserve streaming behavior and must not buffer the stream through an incompatible response path.
5. Do not send browser `Connection: keep-alive` or other hop-by-hop headers to a server-side `fetch` unless the framework requires it.

## Auth requirements

The current mutation endpoints use `apiKeyAuth`, but the browser's ordinary Vault read request must remain readable according to the documented product boundary.

Verify:

```text
GET /api/documents                         -> intended read behavior
POST /api/documents                        -> 401 without key
PUT /api/documents/:id                     -> 401 without key
DELETE /api/documents/:id                  -> 401 without key
POST /api/vault/reconcile                  -> 401 without key
```

Do not weaken mutation auth merely to make the UI work.

## CORS requirements

Use explicit configured origins.

Required default:

```text
local-only API
HOST=127.0.0.1
CORS_ORIGIN=<explicit local UI origin when cross-origin is actually needed>
```

Do not retain wildcard CORS as the default for a protected local mutation API.

## Required targeted tests

```text
API_ROUTE | documents-root | GET /api/documents | 200 or intended read response | PASS
API_ROUTE | documents-id   | GET /api/documents/:id | 200/404 semantically correct | PASS
API_ROUTE | memory-root    | GET /api/memory/... | intended response | PASS
API_ROUTE | system-root    | GET /api/system | 200 | PASS
API_ROUTE | events-vault   | GET /api/events/vault | event-stream | PASS
PROXY     | documents      | browser /api/documents | upstream status preserved | PASS
```

## Mandatory Vault verification

After repair:

```text
Browser console:
no Failed to fetch documents

Network:
GET /api/documents?limit=100 -> 200
Content-Type -> application/json

Vault:
active documents appear
no tombstoned document appears
```

## Do not do

```text
Do not add a second route to hide the first route.
Do not change 404 to 200.
Do not remove auth from mutation routes.
Do not use a hardcoded localhost fallback as the only deployment path.
Do not replace the real API with static frontend data.
```

## Required report

```text
STATUS: COMPLETE | BLOCKED | FAILED
ROUTES_FIXED:
PROXY_ROUTES_FIXED:
SSE_ROUTE_FIXED:
AUTH_CHECKS:
CORS_CHECKS:
TARGETED_TESTS:
FULL_GATE:
FILES_CHANGED:
REGRESSION_TESTS:
```
