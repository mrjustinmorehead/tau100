const c = require('./_common.cjs');
function csvEscape(s){ if(s==null) return ''; s=String(s); if(/[",\n]/.test(s)) return '"' + s.replace(/"/g,'""') + '"'; return s; }
exports.handler = async (event) => {
  try {
    if (!c.auth(event.headers['x-admin-key'])) return c.bad(401, 'unauthorized');
    const regs = await c.stores.registrants();
    const arr = (await regs.getJSON()).filter(x=>!x.deleted);
    const cols = ['key','name','email','phone','yearJoined','tshirtSize','packageName','packageAmount','paid','createdAt','confirmedAt'];
    const lines = [cols.join(',')];
    for(const r of arr){
      lines.push(cols.map(k=>csvEscape(r[k])).join(','));
    }
    return {
      statusCode: 200,
      headers: {
        'content-type': 'text/csv',
        'content-disposition': 'attachment; filename=registrants.csv'
      },
      body: lines.join('\n')
    };
  } catch (e) {
    return c.bad(500, String(e && e.message || e));
  }
};
