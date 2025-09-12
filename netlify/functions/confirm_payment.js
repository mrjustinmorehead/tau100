
const { json, bad, stores, getJSON, setJSON, del } = require('./_common');

exports.handler = async (event) => {
  const token = (event.queryStringParameters && event.queryStringParameters.token) || '';
  if (!token) return bad('Missing token', 400);

  const { pending, registrants, tokens } = stores();
  const tok = await getJSON(tokens, token);
  if (!tok || !tok.key) return bad('Invalid token', 400);
  const item = await getJSON(pending, tok.key);
  if (!item) return bad('Invalid or expired', 400);

  delete item.token;
  item.verification = 'self';
  item.confirmedAt = new Date().toISOString();
  const rkey = `r_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;

  await setJSON(registrants, rkey, item);
  await del(pending, tok.key);
  await del(tokens, token);

  const url = (process.env.SITE_URL || '') + '/?success=1';
  return { statusCode: 302, headers: { Location: url } };
};
