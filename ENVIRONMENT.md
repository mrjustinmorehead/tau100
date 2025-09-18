# Blobs environment override (optional)

Normally, Netlify Blobs auto-configures in production. If you still see:
> The environment has not been configured to use Netlify Blobs...

Add **custom** env vars (not reserved by Netlify) in Site settings → Build & deploy → Environment:

- TAU_SITE_ID = (your site id, e.g. 4a380a79-5b63-4089-abb1-02b16dc792c9)
- TAU_BLOBS_TOKEN = (a Netlify personal access token)

How to create TAU_BLOBS_TOKEN:
- Netlify UI → *User settings* → *Applications* → *Personal access tokens* → *New token*.
- Give it a name (e.g., "Tau100 Blobs"), copy the value, paste it as TAU_BLOBS_TOKEN.

Then deploy. You can verify server-side access at:
- /.netlify/functions/debug_env

You should see: { "ok": true, "wrote": true, "readBack": { ... } }
