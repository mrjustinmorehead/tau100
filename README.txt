Tau100 package (fixed)
======================

What this contains
------------------
- index.html (full page with schedule, payment, roster, admin)
- netlify/functions/_common.cjs (runtime-bound Blobs; no tokens required)
- package.json (declares @netlify/blobs)

How to deploy
-------------
1) Drag & drop this whole folder into your GitHub repo (replace files).
2) Commit. Netlify will auto-deploy.
3) Visit /.netlify/functions/list_registrants to confirm JSON loads.
4) Try a test registration; Confirm panel should appear with code + link.
