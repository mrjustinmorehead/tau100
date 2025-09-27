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
    const listP = await pend.getJSON();
    const listR = await reg.getJSON();

    const idx = listP.findIndex(x => x.key === key);
    if (idx === -1) return common.bad(404, 'Not found');

    const it = listP.splice(idx,1)[0];
    const regItem = {
      key: 'reg_' + Date.now().toString(36),
      name: it.name, email: it.email, phone: it.phone,
      yearJoined: it.yearJoined, tshirtSize: it.tshirtSize,
      optInPublic: it.optInPublic, packageName: it.packageName, packageAmount: it.packageAmount,
      ts: Date.now()
    };
    listR.push(regItem);
    await pend.setJSON(listP);
    await reg.setJSON(listR);
    return common.json({ ok:true, moved:true });
  } catch (e) {
    return common.bad(500, e.message || 'error');
  }
};