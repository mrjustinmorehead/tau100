import { NetlifyBlob } from '@netlify/blobs';
export const handler = async () => {
  try {
    const store = new NetlifyBlob({ siteID: process.env.SITE_ID });
    const list = await store.list({ prefix: 'registrants/' });
    const objs = list?.objects || [];
    const arr = [];
    for (const o of objs) {
      const txt = await store.get(o.key).then(r => r.text());
      arr.push(JSON.parse(txt));
    }
    arr.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
    return { statusCode: 200, body: JSON.stringify({ registrants: arr }) };
  } catch (e) { console.error(e); return { statusCode: 500, body: 'Error' }; }
};