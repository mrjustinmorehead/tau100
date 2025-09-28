const c = require('./_common');

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
    if (!Array.isArray(list) || !list.some(r => r && r.key === key)) return c.bad(404, 'Registrant not found');

    const next = list.filter(r => r && r.key !== key);
    await db.setJSON(next);

    return c.json({ ok: true, removed: key, remaining: next.length });
  } catch (e) {
    return c.bad(500, e.message || 'error');
  }
};
