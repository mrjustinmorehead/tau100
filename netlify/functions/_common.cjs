// netlify/functions/_common.cjs
const SITE_ID = process.env.TAU_SITE_ID || process.env.SITE_ID;
const BLOBS_TOKEN = process.env.TAU_BLOBS_TOKEN || process.env.NETLIFY_BLOBS_TOKEN || process.env.BLOBS_TOKEN;
const ADMIN_KEY = process.env.ADMIN_KEY;

function json(obj, status=200){ return { statusCode: status, headers:{'Content-Type':'application/json'}, body: JSON.stringify(obj) }; }
function bad(status, msg, extra){ return json({ ok:false, error: msg || 'error', ...(extra||{}) }, status); }
function auth(key){ return !!ADMIN_KEY && key === ADMIN_KEY; }

function assertBlobs(){
  if(!SITE_ID) throw new Error('Missing TAU_SITE_ID (or SITE_ID) env');
  if(!BLOBS_TOKEN) throw new Error('Missing TAU_BLOBS_TOKEN (or NETLIFY_BLOBS_TOKEN/BLOBS_TOKEN) env');
}

async function readRaw(name){
  assertBlobs();
  const res = await fetch(`https://api.netlify.com/api/v1/blobs/${SITE_ID}/${name}`, {
    headers: { Authorization: `Bearer ${BLOBS_TOKEN}` }
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Blobs read failed: '+res.status);
  return res.text();
}
async function readJSON(name){
  const txt = await readRaw(name);
  if (!txt) return null;
  try { return JSON.parse(txt); } catch { return null; }
}
async function writeJSON(name, value){
  assertBlobs();
  const res = await fetch(`https://api.netlify.com/api/v1/blobs/${SITE_ID}/${name}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${BLOBS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(value ?? null)
  });
  if (!res.ok) throw new Error('Blobs write failed: '+res.status);
}

function code(len=6){
  const set='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s=''; for(let i=0;i<len;i++) s+=set[Math.floor(Math.random()*set.length)];
  return s;
}

const stores = {
  async registrants(){
    const key = 'tau100_registrants.json';
    return {
      async getJSON(){ return (await readJSON(key)) || []; },
      async setJSON(v){ await writeJSON(key, v); }
    };
  },
  async pending(){
    const key = 'tau100_pending.json';
    return {
      async getJSON(){ return (await readJSON(key)) || []; },
      async setJSON(v){ await writeJSON(key, v); }
    };
  }
};

module.exports = { json, bad, auth, stores, code, assertBlobs };
