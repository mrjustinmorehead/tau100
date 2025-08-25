const { NetlifyBlob } = require('@netlify/blobs');
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  if (event.headers['x-admin-key'] !== process.env.ADMIN_KEY) return { statusCode: 401, body: 'Unauthorized' };
  const { key } = JSON.parse(event.body || '{}');
  if (!key || !key.startsWith('memories/pending/')) return { statusCode: 400, body: 'Bad key' };
  const store = new NetlifyBlob({ siteID: process.env.SITE_ID });
  const text = await store.get(key, { type: 'text' });
  const obj = JSON.parse(text);
  const newKey = key.replace('memories/pending/', 'memories/approved/');
  await store.set(newKey, JSON.stringify(obj), { contentType: 'application/json' });
  await store.delete(key);
  return { statusCode: 200, body: 'Approved' };
};
