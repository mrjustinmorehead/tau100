
const { bad, auth, stores, listJSON } = require('./_common');

exports.handler = async (event) => {
  if (!auth(event)) return bad('Unauthorized', 401);
  const { registrants } = stores();
  const list = await listJSON(registrants);

  const rows = [
    ['Generated At', new Date().toISOString()].join(','),
    ['Name','Email','Phone','Year','TshirtSize','Package Name','Amount','Verification','Confirmed At','Created At'].join(',')
  ];
  for (const r of list) {
    const line = [
      (r.name||'').replace(/,/g,' '),
      (r.email||'').replace(/,/g,' '),
      (r.phone||'').replace(/,/g,' '),
      r.yearJoined||'',
      r.tshirtSize||'',
      (r.packageName||'').replace(/,/g,' '),
      r.packageAmount||'',
      r.verification||'',
      r.confirmedAt||'',
      r.createdAt||''
    ].join(',');
    rows.push(line);
  }
  const body = rows.join('\n');
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="registrants.csv"' },
    body
  };
};
