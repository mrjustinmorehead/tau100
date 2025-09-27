// netlify/functions/update_registrant.js
const common = require('./_common.cjs');
exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return common.bad(405, 'POST only');
    const admin = event.headers['x-admin-key'] || event.headers['X-Admin-Key'];
    if (!common.auth(admin)) return common.bad(401, 'Unauthorized');
    const { keyOrEmail, patch } = JSON.parse(event.body || '{}');
    if (!keyOrEmail || !patch || typeof patch !== 'object') return common.bad(400, 'keyOrEmail and patch required');
    const db = await common.stores.registrants();
    const items = await db.getJSON();
    let changed = 0;
    for (const r of items) {
      const hit = (r.key && r.key === keyOrEmail) || (r.email && r.email.toLowerCase() === String(keyOrEmail).toLowerCase());
      if (hit) {
        if (patch.name) r.name = String(patch.name);
        if (patch.yearJoined) r.yearJoined = Number(patch.yearJoined);
        if (patch.packageName) r.packageName = String(patch.packageName);
        if (patch.packageAmount != null) r.packageAmount = Number(patch.packageAmount);
        if (patch.optInPublic != null) r.optInPublic = !!patch.optInPublic;
        changed++;
      }
    }
    if (!changed) return common.json({ ok:false, changed, message:'No matches' });
    await db.setJSON(items);
    return common.json({ ok:true, changed });
  } catch (e) { return common.bad(500, e.message || 'error'); }
};