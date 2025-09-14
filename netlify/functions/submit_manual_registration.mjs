import { json, bad, paymentCode, uid, stores } from "./_common.mjs";

export const handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return bad("Method Not Allowed", 405);

    const body = JSON.parse(event.body || "{}");
    if (body.website) return bad("Spam", 400); // honeypot

    // Basic validation
    const required = ["name", "email", "phone", "yearJoined", "tshirtSize"];
    for (const f of required) {
      if (!body[f]) return bad(`Missing field: ${f}`, 400);
    }

    const now = new Date().toISOString();
    const code = paymentCode();
    const token = uid() + uid();
    const key = `pending_${Date.now()}_${uid()}`;

    const item = {
      key,
      name: body.name || "",
      email: body.email || "",
      phone: body.phone || "",
      yearJoined: Number(body.yearJoined || 0),
      tshirtSize: body.tshirtSize || "",
      packageName: body.packageName || "",
      packageAmount: Number(body.packageAmount || 0),
      optInPublic: !!body.optInPublic,
      createdAt: now,
      paymentCode: code,
      token
    };

    // Save to Blobs (pending)
    const store = stores.pending();
    await store.setJSON(key, item);

    // Build a safe origin if SITE_URL isn’t set
    const host = event.headers?.host;
    const proto = (event.headers?.["x-forwarded-proto"] || "https");
    const origin = process.env.SITE_URL || (host ? `${proto}://${host}` : "");

    const confirmUrl = `${origin}/.netlify/functions/confirm_payment?token=${token}`;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, paymentCode: code, confirmUrl, key })
    };
  } catch (err) {
    // Surface the error to the browser so you can see what went wrong
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: err?.message || String(err) })
    };
  }
};
