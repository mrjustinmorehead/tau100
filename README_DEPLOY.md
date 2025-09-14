
# Tau100 — Clean Hardened Build (ESM + Blobs)

This package replaces your repo to guarantee Netlify deploy succeeds.

## Why this works
- **No Stripe** code anywhere.
- All Netlify functions are **ESM** (`.mjs`) with `export const handler`.
- `package.json` uses `"type": "module"` and only `@netlify/blobs` dependency.
- `netlify.toml` points to `netlify/functions` with `node_bundler = "esbuild"`.

## Install (nuke-and-replace)
1. Back up your repo (optional).
2. Delete everything **except** your `.git` folder locally, then copy these files in.
3. Ensure your images are in `/assets` (e.g., `tau100-1.jpg`, `tau100-3.jpg`, `charter members.jpg`, `tau100-4.jpg`, `401234649.jpg`).
4. Set environment variables in Netlify:
   - `SITE_URL` = `https://tau100.netlify.app`
   - `ADMIN_KEY` = your passcode
   - (Optional) `SITE_ID`
5. Commit & push.

## Functions endpoints
- `/.netlify/functions/submit_manual_registration` (POST)
- `/.netlify/functions/confirm_payment?token=...` (GET)
- `/.netlify/functions/list_registrants` (GET)
- `/.netlify/functions/list_pending` (GET, admin header `x-admin-key`)
- `/.netlify/functions/approve_pending` (POST, admin)
- `/.netlify/functions/deny_pending` (POST, admin)
- `/.netlify/functions/export_csv` (GET, admin)

If your Netlify site still tries to bundle removed functions (e.g., old Stripe file),
make sure the file is **deleted from the repo** and not present in the build cache.
Trigger a "Clear cache and deploy site" in Netlify if needed.
