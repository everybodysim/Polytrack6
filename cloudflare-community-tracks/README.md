# Polytrack6 Community Tracks

This adds a Community Tracks page opened from the former Multiplayer main-menu button. The original track-selection tabs, editor, gameplay, and saved-track format are left in place.

## Cloudflare setup

1. In Cloudflare, create a D1 database named `polytrack-community-tracks`.
2. Copy its database ID into `wrangler.toml` in place of `REPLACE_WITH_YOUR_D1_DATABASE_ID`.
3. From this directory, run:
   ```sh
   npx wrangler d1 execute polytrack-community-tracks --remote --file=schema.sql
   npx wrangler deploy
   ```
   Or run the SQL in `schema.sql` using the D1 console, then deploy `worker.js` as a Worker with a D1 binding named `DB`.
4. Copy the deployed Worker URL. In `../community-tracks.js`, replace the `YOUR_SUBDOMAIN` Worker URL with that URL, or set `window.POLYTRACK_COMMUNITY_API` before `community-tracks.js` loads.
5. Verify `https://YOUR-WORKER-URL/api/health` returns `{"ok":true,"service":"polytrack-community-tracks"}`.

## Notes

- No Workers KV binding is used.
- Track codes use Polytrack's native `PolyTrack2` export format.
- The page reads locally saved tracks from Polytrack's current `polytrack_v5_prod_track_` storage keys.
- Imported tracks are saved in that same format; reload the game to refresh the built-in Custom Tracks list.
- API publishing currently has no accounts or moderation queue. Anyone who knows the endpoint can publish; add moderation or rate limiting before promoting it widely.
