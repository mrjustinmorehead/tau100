const { json, bad, auth, DB } = require('./_common');

exports.handler = async (event) => {
  if (!auth(event)) return bad('Unauthorized', 401);
  if (event.httpMethod !== 'POST') return bad('Method Not Allowed', 405);
  const { key } = JSON.parse(event.body || '{}');
  if (!key || !DB.pending[key]) return bad('Not found', 404);
  const item = DB.pending[key];
  item.verification = 'admin';
  item.confirmedAt = new Date().toISOString();
  const rkey = `reg_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  DB.registrants[rkey] = item;
  delete DB.pending[key];
  return json({ ok:true });
};
