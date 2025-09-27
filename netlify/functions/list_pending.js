// netlify/functions/list_pending.js
const common = require('./_common.cjs');
exports.handler = async (event) => {
  try {
    const admin = event.headers['x-admin-key'] || event.headers['X-Admin-Key'];
    if (!common.auth(admin)) return common.bad(401, 'Unauthorized');
    const db = await common.stores.pending();
    const items = await db.getJSON();
    return common.json({ ok:true, items });
  } catch (e) {
    return common.bad(500, e.message || 'error');
  }
};