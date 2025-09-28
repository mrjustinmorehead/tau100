const c = require('./_common.cjs');

exports.handler = async (event) => {
  try {
    const code = (event.queryStringParameters && event.queryStringParameters.code || '').trim();
    if (!code) return c.bad(400, 'missing code');

    const pending = await c.stores.pending();
    const registrants = await c.stores.registrants();
    const pendList = await pending.getJSON();
    const regList = await registrants.getJSON();

    const idx = pendList.findIndex(x => (x.paymentCode || '').toUpperCase() === code.toUpperCase());
    if (idx === -1) {
      // already confirmed? show friendly message
      return {
        statusCode: 200,
        headers: { 'content-type': 'text/html' },
        body: '<h1>Already Confirmed</h1><p>This payment code was not found in pending. It may already be confirmed.</p><p><a href="/">Return to site</a></p>'
      };
    }
    const rec = pendList.splice(idx, 1)[0];
    rec.paid = true;
    rec.confirmedAt = new Date().toISOString();

    // ensure a key
    if (!rec.key) rec.key = c.uid();

    // avoid duplicate by same email + amount (basic)
    const dup = regList.findIndex(x => (x.email||'').toLowerCase() === (rec.email||'').toLowerCase() && Number(x.packageAmount||0)===Number(rec.packageAmount||0) && !x.deleted);
    if (dup !== -1) {
      // replace older duplicate
      regList.splice(dup, 1, rec);
    } else {
      regList.push(rec);
    }

    await pending.setJSON(pendList);
    await registrants.setJSON(regList);

    return {
      statusCode: 302,
      headers: { Location: '/#register?confirmed=1' }
    };
  } catch (e) {
    return c.bad(500, String(e && e.message || e));
  }
};
