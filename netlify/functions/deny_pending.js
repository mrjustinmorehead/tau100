// netlify/functions/deny_pending.js
const common = require('./_common.cjs');
exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return common.bad(405, 'POST only');
    const admin = event.headers['x-admin-key'] || event.headers['X-Admin-Key'];
    if (!common.auth(admin)) return common.bad(401, 'Unauthorized');
    const { key } = JSON.parse(event.body || '{}');
    if (!key) return common.bad(400, 'key required');
    const pend = await common.stores.pending();
    const listP = await pend.getJSON();
    const next = listP.filter(x => x.key !== key);
    await pend.setJSON(next);
    return common.json({ ok:true, removed: listP.length - next.length });
  } catch (e) {
    return common.bad(500, e.message || 'error');
  }
};