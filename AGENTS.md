# Durable repository instructions

## Product mission

- This is Jamie’s private, single-operator SMCU Communications Desk. It is not SaaS, CRM, enterprise software, a file manager, or a generic marketing platform.
- The clothing business is the product; the Desk is a tool. Keep only work that helps Jamie prepare or publish communications.
- The Dashboard answers one question: “What should I do next?” It contains only Today’s Work, Current Campaign, Publishing Queue, Recent Publication, and System Status.
- Primary navigation is fixed to Dashboard, Communications, Campaigns, Publishing, and Settings. Do not restore separate Assets, Calendar, or Analytics navigation.
- Prefer one obvious action, progressive disclosure, fewer boxes, and less than three clicks to important work.

## Visual identity

- Preserve the approved warm paper, dark industrial shell, lime accent rule, controlled-document aesthetic, condensed utility type, monospace identifiers, approved stamp, restrained status colours, and register numbering.
- Refine density without redesigning. Keep the desktop dashboard within a typical 1920×1080 viewport at 100% zoom.
- Maintain landmarks, visible focus, useful alt text, keyboard operation, native dialogs, live regions, reduced motion, and layouts down to 320px.

## Canonical architecture

- `communications/data/repository.json` is the single source of truth. Never duplicate records, relationships, counts, progress, readiness, system state, or public URLs in HTML.
- `repository.js` owns communication validation and queries; `campaigns.js` owns campaign links and checklist progress; `assets.js` owns canonical artwork and usage; `publishing.js` owns publishing readiness; `auth.js` owns the replaceable browser authentication boundary.
- `ui.js` contains reusable renderers and `app.js` owns routing and interactions. Route HTML files are intentionally thin.
- `worker/interfaces/` is server-side preparation only. Browser code must not import it.
- Preserve generic and historical compatibility routes, but map obsolete module routes into the five Version 1 product areas.

## Relationship and publishing rules

- A communication belongs to zero or one campaign; links must be reciprocal.
- Campaign progress derives from `checklist[]`; never store or edit a percentage.
- Communications reference canonical asset IDs only. Derive campaign assets from linked communications and never copy asset objects.
- A Publish action appears only when readiness is genuinely Ready. Blocked records must say exactly what is missing.
- Do not connect external APIs or imply that Shopify, Buffer, Instagram, Facebook, Analytics, Cloudflare, or Cloudflare Access is configured when it is not.

## Authentication and secrets

- Local mock authentication is allowed only on loopback hosts and stores an expiring Jamie session in `sessionStorage`; it must never contain a password.
- Production must remain locked unless Cloudflare Access protects `/communications/*` and a trusted edge provider supplies authenticated context. Keep `/assets/*` public because published URLs are contracts. Never weaken the production fallback to make local testing easier.
- Never place passwords, API keys, OAuth tokens, session secrets, or Worker secrets in browser JavaScript, HTML, JSON, Git, screenshots, logs, or documentation.
- Version 1.1 implementations belong behind Cloudflare Worker/Access interfaces with server-side secret storage.

## Asset safety

- Existing public asset URLs are contracts. Never rename, move, silently replace, or re-encode published files, especially the three CN-001 images.
- Store verified filenames, dimensions, formats, URLs, and meaningful alt text on canonical asset records.
- Artwork browsing belongs in Communications; do not recreate a separate Asset application.

## Working and validation workflow

- Inspect the worktree before editing and preserve unrelated changes. Use `rg` first when available; fall back cleanly when it is not.
- Serve from the repository root; direct `file://` use is unsupported.
- Validate JSON and JavaScript, repository/campaign/asset relationships, progress and publishing readiness, authentication expiry and safe returns, every route, CSS/JS MIME types, broken paths, clipboard/preview controls, keyboard focus, and 1920×1080 plus mobile layouts.
- Review the whole daily path as Jamie: Login → Dashboard → Communication/Campaign → Publishing → Logout.
- Review `git diff` before handoff. Never use destructive Git, deploy, push, commit, or alter the Cloudflare domain unless explicitly instructed.

## Product Freeze

Version 1 UI is frozen.

Do not introduce new modules.

Do not redesign navigation.

Do not add dashboards.

Do not increase clicks.

Future work must connect existing functionality to real services.

Integrations should make the existing workflow work, not create new workflows.

## Operational integrations

- All privileged routes stay below `/communications/api/*` so the existing Access policy covers code, data, and API together. Validate the Access JWT signature, issuer, audience, expiry, and `SMCU_ADMIN_EMAIL` server-side on every request.
- `PUBLICATIONS_DB` is the sole production operational store. Migrations must be additive and non-destructive; `repository.json` remains editorial seed/reference data.
- Shopify operations remain limited to the configured blog and require explicit confirmation. Keep deterministic article handles, idempotency, dry-run tests, and official schema validation.
- Buffer remains the social queue source of truth. Keep personal API keys and channel IDs in Worker secrets/variables, attach current-format media metadata, and reconcile on demand rather than polling frequently.
- Never claim a service is connected until its authenticated health check succeeds. Never test by creating uncontrolled public content.
