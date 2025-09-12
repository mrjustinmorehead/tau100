
const { json, bad, auth, stores, getJSON, setJSON, del } = require('./_common');

exports.handler = async (event) => {
  if (!auth(event)) return bad('Unauthorized', 401);
  if (event.httpMethod !== 'POST') return bad('Method Not Allowed', 405);
  const { key } = JSON.parse(event.body || '{}');
  if (!key) return bad('Missing key', 400);

  const { pending, registrants, tokens } = stores();
  const item = await getJSON(pending, key);
  if (!item) return bad('Not found', 404);

  item.verification = 'admin';
  item.confirmedAt = new Date().toISOString();
  const rkey = `r_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  await setJSON(registrants, rkey, item);
  await del(pending, key);
  // Also remove any token mapping pointing to this key
  // (We don't have reverse index; safe to ignore)

  return json({ ok:true });
};
