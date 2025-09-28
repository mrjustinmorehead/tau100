const c = require('./_common.cjs');
exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return c.bad(405, 'POST only');
    let input = {};
    try { input = JSON.parse(event.body || '{}'); } catch { return c.bad(400, 'invalid JSON'); }

    const name = (input.name || '').trim();
    const email = (input.email || '').trim();
    const phone = (input.phone || '').trim();
    const yearJoined = Number(input.yearJoined || 0);
    const packageName = input.packageName || 'Centennial Sponsorship';
    const packageAmount = Number(input.packageAmount || 100);
    const tshirtSize = input.tshirtSize || '';
    const optInPublic = input.optInPublic === true;

    if (!name || !email || !phone || !yearJoined) return c.bad(400, 'missing fields');

    const pending = await c.stores.pending();
    const list = await pending.getJSON();
    const key = c.uid();
    const paymentCode = 'TAU-' + c.uid().toUpperCase();

    const rec = {
      key, name, email, phone, yearJoined, tshirtSize,
      packageName, packageAmount, optInPublic,
      paymentCode, paid: false, createdAt: new Date().toISOString()
    };
    list.push(rec);
    await pending.setJSON(list);

    const confirmUrl = '/.netlify/functions/confirm_payment?code=' + encodeURIComponent(paymentCode);
    return c.json(200, { ok: true, paymentCode, confirmUrl });
  } catch (e) {
    return c.bad(500, String(e && e.message || e));
  }
};