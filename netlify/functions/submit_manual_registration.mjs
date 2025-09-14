import { json, bad, paymentCode, uid, stores } from "./_common.mjs";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return bad("Method Not Allowed", 405);
  const body = JSON.parse(event.body || "{}");
  if (body.website) return bad("Spam", 400);
  const now = new Date().toISOString();
  const code = paymentCode();
  const token = uid() + uid();
  const key = `pending_${Date.now()}_${uid()}`;
  const item = {
    key, name: body.name || "", email: body.email || "", phone: body.phone || "",
    yearJoined: Number(body.yearJoined || 0), tshirtSize: body.tshirtSize || "",
    packageName: body.packageName || "", packageAmount: Number(body.packageAmount || 0),
    optInPublic: !!body.optInPublic, createdAt: now, paymentCode: code, token
  };
  const store = stores.pending();
  await store.setJSON(key, item);
  const confirmUrl = `${process.env.SITE_URL || ""}/.netlify/functions/confirm_payment?token=${token}`;
  return json({ ok:true, paymentCode: code, confirmUrl, key });
};
