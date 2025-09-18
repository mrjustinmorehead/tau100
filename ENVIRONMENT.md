# Environment required for Netlify Blobs (explicit config fallback)

Set these in Netlify → Site settings → Build & deploy → Environment:

- SITE_URL = https://tau100.netlify.app
- ADMIN_KEY = In5nite1914!
- SITE_ID = 4a380a79-5b63-4089-abb1-02b16dc792c9
- NETLIFY_API_TOKEN = <your personal access token>

How to create NETLIFY_API_TOKEN:
- Netlify UI → User settings (top-right avatar) → Applications → Personal access tokens → New token.
- Give a name (e.g., "Tau100 Blobs"), copy the token value, save it as NETLIFY_API_TOKEN in your site env.

Note: On Netlify production, Blobs usually work without explicit config.
This fallback ensures Functions can always write to Blobs even when auto-detection fails.
