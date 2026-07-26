# SMCU Communications Desk

Private, single-operator communications planning and publishing software for Standard Maintenance Company Uniform. The five product areas are Dashboard, Communications, Campaigns, Publishing, and Settings. `communications/data/repository.json` remains the canonical editorial seed; Cloudflare D1 stores operational publication outcomes.

## Architecture

- Static application: `communications/` contains route shells, the shared industrial stylesheet, browser modules, and canonical repository data.
- Protected API: `functions/communications/api/[[path]].js` exposes same-origin Pages Functions endpoints beneath the Cloudflare Access policy.
- Security: `worker/core/security.js` verifies the Access JWT signature, issuer, audience, expiry, and Jamie's configured identity on every privileged request. Requests fail closed; only the route-specific GET/POST/PATCH/DELETE methods and same-origin browser requests are accepted.
- Orchestration: `worker/core/orchestrator.js` validates readiness, confirmation, destinations, schedules, stale records, and idempotency. Destinations complete independently.
- Services: `worker/adapters/shopify.js` and `buffer.js` contain narrow, server-only GraphQL clients with timeouts, bounded retry, safe error mapping, mocks, and dry-run support.
- Persistence: `worker/storage/publications.js` writes publication outcomes and `worker/storage/assets.js` writes artwork metadata to `PUBLICATIONS_DB`; both migrations are additive and never change repository content. R2 stores unchanged image bytes.
- Tests: Node's built-in test runner covers identity, request security, storage, orchestration, retries, partial failure, and adapter contracts. Fixtures never make public posts.

Public CN-001 artwork remains at its established `/assets/company-notices/cn-001/` URLs. All Desk code, data, Functions, Settings, and Publishing routes remain under `/communications/*` and must stay protected by Cloudflare Access.

## Local development

Serve the repository root over HTTP (the local authentication provider works only on loopback):

```powershell
python -m http.server 8000
```

Open `http://localhost:8000/communications/`. The browser uses a short-lived local Jamie session and never needs service credentials. Server tests use mocks:

```powershell
npm.cmd test
npm.cmd run check
```

Set `INTEGRATION_DRY_RUN=true` in a private local Worker environment when exercising live health checks without mutations. Never put `.dev.vars` or token values in Git.

## Cloudflare configuration

Cloudflare Access must protect `/communications/*` and allow only Jamie. Keep only `/assets/*` public. Configure these Pages variables/secrets:

| Name | Kind | Purpose |
|---|---|---|
| `CF_ACCESS_TEAM_DOMAIN` | variable | Full Access team domain, for example `https://team.cloudflareaccess.com` |
| `CF_ACCESS_AUD` | variable | Access application audience tag |
| `SMCU_ADMIN_EMAIL` | encrypted secret | Jamie's sole authorised Access identity |
| `PUBLICATIONS_DB` | D1 binding | Additive operational publication storage |
| `INTEGRATION_DRY_RUN` | variable | `true` prevents Shopify/Buffer mutations |
| `SHOPIFY_STORE_DOMAIN` | variable | Store `*.myshopify.com` hostname |
| `SHOPIFY_API_VERSION` | variable | Defaults to `2026-07` |
| `SHOPIFY_BLOG_ID` | variable | Target Company Memos blog GraphQL ID |
| `SHOPIFY_PUBLIC_DOMAIN` | variable | Optional public storefront hostname for returned URLs |
| `SHOPIFY_PUBLIC_BLOG_HANDLE` | variable | Optional target blog handle (`news` in the verified store) |
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | encrypted secret | Admin API token |
| `BUFFER_ORGANIZATION_ID` | variable | Buffer organisation ID |
| `BUFFER_INSTAGRAM_CHANNEL_ID` | variable | Connected Instagram channel ID |
| `BUFFER_FACEBOOK_CHANNEL_ID` | variable | Connected Facebook channel ID |
| `BUFFER_API_KEY` | encrypted secret | Personal API key |

Create/bind a free D1 database in the existing Pages project and apply `migrations/0001_publication_results.sql`. This migration only creates the publication table and index.

Shopify needs the minimum content permissions required by the validated Admin GraphQL operations: `read_content`, `write_content`, `read_online_store_pages`, and `write_online_store_pages`. The adapter can only query the shop/blog and create or update an article in the configured blog; it contains no product, order, customer, theme, navigation, or inventory operations.

Buffer personal API keys are appropriate for this single-operator tool. Grant `organizationsRead`, `channelsRead`, `postsRead`, and `postsWrite`; configure only the two intended channel IDs. The key is sent only from the Worker to `https://api.buffer.com`.

## Safe commissioning and publishing

1. Deploy with `INTEGRATION_DRY_RUN=true` and all bindings/secrets present.
2. Sign in through Access and open Settings; verify storage, Shopify, Buffer, Instagram, and Facebook states.
3. Run `npm.cmd run verify:integrations`; an unauthenticated redirect is an expected security result. Use Settings for the authenticated check.
4. Preview one approved communication. Confirm the exact destinations and use a Shopify draft plus a future Buffer schedule.
5. Inspect both external records, then cancel the Buffer test and remove the Shopify draft manually if desired.
6. Set `INTEGRATION_DRY_RUN=false` only after the controlled test is accepted.

The UI always requires an explicit browser confirmation for real publishing. A deterministic request fingerprint and D1 primary key prevent double-click/refresh duplicates. Shopify also reuses its deterministic article handle. Successful destinations are never rolled back when another fails; retry re-runs only failed destinations.

## Recovery, rotation, and rollback

- Failure rows contain a safe failure code and practical recovery message. Fix the connection/content issue and use retry; completed destinations are reused.
- Buffer is the social queue source of truth. Refresh status on demand; do not run high-frequency polling.
- Rotate Shopify or Buffer credentials in Cloudflare encrypted secrets and redeploy. Never edit browser files.
- Disconnect a service by deleting its Worker secret and associated IDs; health immediately reports Not configured and publishing fails safely.
- Roll back application code through the Cloudflare Worker deployment history or by reverting the Git commit. D1 publication history is additive and should not be deleted during rollback.
- If Access verification fails, confirm team domain, audience, administrator identity, and Access policy before changing application code.

## Deployment

The production branch is `main`; the production service is the existing `smcu-social` Cloudflare Worker. Build, validate, commit, push, and deploy with Wrangler:

```powershell
npm.cmd run check
git diff --check
git status --short
npx wrangler deploy --dry-run
npx wrangler deploy
```

After deployment, anonymously verify `/communications/` and `/communications/api/health` redirect to Access, and each established `/assets/company-notices/cn-001/` URL returns `200 image/png`. Then perform the authenticated Settings and Publishing checks in Chrome.

## Communication artwork workflow

Artwork is owned by communications. The communication workspace calls same-origin protected endpoints under `/communications/api/assets`; `worker/assets/manager.js` coordinates validation, stable key generation, checksum deduplication, metadata, and object storage. `ARTWORK_BUCKET` stores unchanged image bytes in R2. `PUBLICATIONS_DB` stores metadata through `migrations/0002_communication_assets.sql`. The public GET/HEAD-only function at `/assets/communications/*` serves generated object keys without Access so Shopify and Buffer can retrieve them. All mutations still require Jamie's verified Cloudflare Access identity.

Generated URLs follow `/assets/communications/{communication-id}/{asset-id}-{safe-filename}` and never derive an object key from browser input. Replacement keeps the existing URL. CN-001 remains at its three exact legacy paths and is seeded only as metadata.

Run the complete validation with:

```powershell
npm.cmd run check
```

See `FINAL_SETUP.md` for R2/D1 commissioning, public routing, cache behaviour, and production verification. See `OPERATIONS.md` for the operator workflow.
