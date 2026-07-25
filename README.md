# SMCU Communications Repository

Static, data-driven internal communications repository for Standard Maintenance Company Uniform.

## Architecture

- `communications/data.js` is the single manifest for sections, documents, metadata, assets, and future integration state.
- `communications/script.js` provides reusable dashboard, register, document, asset, clipboard, and preview rendering.
- `communications/styles.css` is the shared responsive industrial design system.
- Route folders contain minimal HTML entry points. Published media remains under `assets/` with stable root-relative URLs.

Shopify and Buffer placeholders are isolated under each document's `integrations` object. They contain no credentials and report `not-connected`.

## Local preview

```powershell
python -m http.server 8000
```

Open `http://localhost:8000/`. Serve the repository root; do not open HTML files directly.

## Adding and publishing communications

1. Add approved assets under `assets/<section>/<document-id>/`.
2. Add one record to `communications/data.js`, including useful asset alt text.
3. Preview dashboard, register, document, clipboard actions, and desktop/mobile layouts.
4. Review and commit locally, then push the reviewed branch to GitHub. The existing Cloudflare integration handles production publishing.

Counts and registers derive from the manifest. Do not duplicate metadata in HTML. Do not deploy with Wrangler, change the custom domain, or place API keys in browser code.
