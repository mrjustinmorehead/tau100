const c = require('./_common.cjs');
exports.handler = async () => {
  try { const s=await c.stores.registrants(); const a=await s.getJSON(); return c.json(200,{ok:true,registrants:(a||[]).filter(x=>!x.deleted)}); }
  catch(e){ return c.bad(500,String(e&&e.message||e)); }
};