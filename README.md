# SMCU Image Library

SMCU Image Library is Jamie’s private tool for permanent image hosting.

Its workflow is deliberately limited to:

1. Upload a PNG, JPEG or WebP image.
2. Store the image permanently in Cloudflare R2.
3. Generate a stable public URL.
4. Preview the stored image.
5. Copy the public URL.

Cloudflare Access protects the interface and all upload, replace and delete operations. Public image GET and HEAD routes remain anonymous so existing image URLs continue to work.

## Local validation

```powershell
npm.cmd run check
```

Serve the repository root over HTTP for local browser testing. Direct `file://` access is unsupported.