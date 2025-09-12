
const crypto = require('crypto');
const { getStore } = require('@netlify/blobs');

function json(body, code=200){ return { statusCode: code, headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) }; }
function bad(msg='Bad Request', code=400){ return { statusCode: code, body: msg }; }
function auth(event){ const key = event.headers['x-admin-key'] || event.headers['X-Admin-Key']; return !!(process.env.ADMIN_KEY && key && key === process.env.ADMIN_KEY); }
function uid(){ return crypto.randomBytes(6).toString('hex'); }
function paymentCode(){ return 'TAU-' + Math.random().toString(36).slice(2,8).toUpperCase(); }

function stores() {
  const siteID = process.env.SITE_ID;
  const pending = getStore({ name: 'pending', siteID });
  const registrants = getStore({ name: 'registrants', siteID });
  const tokens = getStore({ name: 'tokens', siteID }); // token -> pendingKey
  return { pending, registrants, tokens };
}

async function setJSON(store, key, obj){
  await store.set(key, JSON.stringify(obj), { contentType: 'application/json' });
}
async function getJSON(store, key){
  const res = await store.get(key, { type: 'json' });
  return res || null;
}
async function listJSON(store){
  const out = [];
  let cursor;
  do {
    const { blobs, cursor: next } = await store.list({ cursor });
    for (const b of blobs) {
      const obj = await getJSON(store, b.key);
      if (obj) out.push(obj);
    }
    cursor = next;
  } while (cursor);
  return out;
}
async function del(store, key){
  await store.delete(key);
}

module.exports = { json, bad, auth, uid, paymentCode, stores, setJSON, getJSON, listJSON, del };
