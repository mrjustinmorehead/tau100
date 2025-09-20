
// confirm_payment.js — Hardened for Blobs API differences
const { bad, stores } = require("./_common.cjs");

module.exports.handler = async (event) => {
  const token = (event.queryStringParameters && event.queryStringParameters.token) || "";
  if (!token) return bad("Missing token", 400);

  const pend = stores.pending();
  const keys = await pend.list();
  const arr = (keys && Array.isArray(keys.blobs)) ? keys.blobs : [];

  let foundKey = null, item = null;
  for (const k of arr) {
    const key = typeof k === "string" ? k : k.key;
    if (!key) continue;
    const j = await pend.getJSON(key);
    if (j && j.token === token) { foundKey = key; item = j; break; }
  }
  if (!item) return bad("Invalid token", 400);

  delete item.token;
  item.verification = "self";
  item.confirmedAt = new Date().toISOString();

  const regs = stores.registrants();
  const rkey = `reg_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  await regs.setJSON(rkey, item);
  await pend.delete(foundKey);

  const host = event.headers && (event.headers.host || event.headers.Host);
  const proto = (event.headers && (event.headers["x-forwarded-proto"] || event.headers["X-Forwarded-Proto"])) || "https";
  const origin = process.env.SITE_URL || (host ? `${proto}://${host}` : "");
  const url = origin ? `${origin}/?success=1` : "/?success=1";

  return { statusCode: 302, headers: { Location: url } };
};
