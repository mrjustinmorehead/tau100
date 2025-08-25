import { NetlifyBlob } from '@netlify/blobs';
export const handler = async (event) => {
  try {
    const admin = event.headers['x-admin-key'] || '';
    if (!process.env.ADMIN_KEY || admin !== process.env.ADMIN_KEY) return { statusCode: 401, body: 'Unauthorized' };
    const store = new NetlifyBlob({ siteID: process.env.SITE_ID });
    const list = await store.list({ prefix: 'registrants/' });
    const items = list?.objects || [];
    let rows = [];
    for (const obj of items) {
      const text = await store.get(obj.key).then(r => r.text());
      const j = JSON.parse(text);
      rows.push(j);
    }
    rows.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
    const header = ['Name','Email','Phone','YearJoined','TShirtSize','PhotoUrl','OptInPublic','CreatedAt'];
    const out = ['Generated At,' + new Date().toISOString(), header.join(',')]
      .concat(rows.map(r => [
        (r.name||'').replace(/,/g,' '),
        (r.email||''),
        (r.phone||'').replace(/,/g,' '),
        r.yearJoined||'',
        r.tshirtSize||'',
        r.photoUrl||'',
        r.optInPublic ? 'TRUE':'FALSE',
        r.createdAt||''
      ].join(','))).join('\n');
    return { statusCode: 200, headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="registrants_${new Date().toISOString().replace(/[:]/g,'-')}.csv"` }, body: out };
  } catch (e) { console.error(e); return { statusCode: 500, body: 'CSV error' }; }
};