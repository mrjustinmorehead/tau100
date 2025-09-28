// netlify/functions/_common.cjs
// Blobs-backed common helpers matching previous calling pattern used by your site.
// Exposes: json, bad, auth, uid, stores.{registrants,pending}() -> {getJSON(), setJSON(), list()}

const { createClient } = require('@netlify/blobs');

function getClient() {
  const siteID = process.env.TAU_SITE_ID || process.env.SITE_ID;
  const token  = process.env.TAU_BLOBS_TOKEN || process.env.ADMIN_KEY;
  if (!siteID || !token) {
    throw new Error("Missing TAU_SITE_ID or TAU_BLOBS_TOKEN environment variables");
  }
  return createClient({ siteID, token });
}

// JSON helpers
function json(status, body) {
  return {
    statusCode: status,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}
function bad(status, msg) {
  return json(status || 400, { ok: false, error: msg || "error" });
}

// Admin auth
function auth(key) {
  const want = process.env.ADMIN_KEY;
  return !!want && key === want;
}

// Simple id
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// Store wrappers that match earlier usage (no per-item keys exposed)
function makeWrapped(storeName, keyName) {
  const client = getClient();
  const store  = client.store(storeName);
  return {
    async getJSON() {
      const data = await store.getJSON(keyName);
      return Array.isArray(data) ? data : (data && data.items ? data.items : []) || [];
    },
    async setJSON(list) {
      await store.setJSON(keyName, Array.isArray(list) ? list : []);
      return true;
    },
    async list() {
      // low-level list of objects in the store (not usually used by your handlers)
      try { return await store.list(); } catch { return []; }
    }
  };
}

const stores = {
  async registrants() { return makeWrapped('registrants', 'all'); },
  async pending()     { return makeWrapped('pending', 'all'); }
};

module.exports = { json, bad, auth, uid, stores };
