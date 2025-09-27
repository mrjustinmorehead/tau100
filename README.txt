Tau100 — Fully Bundled Repo
=================================
Included:
- index.html (UI + Venmo/CashApp/PayPal confirm flow + stepshow link + map)
- assets/js/submit-handler.js (lightweight; main logic is inline in index.html)
- assets/js/admin-edit-tools.js (footer Admin: edit / remove duplicates)
- assets/js/admin-inline-edit.js (inline ✎/🗑 in roster when Admin key entered)
- assets/js/roster-hide-size.js (hide T-shirt size from public roster)
- netlify/functions/*.js (CommonJS) — submit/list/confirm/approve/deny/export/update/delete
- netlify/functions/_common.cjs (Blobs helpers; NO Netlify SDK required)

ENV required in Netlify:
- ADMIN_KEY         (passcode for Admin tools)
- TAU_SITE_ID       (your Netlify Site ID)
- TAU_BLOBS_TOKEN   (Blobs token with read+write)

Deploy:
- Drag this whole bundle into GitHub.
- Clear cache and deploy if needed.
