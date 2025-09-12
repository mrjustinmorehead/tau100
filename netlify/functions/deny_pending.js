
const { json, bad, auth, stores, del } = require('./_common');

exports.handler = async (event) => {
  if (!auth(event)) return bad('Unauthorized', 401);
  if (event.httpMethod !== 'POST') return bad('Method Not Allowed', 405);
  const { key } = JSON.parse(event.body || '{}');
  if (!key) return bad('Missing key', 400);

  const { pending } = stores();
  await del(pending, key);
  return json({ ok:true });
};
