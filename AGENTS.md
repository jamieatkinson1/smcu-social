# Durable repository instructions

## Product and design

- This is SMCU internal company software, not a marketing site. Preserve the warm paper, dark steel, precise borders, compact uppercase labels, monospace identifiers, and restrained status colour.
- Keep layouts accessible and usable at 320px. Maintain semantic landmarks, visible focus, useful alt text, keyboard operation, and reduced-motion support.

## Architecture and safety

- Keep the site static and dependency-light. `communications/data.js` is the single source of truth for sections, documents, asset URLs, counts, and integration placeholders.
- Reuse `communications/script.js`; never hard-code counts or document metadata into route HTML.
- Keep Shopify and Buffer state in each record's `integrations` object. Never expose credentials in browser JavaScript or fabricate connected integrations, metrics, IDs, or statuses.
- Existing public asset URLs are contracts. Do not rename, move, or silently replace published files, especially the three CN-001 images.

## Workflow

- Inspect files and Git status before editing; preserve unrelated changes.
- Serve from the repository root. Test navigation, console errors, images, dialogs, clipboard actions, keyboard focus, and desktop/mobile layouts.
- Review the diff before committing. Never use destructive Git, push, deploy with Wrangler, or alter the Cloudflare custom domain unless explicitly instructed.
