const c = require('./_common.cjs');
exports.handler = async (event) => {
  try {
    if (!c.auth(event.headers['x-admin-key'])) return c.bad(401, 'unauthorized');
    const store = await c.stores.pending();
    const arr = await store.getJSON();
    return c.json(200, { ok: true, items: arr });
  } catch (e) {
    return c.bad(500, String(e && e.message || e));
  }
};