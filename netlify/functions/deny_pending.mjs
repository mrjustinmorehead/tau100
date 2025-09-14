\
import { json, bad, auth, stores } from "./_common.mjs";

export const handler = async (event) => {
  if (!auth(event)) return bad("Unauthorized", 401);
  if (event.httpMethod !== "POST") return bad("Method Not Allowed", 405);
  const { key } = JSON.parse(event.body || "{}");
  const pend = stores.pending();
  const item = await pend.getJSON(key);
  if (!item) return bad("Not found", 404);
  await pend.delete(key);
  return json({ ok:true });
};
