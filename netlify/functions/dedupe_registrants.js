// netlify/functions/dedupe_registrants.js
const c = require('./_common.cjs');

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return c.bad(405, 'POST only');

    const admin = event.headers['x-admin-key'] || event.headers['X-Admin-Key'];
    if (!c.auth(admin)) return c.bad(401, 'Unauthorized');

    const db = await c.stores.registrants();
    const list = await db.getJSON();

    // Keep the most recent per (email + yearJoined)
    const keep = new Map();
    for (const r of list) {
      const k = `${(r.email||'').trim().toLowerCase()}::${r.yearJoined||''}`;
      const prev = keep.get(k);
      if (!prev || (r.ts||0) > (prev.ts||0)) keep.set(k, r);
    }
    const next = Array.from(keep.values());
    const removed = list.length - next.length;

    await db.setJSON(next);
    return c.json({ ok:true, removed, remaining: next.length });
  } catch (err) {
    return c.bad(500, err.message || 'error');
  }
};
