# Worker integration boundary

Cloudflare Pages Functions route `/communications/api/*` through `functions/communications/api/[[path]].js`. Every request validates the Cloudflare Access JWT and Jamie's configured identity before constructing D1, Shopify, or Buffer adapters.

- `core/security.js`: Access JWT and request security.
- `core/handler.js`: protected HTTP routes and sanitised responses.
- `core/orchestrator.js`: readiness, confirmation, idempotency, partial results, retry.
- `adapters/`: Shopify and Buffer GraphQL clients plus deterministic mocks.
- `storage/publications.js`: D1 production and in-memory test adapters.
- `fixtures/`: non-public contract responses.

No Worker secret may be imported into, returned to, or duplicated within browser code. See the root README for binding names, scopes, commissioning, and recovery.
