# SMCU Communications Desk

Version 1.0 is Jamie’s private operating desk for publishing Standard Maintenance Company Uniform communications. It is a static, JSON-backed internal application with a deliberately small workflow: decide what needs attention, confirm the communication and artwork, then move it through publishing.

## Local preview and sign-in

```powershell
python -m http.server 8000
```

Open `http://localhost:8000/`. The local authentication provider is available only on `localhost`, `127.0.0.1`, or `::1`. Select **Continue as Jamie** to create an eight-hour, tab-scoped session in `sessionStorage`; no password or credential is stored. Direct `file://` use is unsupported because the Desk loads ES modules and repository JSON.

A production hostname remains locked by Cloudflare Access. After Access authorises the request, the Desk reads Jamie’s identity from Cloudflare’s managed `/cdn-cgi/access/get-identity` endpoint; the browser never handles an Access token, password, API key, or OAuth secret.

## Version 1 product map

- **Dashboard** — Today’s work, current campaign, publishing queue, latest publication, and essential system state.
- **Communications** — content, metadata, search, controlled registers, artwork, previews, and publishing readiness.
- **Campaigns** — planning, linked communications, one checklist-derived progress measure, target date, and publishing overview.
- **Publishing** — four operational lanes: Ready, Blocked, Scheduled, and Published. Each record explains its readiness and exposes one Publish action only when ready.
- **Settings** — Jamie’s profile and honest connection state for future services.

Legacy Asset, Calendar, Analytics, register, CN-001, and generic detail URLs remain compatibility routes. Assets now open inside the Communications context; Calendar resolves to Campaigns; Analytics resolves to Settings.

## Architecture

| Path | Responsibility |
| --- | --- |
| `communications/data/repository.json` | Canonical communications, campaigns, assets, workflow, service state, and history |
| `communications/modules/repository.js` | Loading, schema validation, communication search, filters, counts, and queries |
| `communications/modules/campaigns.js` | Campaign validation, reciprocal links, checklist progress, phase, and current campaign |
| `communications/modules/assets.js` | Canonical artwork validation, relationships, usage, search, filters, and communication rendering |
| `communications/modules/publishing.js` | Readiness reasons and the Ready/Blocked/Scheduled/Published queue |
| `communications/modules/auth.js` | Local development sessions plus Cloudflare Access identity, logout, and safe return-path handling |
| `communications/modules/ui.js` | Shared shell and focused data-driven renderers |
| `communications/modules/app.js` | Authentication gate, route controller, search, clipboard, preview, and logout behaviour |
| `worker/interfaces/` | Server-side-only contracts for authentication, Shopify, Buffer, Instagram, Facebook, Cloudflare, and Analytics |
| `communications/styles.css` | Approved responsive SMCU controlled-document design system |

The application has no build step and no framework. One record added to `repository.json` updates counts, search, registers, campaigns, artwork relationships, and publishing readiness automatically.

## Data invariants

- Communications reference canonical asset IDs; public asset URLs are stored once on asset records.
- A communication belongs to zero or one campaign, with reciprocal campaign linkage.
- Campaign progress derives only from checklist completion and is never manually edited.
- Campaign artwork is derived from linked communications; assets are never copied.
- Publishing readiness is derived from real content, artwork, workflow, status, and service configuration.
- Service states are honest placeholders. The Desk never pretends an integration is connected.
- The three CN-001 public paths are permanent contracts and must not be renamed or moved.

## Publishing workflow

1. Export approved artwork from Illustrator into the existing public asset structure.
2. Add or update the canonical asset and communication records in `repository.json`.
3. Link the communication to one campaign when appropriate.
4. Confirm content, artwork, checklist, and real service readiness.
5. Serve locally and test Login → Dashboard → Communication → Publishing.
6. Review `git diff`. Commit and push only when explicitly requested.

Version 1.0 defines the publishing boundary but makes no external calls. Version 1.1 can implement the Worker interfaces with server-side credentials and Cloudflare Access without changing the browser UI.

## Production release gate

Before release, configure Cloudflare Access to protect `/communications/*`, including its JSON and JavaScript. Keep `/assets/*` public because published communication URLs are external contracts. The checked-in `_headers` file supplies defence-in-depth response headers, but it does not authenticate requests.

Production is not authorised until the Access policy is verified with an allowed Jamie identity and a denied unauthorised session. Do not treat the browser session provider as access control.

## Safety

Never put credentials in repository JSON or browser JavaScript. Never fabricate publication or connection state, rename published assets, alter the Cloudflare custom domain, deploy with Wrangler, push, or commit unless explicitly instructed.
