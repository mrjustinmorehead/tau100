
const { json, bad, auth, stores } = require("./_common.cjs");
module.exports.handler = async (event) => {
  if (!auth(event)) return bad("Unauthorized", 401);
  if (event.httpMethod !== "POST") return bad("Method Not Allowed", 405);
  const { key } = JSON.parse(event.body || "{}");
  const pend = stores.pending();
  const item = await pend.getJSON(key);
  if (!item) return bad("Not found", 404);
  await pend.delete(key);
  return json({ ok:true });
};
