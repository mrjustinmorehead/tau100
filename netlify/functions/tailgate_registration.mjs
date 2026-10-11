import { getStore } from '@netlify/blobs';
const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: {'Content-Type':'application/json', 'Cache-Control':'no-store'} });
const store = () => getStore({name:'registrants-2026', consistency:'strong', ...(process.env.TAU_SITE_ID && process.env.TAU_BLOBS_TOKEN ? {siteID:process.env.TAU_SITE_ID, token:process.env.TAU_BLOBS_TOKEN} : {})});
const validId = id => typeof id === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id);
const guests = r => Number.isInteger(r.guestCount) && r.guestCount >= 0 ? r.guestCount : 0;
export default async function handler(req) {
  try {
    const managementId = req.headers.get('x-registration-id');
    if (managementId) {
      if (!validId(managementId)) return reply({error:'Invalid registration link.'},400);
      const regs = store(), key = `reg_${managementId}`;
      const item = await regs.get(key,{type:'json'});
      if (!item) return reply({error:'Registration not found.'},404);
      if (req.method === 'GET') return reply({ok:true,registration:item});
      if (req.method !== 'PATCH') return reply({error:'Method not allowed.'},405);
      let changes; try { changes = await req.json(); } catch { return reply({error:'Invalid update.'},400); }
      if (!changes || typeof changes !== 'object') return reply({error:'Invalid update.'},400);
      if (changes.action === 'cancel') {
        item.cancelledAt = item.cancelledAt || new Date().toISOString();
      } else if (changes.action === 'restore') {
        delete item.cancelledAt;
      } else if (changes.action === 'update') {
        if (item.cancelledAt) return reply({error:'Restore your registration before updating it.'},409);
        const name = typeof changes.name === 'string' ? changes.name.trim() : '';
        if (!name || name.length > 120) return reply({error:'Please enter your name.'},400);
        if (!Number.isInteger(changes.yearJoined) || changes.yearJoined < 1900 || changes.yearJoined > 2026) return reply({error:'Enter a valid year crossed.'},400);
        if (!Number.isInteger(changes.guestCount) || changes.guestCount < 0 || changes.guestCount > 1000) return reply({error:'Enter a whole number of guests, starting at zero.'},400);
        Object.assign(item,{name,yearJoined:changes.yearJoined,guestCount:changes.guestCount,attendeeCount:1+changes.guestCount,packageAmount:25*(1+changes.guestCount),optInPublic:changes.optInPublic === true});
      } else return reply({error:'Invalid update.'},400);
      item.updatedAt = new Date().toISOString();
      await regs.setJSON(key,item);
      return reply({ok:true,registration:item});
    }
    if (req.method === 'POST') {
      let body; try { body = await req.json(); } catch { return reply({error:'Invalid registration.'},400); }
      if (!body || typeof body !== 'object' || body.website) return reply({error:'Invalid registration.'},400);
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const yearJoined = body.yearJoined, guestCount = body.guestCount;
      if (!name || name.length > 120) return reply({error:'Please enter your name.'},400);
      if (!Number.isInteger(yearJoined) || yearJoined < 1900 || yearJoined > 2026) return reply({error:'Enter a valid year crossed.'},400);
      if (!Number.isInteger(guestCount) || guestCount < 0 || guestCount > 1000) return reply({error:'Enter a whole number of guests, starting at zero.'},400);
      if (!validId(body.requestId)) return reply({error:'Please reload and try again.'},400);
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
    const active = entries.filter(r=>!r.cancelledAt);
    const guestCount = active.reduce((sum,r)=>sum+guests(r),0);
    const totals = {registrations:active.length,guests:guestCount,attendees:active.length+guestCount,amount:25*(active.length+guestCount)};
    if (new URL(req.url).searchParams.get('format') === 'csv') {
      if (!process.env.ADMIN_KEY || req.headers.get('x-admin-key') !== process.env.ADMIN_KEY) return reply({error:'Unauthorized'},401);
      const cell = v => '"'+String(v ?? '').replace(/^[=+@-]/,"'").replaceAll('"','""')+'"';
      const rows = [['Name','Year crossed','Guests','Total attendees','Amount due','Payment code','Status','Registered at','Updated at','Cancelled at'],...entries.map(r=>[r.name,r.yearJoined,guests(r),r.cancelledAt?0:1+guests(r),r.cancelledAt?0:25*(1+guests(r)),r.paymentCode,r.cancelledAt?'Cancelled':'Registered',r.createdAt,r.updatedAt,r.cancelledAt])];
      return new Response(rows.map(row=>row.map(cell).join(',')).join('\r\n'),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="tau-2026-headcount.csv"','Cache-Control':'no-store'}});
    }
    return reply({totals,registrants:active.filter(r=>r.optInPublic !== false).map(r=>({name:r.name,yearJoined:r.yearJoined,guestCount:guests(r)}))});
  } catch { return reply({error:'Unable to save or load registration right now. Please try again.'},500); }
}
