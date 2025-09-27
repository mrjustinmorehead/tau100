// netlify/functions/heal_blobs.js
// One-shot normalizer to rewrite both blobs as arrays.
// Call: /.netlify/functions/heal_blobs (requires ADMIN_KEY via header x-admin-key)
const common = require('./_common.cjs');
exports.handler = async (event) => {
  try {
    const admin = event.headers['x-admin-key'] || event.headers['X-Admin-Key'];
    if (!common.auth(admin)) return common.bad(401, 'Unauthorized');
    const out = await common.stores.normalizeAll();
    return common.json({ ok:true, healed: out.counts });
  } catch (e) { return common.bad(500, e.message || 'error'); }
};
