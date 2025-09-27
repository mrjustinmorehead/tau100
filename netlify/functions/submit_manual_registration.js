// netlify/functions/submit_manual_registration.js
const common = require('./_common.cjs');

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return common.bad(405, 'POST only');
    const body = JSON.parse(event.body || '{}');
    if ((body.website||'').trim() !== '') return common.json({ ok:true, spam:true }, 200); // honeypot

    const required = ['name','email','phone','yearJoined','packageName','packageAmount'];
    for (const k of required) if (body[k] == null || body[k] === '') return common.bad(400, `Missing ${k}`);

    const payCode = common.code(6);
    const item = {
      key: 'pend_' + Date.now().toString(36),
      name: body.name,
      email: body.email,
      phone: body.phone,
      yearJoined: Number(body.yearJoined),
      tshirtSize: body.tshirtSize || null,
      optInPublic: !!body.optInPublic,
      packageName: String(body.packageName),
      packageAmount: Number(body.packageAmount),
      code: payCode,
      ts: Date.now()
    };

    const db = await common.stores.pending();
    const list = await db.getJSON();
    list.push(item);
    await db.setJSON(list);

    const confirmUrl = `/.netlify/functions/confirm_payment?code=${encodeURIComponent(payCode)}`;
    return common.json({ ok:true, paymentCode: payCode, confirmUrl });
  } catch (e) {
    return common.bad(500, e.message || 'error');
  }
};