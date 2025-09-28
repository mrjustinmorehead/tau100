const c = require('./_common.cjs');
exports.handler = async () => {
  try {
    const store = await c.stores.registrants();
    const arr = await store.getJSON();
    // filter out soft-deleted
    const out = (arr || []).filter(x => !x.deleted);
    return c.json(200, { ok: true, registrants: out });
  } catch (e) {
    return c.bad(500, String(e && e.message || e));
  }
};
