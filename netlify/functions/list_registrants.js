const { NetlifyBlob } = require('@netlify/blobs');
exports.handler = async () => {
  try {
    const store = new NetlifyBlob({ siteID: process.env.SITE_ID });
    const keys = await store.list({ prefix: 'registrants/' });
    const registrants = [];
    for (const k of keys) {
      try {
        const text = await store.get(k.key, { type: 'text' });
        const r = JSON.parse(text);
        registrants.push(r);
      } catch {}
    }
    registrants.sort((a,b) => (a.yearJoined - b.yearJoined) || a.name.localeCompare(b.name));
    return { statusCode: 200, body: JSON.stringify({ registrants }) };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: 'List error' };
  }
};
