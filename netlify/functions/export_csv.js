const { NetlifyBlob } = require('@netlify/blobs');
exports.handler = async (event) => {
  if (event.headers['x-admin-key'] !== process.env.ADMIN_KEY) return { statusCode: 401, body: 'Unauthorized' };
  const now = new Date(); const iso = now.toISOString();
  const store = new NetlifyBlob({ siteID: process.env.SITE_ID });
  const keys = await store.list({ prefix: 'registrants/' });
  const rows = [[`Generated At`, iso], ['Name','Email','Phone','Year Joined','Photo URL','Opt-In Public','Created At']];
  for (const k of keys) {
    try {
      const r = JSON.parse(await store.get(k.key, { type: 'text' }));
      rows.push([r.name, r.email, r.phone, r.yearJoined, r.photoUrl || '', r.optInPublic ? 'Yes' : 'No', r.createdAt]);
    } catch {}
  }
  const csv = rows.map(row => row.map(v => '"' + String(v||'').replace(/"/g,'""') + '"').join(',')).join('\n');
  const safe = iso.replace(/[:]/g, '-');
  return { statusCode: 200, headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="registrants_${safe}.csv"` }, body: csv };
};
