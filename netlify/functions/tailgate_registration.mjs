import { getStore } from '@netlify/blobs';
const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: {'Content-Type':'application/json', 'Cache-Control':'no-store'} });
const store = () => getStore({name:'registrants-2026', consistency:'strong', ...(process.env.TAU_SITE_ID && process.env.TAU_BLOBS_TOKEN ? {siteID:process.env.TAU_SITE_ID, token:process.env.TAU_BLOBS_TOKEN} : {})});
const guests = r => Number.isInteger(r.guestCount) && r.guestCount >= 0 ? r.guestCount : 0;
export default async function handler(req) {
  try {
    if (req.method === 'POST') {
      let body; try { body = await req.json(); } catch { return reply({error:'Invalid registration.'},400); }
      if (!body || typeof body !== 'object' || body.website) return reply({error:'Invalid registration.'},400);
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const yearJoined = body.yearJoined, guestCount = body.guestCount;
      if (!name || name.length > 120) return reply({error:'Please enter your name.'},400);
      if (!Number.isInteger(yearJoined) || yearJoined < 1900 || yearJoined > 2026) return reply({error:'Enter a valid year crossed.'},400);
      if (!Number.isInteger(guestCount) || guestCount < 0 || guestCount > 1000) return reply({error:'Enter a whole number of guests, starting at zero.'},400);
      if (typeof body.requestId !== 'string' || !/^[a-f0-9-]{36}$/i.test(body.requestId)) return reply({error:'Please reload and try again.'},400);
      const regs = store(), key = `reg_${body.requestId}`;
      const previous = await regs.get(key,{type:'json'});
      if (previous) return reply({ok:true,registration:previous});
      const now = new Date().toISOString();
      const item = {key,name,yearJoined,guestCount,attendeeCount:1+guestCount,packageName:'Tailgate',packageAmount:25*(1+guestCount),eventYear:2026,optInPublic:body.optInPublic === true,createdAt:now,confirmedAt:now,verification:'not-required',paymentCode:`TAU-${body.requestId.slice(0,8).toUpperCase()}`};
      await regs.setJSON(key,item);
      return reply({ok:true,registration:item});
    }
    if (req.method !== 'GET') return reply({error:'Method not allowed.'},405);
    const regs = store(), listed = await regs.list(), entries = [];
    for (const {key} of listed.blobs || []) {
      if (key.startsWith('trash/')) continue;
      const r = await regs.get(key,{type:'json'}); if (r) entries.push(r);
    }
    const guestCount = entries.reduce((sum,r)=>sum+guests(r),0);
    const totals = {registrations:entries.length,guests:guestCount,attendees:entries.length+guestCount,amount:25*(entries.length+guestCount)};
    if (new URL(req.url).searchParams.get('format') === 'csv') {
      if (!process.env.ADMIN_KEY || req.headers.get('x-admin-key') !== process.env.ADMIN_KEY) return reply({error:'Unauthorized'},401);
      const cell = v => '"'+String(v ?? '').replace(/^[=+@-]/,"'").replaceAll('"','""')+'"';
      const rows = [['Name','Year crossed','Guests','Total attendees','Amount due','Registered at'],...entries.map(r=>[r.name,r.yearJoined,guests(r),1+guests(r),25*(1+guests(r)),r.createdAt])];
      return new Response(rows.map(row=>row.map(cell).join(',')).join('\r\n'),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="tau-2026-headcount.csv"','Cache-Control':'no-store'}});
    }
    return reply({totals,registrants:entries.filter(r=>r.optInPublic !== false).map(r=>({name:r.name,yearJoined:r.yearJoined,guestCount:guests(r)}))});
  } catch { return reply({error:'Unable to save or load registration right now. Please try again.'},500); }
}
