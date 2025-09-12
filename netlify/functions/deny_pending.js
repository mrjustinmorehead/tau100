const { json, bad, auth, DB } = require('./_common');

exports.handler = async (event) => {
  if (!auth(event)) return bad('Unauthorized', 401);
  if (event.httpMethod !== 'POST') return bad('Method Not Allowed', 405);
  const { key } = JSON.parse(event.body || '{}');
  if (!key || !DB.pending[key]) return bad('Not found', 404);
  delete DB.pending[key];
  return json({ ok:true });
};
