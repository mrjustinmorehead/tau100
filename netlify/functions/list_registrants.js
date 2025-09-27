// netlify/functions/list_registrants.js
const common = require('./_common.cjs');
exports.handler = async () => {
  try {
    const db = await common.stores.registrants();
    let registrants = await db.getJSON();
    if (!Array.isArray(registrants)) registrants = common.normalizeToArray(registrants);
    return common.json({ ok:true, registrants });
  } catch (e) { return common.bad(500, e.message || 'error'); }
};
