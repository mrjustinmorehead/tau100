import { getStore } from '@netlify/blobs';
const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: {'Content-Type':'application/json', 'Cache-Control':'no-store'} });
const store = () => getStore({name:'registrants-2026', consistency:'strong', ...(process.env.TAU_SITE_ID && process.env.TAU_BLOBS_TOKEN ? {siteID:process.env.TAU_SITE_ID, token:process.env.TAU_BLOBS_TOKEN} : {})});
const validId = id => typeof id === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id);
const guests = r => Number.isInteger(r.guestCount) && r.guestCount >= 0 ? r.guestCount : 0;
export default async function handler(req) {
  try {

    if (new URL(req.url).searchParams.get('admin') === '1') {
      if (!process.env.ADMIN_KEY || req.headers.get('x-admin-key') !== process.env.ADMIN_KEY) return reply({error:'Incorrect admin passcode.'},401);
      const regs=store();
      if(req.method==='GET'){
        const listed=await regs.list(),registrations=[];
        for(const {key} of listed.blobs||[]){if(key.startsWith('trash/'))continue;const r=await regs.get(key,{type:'json'});if(r)registrations.push({key,name:r.name,guestCount:guests(r),optInPublic:r.optInPublic!==false,cancelledAt:r.cancelledAt||null,paymentCode:r.paymentCode||''});}
        return reply({registrations});
      }
      let body;try{body=await req.json();}catch{return reply({error:'Invalid registration.'},400);}
      if(!body || typeof body!=='object')return reply({error:'Invalid registration.'},400);
      if(req.method==='POST'){
        return handler(new Request(new URL(req.url).origin+new URL(req.url).pathname,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:body.name,guestCount:body.guestCount,optInPublic:body.optInPublic,requestId:body.requestId})}));
      }
      if(req.method!=='PATCH')return reply({error:'Method not allowed.'},405);
      if(typeof body.key!=='string'||!body.key.startsWith('reg_')||body.key.length>200||body.key.includes('/'))return reply({error:'Invalid registration.'},400);
      const item=await regs.get(body.key,{type:'json'});if(!item)return reply({error:'Registration not found.'},404);
      if(body.action==='delete'){item.cancelledAt=item.cancelledAt||new Date().toISOString();}
      else if(body.action==='restore'){delete item.cancelledAt;}
      else if(body.action==='update'){
        const name=typeof body.name==='string'?body.name.trim():'';
        if(!name||name.length>120)return reply({error:'Please enter a name.'},400);
        if(!Number.isInteger(body.guestCount)||body.guestCount<0||body.guestCount>1000)return reply({error:'Enter a whole number of guests from 0 to 1000.'},400);
        Object.assign(item,{name,guestCount:body.guestCount,attendeeCount:1+body.guestCount,packageAmount:25*(1+body.guestCount),optInPublic:body.optInPublic===true});
      }else return reply({error:'Invalid action.'},400);
      item.updatedAt=new Date().toISOString();await regs.setJSON(body.key,item);return reply({ok:true});
    }

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
        if (!Number.isInteger(changes.guestCount) || changes.guestCount < 0 || changes.guestCount > 1000) return reply({error:'Enter a whole number of guests, starting at zero.'},400);
        Object.assign(item,{name,guestCount:changes.guestCount,attendeeCount:1+changes.guestCount,packageAmount:25*(1+changes.guestCount),optInPublic:changes.optInPublic === true});
      } else return reply({error:'Invalid update.'},400);
      item.updatedAt = new Date().toISOString();
      await regs.setJSON(key,item);
      return reply({ok:true,registration:item});
    }
    if (req.method === 'POST') {
      let body; try { body = await req.json(); } catch { return reply({error:'Invalid registration.'},400); }
      if (!body || typeof body !== 'object' || body.website) return reply({error:'Invalid registration.'},400);
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const guestCount = body.guestCount;
      if (!name || name.length > 120) return reply({error:'Please enter your name.'},400);
      if (!Number.isInteger(guestCount) || guestCount < 0 || guestCount > 1000) return reply({error:'Enter a whole number of guests, starting at zero.'},400);
      if (!validId(body.requestId)) return reply({error:'Please reload and try again.'},400);
      const regs = store(), key = `reg_${body.requestId}`;
      const previous = await regs.get(key,{type:'json'});
      if (previous) return reply({ok:true,registration:previous});
      const now = new Date().toISOString();
      const item = {key,name,guestCount,attendeeCount:1+guestCount,packageName:'Tailgate',packageAmount:25*(1+guestCount),eventYear:2026,optInPublic:body.optInPublic === true,createdAt:now,confirmedAt:now,verification:'not-required',paymentCode:`TAU-${body.requestId.slice(0,8).toUpperCase()}`};
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
      const rows = [['Name','Guests','Total attendees','Amount due','Payment code','Status','Registered at','Updated at','Cancelled at'],...entries.map(r=>[r.name,guests(r),r.cancelledAt?0:1+guests(r),r.cancelledAt?0:25*(1+guests(r)),r.paymentCode,r.cancelledAt?'Cancelled':'Registered',r.createdAt,r.updatedAt,r.cancelledAt])];
      return new Response(rows.map(row=>row.map(cell).join(',')).join('\r\n'),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="tau-2026-headcount.csv"','Cache-Control':'no-store'}});
    }
    return reply({totals,registrants:active.filter(r=>r.optInPublic !== false).map(r=>({name:r.name,guestCount:guests(r)}))});
  } catch { return reply({error:'Unable to save or load registration right now. Please try again.'},500); }
}
