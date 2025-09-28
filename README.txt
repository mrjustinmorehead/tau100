Tau100 Final Bundle
===================
- index.html (full UI; schedule preserved; payment panel; roster; admin)
- netlify/functions/*.js (robust, runtime-bound blob client via _common.cjs)
- package.json (declares @netlify/blobs)

Deploy:
1) Upload entire bundle to your GitHub repo (replace existing files).
2) Commit to main; Netlify auto-builds.
3) Verify /.netlify/functions/list_registrants returns JSON.
4) Test new registration; confirm -> roster shows it after approval/confirm.
