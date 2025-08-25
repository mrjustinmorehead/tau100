// /netlify/functions/submit_memory.js
const { NetlifyBlob } = require('@netlify/blobs');
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  const { name, email, story, photoUrl } = JSON.parse(event.body || '{}');
  if (!name || !email || !story) return { statusCode: 400, body: 'Missing fields' };
  const store = new NetlifyBlob({ siteID: process.env.SITE_ID });
  const key = `memories/pending/${Date.now()}-${name.replace(/[^a-z0-9_.-]/gi,'_')}.json`;
  await store.set(key, JSON.stringify({ name, email, story, photoUrl: photoUrl || '', createdAt: new Date().toISOString() }), { contentType: 'application/json' });
  return { statusCode: 200, body: 'OK' };
};
