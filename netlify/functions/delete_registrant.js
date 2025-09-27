// netlify/functions/delete_registrant.js
const c = require('./_common.cjs');

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return c.bad(405, 'POST only');

    const admin = event.headers['x-admin-key'] || event.headers['X-Admin-Key'];
    if (!c.auth(admin)) return c.bad(401, 'Unauthorized');

    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch { return c.bad(400, 'Invalid JSON'); }

    const { key } = body;
    if (!key) return c.bad(400, 'key required');

    const db = await c.stores.registrants();
    const list = await db.getJSON();
    const exists = list.some(r => r.key === key);
    if (!exists) return c.bad(404, 'Registrant not found');

    const next = list.filter(r => r.key !== key);
    await db.setJSON(next);

    return c.json({ ok: true, removed: key, count: next.length });
  } catch (err) {
    return c.bad(500, err.message || 'error');
  }
};
