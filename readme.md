# Tau100 — Drag & Drop Drop‑in

This is a full, working bundle you can drag & drop into GitHub and deploy on Netlify.

## What’s inside
- `netlify/functions` — CommonJS Netlify Functions (stable on Netlify)
- `assets/js/submit-handler.js` — front‑end script binding the form submit
- `index.html` — working starter wired to the function
- `netlify.toml` — functions path + esbuild bundler
- `package.json` — only `@netlify/blobs` dependency

## One‑time Netlify environment
Set in **Site settings → Build & deploy → Environment**:
- `SITE_URL` = `https://tau100.netlify.app`
- `ADMIN_KEY` = your passcode (e.g., In5nite1914!)
- `TAU_SITE_ID` = your site ID (Settings → General → Project information)
- `TAU_BLOBS_TOKEN` = a **Personal access token** with access to the team

After updating env vars, go to **Deploys → Options → Clear cache and deploy site**.

## Notes
- If you already have a custom `index.html`, you can keep it and just ensure it includes:
  `<script src="assets/js/submit-handler.js"></script>` before `</body>` and that the form inputs/IDs match (see this `index.html` as reference).
- Functions expect these form field names: `name, email, phone, yearJoined, tshirtSize` (+ hidden `website` honeypot).
- Tiers radio buttons should be `name="tier"` with values like `"100|Centennial Sponsorship"`.
