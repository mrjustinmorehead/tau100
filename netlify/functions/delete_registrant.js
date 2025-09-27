// netlify/functions/delete_registrant.js
const common = require('./_common.cjs');
exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return common.bad(405, 'POST only');
    const admin = event.headers['x-admin-key'] || event.headers['X-Admin-Key'];
    if (!common.auth(admin)) return common.bad(401, 'Unauthorized');
    const { keyOrEmail, allByEmail } = JSON.parse(event.body || '{}');
    if (!keyOrEmail) return common.bad(400, 'keyOrEmail required');
    const db = await common.stores.registrants();
    const items = await db.getJSON();
    let filtered;
    if (String(keyOrEmail).startsWith('reg_')) {
      filtered = items.filter(r => r.key !== keyOrEmail);
    } else if (allByEmail) {
      const email = String(keyOrEmail).toLowerCase();
      filtered = items.filter(r => (r.email||'').toLowerCase() !== email);
    } else {
      const email = String(keyOrEmail).toLowerCase();
      let removed = false; filtered = [];
      for (const r of items) {
        if (!removed && r.email && r.email.toLowerCase() === email) { removed = true; continue; }
        filtered.push(r);
      }
    }
    const removed = items.length - filtered.length;
    await db.setJSON(filtered);
    return common.json({ ok:true, removed });
  } catch (e) { return common.bad(500, e.message || 'error'); }
};