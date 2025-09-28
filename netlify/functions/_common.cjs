// _common.cjs — Blobs hotfix: prefer explicit creds if present, else runtime creds.
const { getStore } = require('@netlify/blobs');

function json(status, body) {
  return { statusCode: status, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) };
}
function bad(a, b) { const status = typeof a === 'number' ? a : 400; const msg = typeof a === 'number' ? b : a; return json(status, { ok:false, error: msg||'error' }); }
function auth(key) { const want = process.env.ADMIN_KEY; return !!want && key === want; }
function uid() { return Math.random().toString(36).slice(2, 10); }

function storeOptions() {
  const siteID = process.env.TAU_SITE_ID || process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
  const token  = process.env.TAU_BLOBS_TOKEN || process.env.NETLIFY_BLOBS_TOKEN || process.env.BLOBS_TOKEN;
  const opts = {};
  if (siteID && token) { opts.siteID = siteID; opts.token = token; }
  return opts;
}

function wrapStore(name, primaryKey='all') {
  const opts = storeOptions();
  const store = Object.keys(opts).length ? getStore(name, opts) : getStore(name);
  return {
    async getJSON() {
      try {
        let arr = await store.getJSON(primaryKey);
        if (Array.isArray(arr)) return arr;
      } catch (e) {
        // If runtime creds aren't available and no explicit creds were provided, surface a clear error.
        if (!Object.keys(storeOptions()).length) throw new Error('Netlify Blobs not configured (no runtime creds). Set TAU_SITE_ID and TAU_BLOBS_TOKEN.');
      }
      // legacy/fallback scan
      try {
        const legacy = await store.getJSON('registrants');
        if (Array.isArray(legacy)) return legacy;
      } catch {}
      try {
        const listing = await store.list();
        for (const it of listing || []) {
          if (it?.key && /\.json$/i.test(it.key)) {
            const data = await store.getJSON(it.key);
            if (Array.isArray(data)) return data;
          }
        }
      } catch {}
      return [];
    },
    async setJSON(list) {
      const arr = Array.isArray(list) ? list : [];
      try {
        await store.setJSON(primaryKey, arr);
        return true;
      } catch (e) {
        throw new Error('Blobs write failed. Ensure TAU_SITE_ID and TAU_BLOBS_TOKEN are set at Site → Settings → Environment variables.');
      }
    },
    async list() { try { return await store.list(); } catch { return []; } },
  };
}

const stores = {
  async registrants(){ return wrapStore('registrants','all'); },
  async pending(){ return wrapStore('pending','all'); }
};

module.exports = { json, bad, auth, uid, stores };
