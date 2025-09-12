const crypto = require('crypto');

function json(body, code=200){ return { statusCode: code, headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) }; }
function bad(msg='Bad Request', code=400){ return { statusCode: code, body: msg }; }
function auth(event){
  const key = event.headers['x-admin-key'] || event.headers['X-Admin-Key'];
  return !!(process.env.ADMIN_KEY && key && key === process.env.ADMIN_KEY);
}
function uid(){ return crypto.randomBytes(6).toString('hex'); }
function paymentCode(){ return 'TAU-' + Math.random().toString(36).slice(2,8).toUpperCase(); }

// A very lightweight in-memory fallback (for local dev). Replace with Netlify Blobs SDK in production.
const DB = global.__TAU_DB__ || { pending:{}, registrants:{} };
global.__TAU_DB__ = DB;

module.exports = { json, bad, auth, uid, paymentCode, DB };
