// /netlify/functions/export_csv.js
const { NetlifyBlob } = require('@netlify/blobs');

exports.handler = async (event) => {
  if (event.headers['x-admin-key'] !== process.env.ADMIN_KEY) return { statusCode: 401, body: 'Unauthorized' };
  try {
    const store = new NetlifyBlob({ siteID: process.env.SITE_ID });
    const list = await store.list({ prefix: 'registrants/' });
    const generatedAt = new Date().toISOString();

    const rows = [];
    rows.push(['Generated At', generatedAt]);
    rows.push([]);
    rows.push(['Name','Email','Phone','Year Joined','T-Shirt Size','Photo URL','Opt-In Public','Created At']);

    for (const item of list) {
      try {
        const text = await store.get(item.key, { type: 'text' });
        const r = JSON.parse(text);
        rows.push([
          r.name || '',
          r.email || '',
          r.phone || '',
          r.yearJoined || '',
          r.tshirtSize || '',
          r.photoUrl || '',
          r.optInPublic ? 'Yes' : 'No',
          r.createdAt || ''
        ]);
      } catch (e) {}
    }

    const csv = rows.map(row => row.map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="registrants_${generatedAt.replace(/[:]/g,'-')}.csv"`
      },
      body: csv
    };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: 'Export error' };
  }
};
