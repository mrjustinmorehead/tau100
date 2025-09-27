// netlify/functions/approve_pending.js
const common = require('./_common.cjs');
exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return common.bad(405, 'POST only');
    const admin = event.headers['x-admin-key'] || event.headers['X-Admin-Key'];
    if (!common.auth(admin)) return common.bad(401, 'Unauthorized');
    const { key } = JSON.parse(event.body || '{}');
    if (!key) return common.bad(400, 'key required');

    const pend = await common.stores.pending();
    const reg  = await common.stores.registrants();

    let listP = await pend.getJSON(); if (!Array.isArray(listP)) listP = common.normalizeToArray(listP);
    const idx = listP.findIndex(x => x.key === key);
    if (idx === -1) return common.bad(404, 'Not found');

    const it = listP.splice(idx,1)[0];
    let listR = await reg.getJSON(); if (!Array.isArray(listR)) listR = common.normalizeToArray(listR);
    listR.push({ key:'reg_'+Date.now().toString(36), name:it.name, email:it.email, phone:it.phone, yearJoined:it.yearJoined, tshirtSize:it.tshirtSize, optInPublic:it.optInPublic, packageName:it.packageName, packageAmount:it.packageAmount, ts:Date.now() });

    await pend.setJSON(listP);
    await reg.setJSON(listR);
    return common.json({ ok:true });
  } catch (e) { return common.bad(500, e.message || 'error'); }
};
