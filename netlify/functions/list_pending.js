
const { json, bad, auth, stores } = require("./_common.cjs");
module.exports.handler = async (event) => {
  if (!auth(event)) return bad("Unauthorized", 401);
  const store = stores.pending();
  const keys = await store.list();
  const items = [];
  for (const k of keys.blobs) {
    const j = await store.getJSON(k.key);
    if (j) items.push({ key: k.key, ...j });
  }
  items.sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt));
  return json({ items });
};
