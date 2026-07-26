# SMCU Communications Desk — Operations

## Add artwork and publish

1. Sign in through Cloudflare Access and open **Communications**.
2. Create or open the communication, then select **Upload artwork**.
3. Drop one or more PNG, JPEG, or WebP files, or choose them with the file picker. Wait for every progress indicator to finish.
4. Add useful alt text to each image and select **Set primary** on the featured image. Use the arrow controls to set carousel order.
5. Preview the artwork. Use **Copy URL**, **Copy Markdown**, or **Copy HTML** only when a separate workflow needs the permanent public link.
6. Resolve every publishing-readiness reason, then open **Publishing** and choose Shopify, Instagram, and/or Facebook. Shopify uses the primary image; Buffer uses the displayed image order.
7. Review the exact destination list and confirm once. Do not paste image URLs into Shopify or Buffer manually.

## Replace or delete safely

- **Replace** keeps the existing permanent URL and changes the bytes served there. If the image is already used publicly, the Desk asks for explicit confirmation.
- **Delete** removes the permanent object and metadata. Never delete artwork used by a live publication unless every external reference has been removed first.
- Uploading the same bytes twice on one communication returns the existing image rather than creating a duplicate.

## Understand and recover from a failure

- **Artwork missing / primary missing / alt text missing:** return to the communication and resolve the exact item.
- **Upload rejected:** use a valid, non-corrupt PNG, JPEG, or WebP no larger than 10 MB and within the dimension limits.
- **Upload interrupted:** keep the page open, check the connection, and retry. Check the artwork list first; checksum detection prevents duplicates.
- **Not connected:** open **Settings**, restore the connection, then retry only the failed destination.
- **Channel disconnected:** reconnect the Instagram or Facebook channel in Buffer, then retry.
- **Communication changed:** refresh Publishing and confirm the current version.
- **Service busy / timeout:** wait briefly and retry the failed destination.

## Daily close

Check **Publishing** for unresolved failures, confirm the recent publication, then use **Log out**. Cloudflare Access ends the session and returns to sign-in.
