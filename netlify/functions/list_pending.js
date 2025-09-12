const { json, bad, auth, DB } = require('./_common');

exports.handler = async (event) => {
  if (!auth(event)) return bad('Unauthorized', 401);
  const items = Object.keys(DB.pending).map(k => ({ key:k, ...DB.pending[k] }));
  return json({ items });
};
