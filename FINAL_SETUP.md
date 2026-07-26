# Artwork storage final setup

The Desk uses Cloudflare R2 for image bytes and the existing D1 database for artwork metadata. `repository.json` remains the editorial seed. Binary image data is never stored in JSON or D1.

## 1. Create the free R2 bucket

Authenticate Wrangler locally, then create the bucket. Copy `wrangler.example.toml` to an untracked `wrangler.toml` and replace the existing D1 database ID before applying migrations:

```powershell
npx wrangler login
npx wrangler r2 bucket create smcu-communications-artwork
```

In the existing `smcu-social` Worker, add an R2 binding named exactly `ARTWORK_BUCKET` pointing to `smcu-communications-artwork`. This is a server-side Worker binding, not a browser variable.

## 2. Bind and migrate D1

Keep the existing D1 binding name `PUBLICATIONS_DB`. Apply both additive migrations in order:

```powershell
npx wrangler d1 migrations apply smcu-communications --remote
```

If the production database uses a different Cloudflare resource name, substitute only that resource name. Do not change the binding name. Migration `0002_communication_assets.sql` creates artwork metadata and seeds CN-001 without moving its files or changing any of its URLs.

## 3. Public routing and Access

Keep Cloudflare Access on `/communications/*`. The upload, metadata, replace, delete, primary, and reorder endpoints are therefore protected and also verify the Access JWT server-side.

Leave these public:

- `/assets/communications/*` — generated R2-backed artwork route.
- `/assets/company-notices/cn-001/*` — established static CN-001 artwork.

No R2 public-development URL or credential is exposed. The Worker route at `/assets/communications/*` reads only server-generated object keys. It permits GET/HEAD, returns the stored Content-Type and ETag, and applies `public, max-age=3600, stale-while-revalidate=86400` caching. Replacement deliberately preserves the URL; cache revalidation may take up to one hour unless the browser performs an ETag check.

## 4. Limits

- Formats: PNG, JPEG, WebP
- Maximum encoded file size: 10 MB
- Maximum edge: 10,000 px
- Maximum area: 40 megapixels
- Buffer carousel: 10 images

The server verifies extension, declared MIME, file signature, dimensions, non-empty content, and SHA-256 checksum. It does not recompress or alter artwork.

## 5. Verification

After `npm.cmd run build` and `npx wrangler deploy` complete:

```powershell
curl.exe -I https://social.standardmaintenance.co.uk/communications/api/assets?communicationId=CN-001
curl.exe -I https://social.standardmaintenance.co.uk/assets/company-notices/cn-001/cn-001%20slide%201.png
```

The first command must redirect to Cloudflare Access when anonymous; the second must return `200` and `image/png`. Sign in, upload a controlled small image to a non-published communication, copy its `/assets/communications/...` URL, and verify it in a private window. Delete the test only if it has no publication usage.

## Safe recovery

A duplicate checksum returns the existing artwork record. Replacement is explicit and keeps the same public URL. Replacement or deletion of artwork with publication usage requires an additional warning confirmation. Deleting an R2 object and metadata row cannot be undone; download a copy first when the original is not safely retained elsewhere.
