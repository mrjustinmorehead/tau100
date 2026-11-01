import { getStore } from '@netlify/blobs';
import { createHash } from 'node:crypto';
const env=key=>globalThis.Netlify?.env?.get(key) ?? process.env[key];
const store=()=>getStore({name:'homecoming-email-updates',consistency:'strong',...(env('TAU_SITE_ID')&&env('TAU_BLOBS_TOKEN')?{siteID:env('TAU_SITE_ID'),token:env('TAU_BLOBS_TOKEN')}:{})});
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export default async function handler(req){
 try{
  const url=new URL(req.url),admin=url.searchParams.get('admin')==='1';
  if(admin){
   if(!env('ADMIN_KEY')||req.headers.get('x-admin-key')!==env('ADMIN_KEY'))return reply({error:'Incorrect admin passcode.'},401);
   const db=store();
   if(req.method==='GET'){
    const subscribers=[];let cursor;
    do{const page=await db.list(cursor?{cursor}:{});for(const {key} of page.blobs||[]){const r=await db.get(key,{type:'json'});if(r&&!r.removedAt)subscribers.push({id:key,name:r.name,email:r.email,signedUpAt:r.signedUpAt,consent:r.consent});}cursor=page.cursor;}while(cursor);
    subscribers.sort((a,b)=>b.signedUpAt.localeCompare(a.signedUpAt));
    if(url.searchParams.get('format')==='csv'){
     const cell=v=>'"'+String(v??'').replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';
     const rows=[['Name','Email','Signup date','Consent'],...subscribers.map(r=>[r.name,r.email,r.signedUpAt,r.consent])];
     return new Response(rows.map(row=>row.map(cell).join(',')).join('\r\n'),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="tau-homecoming-2027-email-list.csv"','Cache-Control':'no-store'}});
    }
    return reply({total:subscribers.length,subscribers});
   }
   if(req.method==='PATCH'){
    let body;try{body=await req.json();}catch{return reply({error:'Invalid request.'},400);}
    if(body?.action!=='remove'||typeof body.id!=='string'||!/^[a-f0-9]{64}$/.test(body.id))return reply({error:'Invalid request.'},400);
    const r=await db.get(body.id,{type:'json'});if(!r)return reply({error:'Subscriber not found.'},404);
    r.removedAt=new Date().toISOString();await db.setJSON(body.id,r);return reply({ok:true});
   }
   return reply({error:'Method not allowed.'},405);
  }
  if(req.method!=='POST')return reply({error:'Admin access required.'},401);
  const length=Number(req.headers.get('content-length')||0);if(length>4096)return reply({error:'Request too large.'},413);
  let body;try{body=await req.json();}catch{return reply({error:'Please check your details.'},400);}
  if(!body||typeof body!=='object')return reply({error:'Please check your details.'},400);
  if(body.website)return reply({ok:true});
  const email=typeof body.email==='string'?body.email.trim().toLowerCase():'';
  const name=typeof body.name==='string'?body.name.trim():'';
  if(email.length>254||! /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(email))return reply({error:'Enter a valid email address.'},400);
  if(name.length>120)return reply({error:'Name must be 120 characters or fewer.'},400);
  if(body.consent!==true)return reply({error:'Please agree to receive Homecoming email updates.'},400);
  const id=createHash('sha256').update(email).digest('hex'),db=store(),previous=await db.get(id,{type:'json'});
  if(!previous||previous.removedAt)await db.setJSON(id,{email,name,signedUpAt:new Date().toISOString(),eventYear:2027,source:'tauhomecoming.com',consent:'Homecoming 2027 email updates',verification:'not-verified'});
  return reply({ok:true});
 }catch{return reply({error:'Unable to save or load the list right now. Please try again.'},500);}
}
export const config={rateLimit:{action:'rate_limit',aggregateBy:['ip','domain'],windowSize:60,windowLimit:40}};
