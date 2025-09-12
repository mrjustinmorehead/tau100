
const { json, bad, auth, stores, listJSON } = require('./_common');
exports.handler = async (event) => {
  if (!auth(event)) return bad('Unauthorized', 401);
  const { pending } = stores();
  const items = await listJSON(pending);
  return json({ items });
};
