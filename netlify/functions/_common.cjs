// netlify/functions/_common.cjs
// Auto-recovers prior data by reading legacy blob filenames and writing to new names.
// Uses env: TAU_SITE_ID, TAU_BLOBS_TOKEN, ADMIN_KEY (do NOT use reserved SITE_ID).

const SITE_ID = process.env.TAU_SITE_ID || process.env.SITE_ID;
const BLOBS_TOKEN = process.env.TAU_BLOBS_TOKEN || process.env.NETLIFY_BLOBS_TOKEN || process.env.BLOBS_TOKEN;
const ADMIN_KEY = process.env.ADMIN_KEY;

function json(obj, status=200){ return { statusCode: status, headers:{'Content-Type':'application/json'}, body: JSON.stringify(obj) }; }
function bad(status, msg){ return json({ ok:false, error: msg || 'error' }, status); }
function auth(key){ return !!ADMIN_KEY && key === ADMIN_KEY; }

async function readRaw(name){
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
  const res = await fetch(`https://api.netlify.com/api/v1/blobs/${SITE_ID}/${name}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${BLOBS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(value ?? null)
  });
  if (!res.ok) throw new Error('Blobs write failed: '+res.status);
}

// Try a list of legacy names and return the first non-empty
async function readAnyJSON(names){
  for (const n of names){
    try {
      const j = await readJSON(n);
      if (Array.isArray(j) && j.length) return { name:n, data:j };
    } catch {}
  }
  // if all empty, return last name with empty list
  return { name:names[names.length-1], data: [] };
}

function code(len=6){
  const set='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s=''; for(let i=0;i<len;i++) s+=set[Math.floor(Math.random()*set.length)];
  return s;
}

// Primary (new) names
const NEW = {
  registrants: 'tau100_registrants.json',
  pending:     'tau100_pending.json'
};

// Legacy names we’ll search (add any you used earlier)
const LEGACY = {
  registrants: ['tau100_registrants.json','registrants.json','tau_registrants.json'],
  pending:     ['tau100_pending.json','pending.json','tau_pending.json']
};

const stores = {
  async registrants(){
    const chosen = await readAnyJSON(LEGACY.registrants);
    return {
      async getJSON(){ return chosen.data.length ? chosen.data : (await readJSON(NEW.registrants)) || []; },
      async setJSON(v){ await writeJSON(NEW.registrants, v); }
    };
  },
  async pending(){
    const chosen = await readAnyJSON(LEGACY.pending);
    return {
      async getJSON(){ return chosen.data.length ? chosen.data : (await readJSON(NEW.pending)) || []; },
      async setJSON(v){ await writeJSON(NEW.pending, v); }
    };
  }
};

module.exports = { json, bad, auth, stores, code };
