
const { json, bad, paymentCode, uid, stores } = require("./_common.cjs");
module.exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return bad("Method Not Allowed", 405);
    return bad("2026 tailgate registration is not open yet.", 403); // Remove once 2026 pricing is configured.
    const body = JSON.parse(event.body || "{}");
    if (body.website) return bad("Spam", 400);

    const required = ["name", "email", "phone", "yearJoined"];
    for (const f of required) { if (!body[f]) return bad(`Missing field: ${f}`, 400); }

    const now = new Date().toISOString();
    const code = paymentCode();
    const token = uid() + uid();
    const key = `pending_${Date.now()}_${uid()}`;

    const item = {
      key, name: body.name||"", email: body.email||"", phone: body.phone||"",
      yearJoined: Number(body.yearJoined||0), eventYear: 2026,
      packageName: body.packageName||"", packageAmount: Number(body.packageAmount||0),
      optInPublic: !!body.optInPublic, createdAt: now, paymentCode: code, token
    };

    const store = stores.pending();
    await store.setJSON(key, item);

    const host = event.headers && (event.headers.host || event.headers.Host);
    const proto = (event.headers && (event.headers["x-forwarded-proto"] || event.headers["X-Forwarded-Proto"])) || "https";
    const origin = process.env.SITE_URL || (host ? `${proto}://${host}` : "");

    const confirmUrl = `${origin}/.netlify/functions/confirm_payment?token=${token}`;
    return json({ ok:true, paymentCode: code, confirmUrl, key });
  } catch (err) {
    return { statusCode: 500, headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ ok:false, error: err && err.message || String(err) }) };
  }
};
