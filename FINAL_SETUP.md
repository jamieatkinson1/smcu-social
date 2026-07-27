# SMCU Image Library — Final Setup

The production Worker requires only the existing security and image-storage resources:

- Cloudflare Access protecting `/communications/*`.
- R2 binding `ARTWORK_BUCKET` using bucket `smcu-communications-artwork`.
- D1 binding `PUBLICATIONS_DB` for `communication_assets` metadata.
- Worker secret `SMCU_ADMIN_EMAIL` set to Jamie’s authorised email.

Public `GET` and `HEAD` requests below `/assets/communications/*` must remain outside Cloudflare Access. Existing `/assets/company-notices/cn-001/*` files must also remain publicly available and unchanged.

## Verification

```powershell
npm.cmd run check
npx.cmd --yes wrangler@latest deploy
```

After deployment:

1. Confirm an anonymous request to `/communications/api/assets` is rejected.
2. Upload one controlled image while signed in as Jamie.
3. Confirm the returned public URL responds with the correct image content type.
4. Copy and open the URL in a private browser window.
5. Delete the controlled image if it is not required.

Never place R2 credentials, Access tokens or Worker secrets in browser code, documentation or Git.