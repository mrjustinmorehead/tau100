// /netlify/functions/list_memories.js
const { NetlifyBlob } = require('@netlify/blobs');
exports.handler = async () => {
  const store = new NetlifyBlob({ siteID: process.env.SITE_ID });
  const keys = await store.list({ prefix: 'memories/approved/' });
  const out = [];
  for (const k of keys) { try { out.push(JSON.parse(await store.get(k.key, { type: 'text' }))); } catch {} }
  out.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
  return { statusCode: 200, body: JSON.stringify({ memories: out }) };
};
