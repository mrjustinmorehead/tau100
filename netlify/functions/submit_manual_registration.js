// netlify/functions/submit_manual_registration.js
const common = require('./_common.cjs');

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return common.bad(405, 'POST only');
    common.assertBlobs();

    let body;
    try { body = JSON.parse(event.body || '{}'); }
    catch { return common.bad(400, 'Invalid JSON'); }

    if ((body.website||'').trim() !== '') return common.json({ ok:true, spam:true }, 200);

    const required = ['name','email','phone','yearJoined','packageName','packageAmount'];
    const missing = required.filter(k => body[k] == null || body[k] === '');
    if (missing.length) return common.bad(400, 'Missing fields', { missing });

    const payCode = common.code(6);
    const item = {
      key: 'pend_' + Date.now().toString(36),
      name: String(body.name),
      email: String(body.email),
      phone: String(body.phone),
      yearJoined: Number(body.yearJoined),
      tshirtSize: body.tshirtSize || null,
      optInPublic: !!body.optInPublic,
      packageName: String(body.packageName),
      packageAmount: Number(body.packageAmount),
      code: payCode,
      ts: Date.now()
    };

    const db = await common.stores.pending();
    let list = await db.getJSON();
    if (!Array.isArray(list)) list = []; // final guard
    list.push(item);
    await db.setJSON(list);

    const confirmUrl = `/.netlify/functions/confirm_payment?code=${encodeURIComponent(payCode)}`;
    return common.json({ ok:true, paymentCode: payCode, confirmUrl });
  } catch (e) {
    return common.bad(500, e.message || 'error', { where: 'submit_manual_registration' });
  }
};
