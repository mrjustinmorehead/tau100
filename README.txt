Tau100 — Everything Working Bundle
=================================
Drag-and-drop to GitHub, then on Netlify set env vars and deploy.

Required Netlify environment variables:
- ADMIN_KEY         (passcode for Admin tools)
- TAU_SITE_ID       (your Netlify Site ID for this site’s blobs)
- TAU_BLOBS_TOKEN   (Blobs token with read+write)

Notes:
- All functions are CommonJS (no ESM issues).
- Submit button posts to /.netlify/functions/submit_manual_registration
- Confirm link moves record from pending -> registrants
- Public roster hides T-shirt size; Admin can edit/export via footer.
