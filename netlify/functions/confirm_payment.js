// netlify/functions/confirm_payment.js
const common = require('./_common.cjs');
exports.handler = async (event) => {
  try {
    const code = (event.queryStringParameters && event.queryStringParameters.code) || '';
    if (!code) return common.bad(400, 'code required');

    const pend = await common.stores.pending();
    const reg  = await common.stores.registrants();
    const listP = await pend.getJSON();
    const idx = listP.findIndex(x => (x.code||'').toUpperCase() === String(code).toUpperCase());
    if (idx === -1) {
      return common.json({ ok:false, message:'Payment code not found or already confirmed' }, 404);
    }
    const it = listP.splice(idx,1)[0];
    const listR = await reg.getJSON();
    listR.push({
      key: 'reg_' + Date.now().toString(36),
      name: it.name, email: it.email, phone: it.phone,
      yearJoined: it.yearJoined, tshirtSize: it.tshirtSize,
      optInPublic: it.optInPublic, packageName: it.packageName, packageAmount: it.packageAmount,
      ts: Date.now()
    });
    await pend.setJSON(listP);
    await reg.setJSON(listR);

    const html = `<!doctype html><meta charset="utf-8"><title>Confirmed</title>
      <style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:2rem}</style>
      <h1>Payment Confirmed</h1>
      <p>Thanks! Your registration has been recorded.</p>
      <p><a href="/">Return to site</a></p>`;
    return { statusCode:200, headers:{'Content-Type':'text/html'}, body: html };
  } catch (e) {
    return common.bad(500, e.message || 'error');
  }
};