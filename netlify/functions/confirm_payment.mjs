import { json, bad, stores } from "./_common.mjs";

export const handler = async (event) => {
  const token = (event.queryStringParameters && event.queryStringParameters.token) || "";
  if (!token) return bad("Missing token", 400);

  const pend = stores.pending();
  const keys = await pend.list();
  let foundKey = null, item = null;

  for (const k of keys.blobs) {
    const j = await pend.getJSON(k.key);
    if (j && j.token === token) { foundKey = k.key; item = j; break; }
  }
  if (!item) return bad("Invalid token", 400);

  delete item.token;
  item.verification = "self";
  item.confirmedAt = new Date().toISOString();

  const regs = stores.registrants();
  const rkey = `reg_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  await regs.setJSON(rkey, item);
  await pend.delete(foundKey);

  const host = event.headers?.host;
  const proto = (event.headers?.["x-forwarded-proto"] || "https");
  const origin = process.env.SITE_URL || (host ? `${proto}://${host}` : "");
  const url = origin ? `${origin}/?success=1` : "/?success=1";

  return { statusCode: 302, headers: { Location: url } };
};
