const c = require('./_common.cjs');

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return c.bad('POST only', 405);
    const admin = event.headers['x-admin-key'] || '';
    if (!c.auth(admin)) return c.bad('unauthorized', 401);

    const body = JSON.parse(event.body || '{}');
    const id = body.id;
    const patch = body.patch || {};
    if (!id) return c.bad('missing id');

    const store = await c.stores.registrants();
    const list = await store.getJSON();
    const idx = list.findIndex(x => (x.key||'') === id);
    if (idx === -1) return c.bad('not found', 404);

    list[idx] = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
    await store.setJSON(list);
    return c.json(200, { ok:true, item: list[idx] });
  } catch (e) {
    return c.bad(e && e.message || String(e), 500);
  }
};
