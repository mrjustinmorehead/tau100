// _common.cjs — minimal shared helpers with simple JSON storage
// No external services; avoids Blobs/DB. Uses /tmp at runtime.
// If repo includes data/registrants.json and is writable in previews, it will try that first.

const fs = require('fs');
const path = require('path');

const DATA_DIRS = [
  path.join(__dirname, '..', '..', 'data'),
  '/tmp'
];
const DATA_FILE_NAME = 'registrants.json';

function ensureDir(p){ try{ fs.mkdirSync(p, {recursive:true}); }catch(e){} }
function json(status, obj){ return { statusCode: status||200, headers: { 'content-type':'application/json' }, body: JSON.stringify(obj) }; }
function bad(status, msg){ return json(status||400, { ok:false, error: msg || 'error' }); }
function auth(key){
  const want = process.env.ADMIN_KEY || process.env.admin_key || process.env.ADMIN;
  return !!want && key === want;
}

function filePath(){
  for(const dir of DATA_DIRS){
    try{
      ensureDir(dir);
      fs.accessSync(dir, fs.constants.W_OK);
      return path.join(dir, DATA_FILE_NAME);
    }catch(e){ /* try next */ }
  }
  return path.join(__dirname, DATA_FILE_NAME);
}

function readJSON(fp){
  try{
    const s = fs.readFileSync(fp, 'utf8');
    const j = JSON.parse(s || '[]');
    return Array.isArray(j) ? j : [];
  }catch(e){
    return [];
  }
}

function writeJSON(fp, data){
  try{
    fs.writeFileSync(fp, JSON.stringify(data||[], null, 2), 'utf8');
    return true;
  }catch(e){
    return false;
  }
}

async function registrants(){
  const fp = filePath();
  return {
    async getJSON(){ return readJSON(fp); },
    async setJSON(list){ writeJSON(fp, list); }
  };
}

module.exports = {
  json, bad, auth,
  stores: { registrants }
};
