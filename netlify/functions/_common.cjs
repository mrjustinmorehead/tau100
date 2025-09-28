// Runtime-bound Netlify Blobs helper (no tokens/siteID needed in production)
const { getStore } = require('@netlify/blobs');

function json(status, body) {
  return {
    statusCode: status,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  };
}
function bad(a, b) {
  const status = typeof a === 'number' ? a : 400;
  const msg = typeof a === 'number' ? b : a;
  return json(status, { ok: false, error: msg || 'error' });
}
function auth(key) {
  const want = process.env.ADMIN_KEY;
  return !!want && key === want;
}
function uid() {
  return Math.random().toString(36).slice(2, 10);
}
function wrapStore(name, primaryKey = 'all') {
  const store = getStore(name);
  return {
    async getJSON() {
      let arr = await store.getJSON(primaryKey);
      if (Array.isArray(arr)) return arr;
      const legacy = await store.getJSON('registrants');
      if (Array.isArray(legacy)) return legacy;
      try {
        const listing = await store.list();
        for (const it of listing || []) {
          if (it?.key && /\.json$/i.test(it.key)) {
            const data = await store.getJSON(it.key);
            if (Array.isArray(data)) return data;
          }
        }
      } catch (_) {}
      return [];
    },
    async setJSON(list) {
      await store.setJSON(primaryKey, Array.isArray(list) ? list : []);
      return true;
    },
    async list() {
      try { return await store.list(); } catch { return []; }
    },
  };
}
const stores = {
  async registrants() { return wrapStore('registrants', 'all'); },
  async pending()     { return wrapStore('pending', 'all'); }
};
module.exports = { json, bad, auth, uid, stores };
