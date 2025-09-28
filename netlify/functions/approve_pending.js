const c = require('./_common.cjs');
exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return c.bad(405, 'POST only');
    if (!c.auth(event.headers['x-admin-key'])) return c.bad(401, 'unauthorized');
    const { key } = JSON.parse(event.body || '{}');
    if (!key) return c.bad(400, 'missing key');

    const pend = await c.stores.pending();
    const regs = await c.stores.registrants();
    const p = await pend.getJSON();
    const r = await regs.getJSON();

    const idx = p.findIndex(x => x.key === key);
    if (idx === -1) return c.bad(404, 'not found');
    const rec = p.splice(idx, 1)[0];
    rec.paid = true; rec.confirmedAt = new Date().toISOString();

    r.push(rec);
    await pend.setJSON(p);
    await regs.setJSON(r);

    return c.json(200, { ok: true });
  } catch (e) {
    return c.bad(500, String(e && e.message || e));
  }
};