// assets/js/admin-edit-tools.js
(function(){
  const adminPanel = document.querySelector('footer details');
  if (!adminPanel) return;
  const container = adminPanel.querySelector('div.mt-3');
  if (!container) return;
  const wrap = document.createElement('div');
  wrap.className = "mt-4 grid md:grid-cols-2 gap-4";
  wrap.innerHTML = `
    <div class="rounded-xl border p-3 bg-white">
      <div class="font-semibold mb-2">Edit registrant</div>
      <div class="grid gap-2 text-sm">
        <input id="admEditKeyOrEmail" placeholder="reg_* key or email" class="rounded border px-3 py-2" />
        <input id="admEditName" placeholder="New name (optional)" class="rounded border px-3 py-2" />
        <input id="admEditYear" type="number" placeholder="New year (optional)" class="rounded border px-3 py-2" />
        <input id="admEditPkg" placeholder="New package name (optional)" class="rounded border px-3 py-2" />
        <input id="admEditAmt" type="number" placeholder="New amount (optional)" class="rounded border px-3 py-2" />
        <button id="admEditBtn" class="px-3 py-2 rounded border bg-white">Update</button>
      </div>
    </div>
    <div class="rounded-xl border p-3 bg-white">
      <div class="font-semibold mb-2">Remove duplicate(s)</div>
      <div class="grid gap-2 text-sm">
        <input id="admDelKeyOrEmail" placeholder="reg_* key or email" class="rounded border px-3 py-2" />
        <label class="text-xs flex items-center gap-2">
          <input id="admDelAllEmail" type="checkbox" class="rounded" />
          Delete ALL with this email
        </label>
        <button id="admDelBtn" class="px-3 py-2 rounded border bg-white">Delete</button>
      </div>
    </div>
    <pre id="admEditOut" class="md:col-span-2 text-xs text-slate-600 whitespace-pre-wrap"></pre>
  `;
  container.after(wrap);
  function adminKey(){ return document.getElementById('adminKey')?.value || ''; }
  const out = wrap.querySelector('#admEditOut');
  async function hit(path, body){
    const r = await fetch(path, { method:'POST', headers:{ 'Content-Type':'application/json', 'x-admin-key': adminKey() }, body: JSON.stringify(body||{}) });
    const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = { ok:false, raw:t }; } return { ok: r.ok && j?.ok !== false, data: j, status: r.status };
  }
  wrap.querySelector('#admEditBtn').addEventListener('click', async ()=>{
    const keyOrEmail = wrap.querySelector('#admEditKeyOrEmail').value.trim();
    const name = wrap.querySelector('#admEditName').value.trim();
    const year = wrap.querySelector('#admEditYear').value.trim();
    const pkg  = wrap.querySelector('#admEditPkg').value.trim();
    const amt  = wrap.querySelector('#admEditAmt').value.trim();
    if (!keyOrEmail) { out.textContent = 'Enter reg_* key or email.'; return; }
    out.textContent = 'Updating…';
    const res = await hit('/.netlify/functions/update_registrant', { keyOrEmail, patch: { ...(name?{name}:{}), ...(year?{yearJoined:Number(year)}:{}), ...(pkg?{packageName:pkg}:{}), ...(amt?{packageAmount:Number(amt)}:{}) } });
    out.textContent = JSON.stringify(res.data, null, 2);
  });
  wrap.querySelector('#admDelBtn').addEventListener('click', async ()=>{
    const keyOrEmail = wrap.querySelector('#admDelKeyOrEmail').value.trim();
    const allByEmail = wrap.querySelector('#admDelAllEmail').checked;
    if (!keyOrEmail) { out.textContent = 'Enter reg_* key or email.'; return; }
    out.textContent = 'Deleting…';
    const res = await hit('/.netlify/functions/delete_registrant', { keyOrEmail, allByEmail });
    out.textContent = JSON.stringify(res.data, null, 2);
  });
})();