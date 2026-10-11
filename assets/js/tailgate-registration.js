(() => {
  const endpoint = '/.netlify/functions/tailgate_registration';
  const form = document.getElementById('regForm'), msg = document.getElementById('formMsg'), submit = document.getElementById('submitBtn');
  const guestInput = document.getElementById('regGuests');
  let requestId = crypto.randomUUID(), saved = false, totals = null;
  const label = (name, count) => name + (count ? ` + ${count} ${count === 1 ? 'guest' : 'guests'}` : '');
  function summary() {
    const n = Number(guestInput.value);
    document.getElementById('registrationSummary').textContent = Number.isInteger(n) && n >= 0 && n <= 1000 ? `${1+n} ${n === 0 ? 'person' : 'people'} • Total: $${25*(1+n)}` : 'Enter a valid guest count.';
  }
  guestInput.addEventListener('input',summary); summary();
  async function loadRoster() {
    const wrap = document.getElementById('rosterWrap'), count = document.getElementById('headcount');
    try {
      const res = await fetch(endpoint,{cache:'no-store'}); const data = await res.json(); if (!res.ok) throw new Error();
      totals = data.totals; count.textContent = `${totals.attendees} expected attendees • ${totals.registrations} registrations + ${totals.guests} guests`;
      wrap.replaceChildren(); const groups = new Map();
      data.registrants.sort((a,b)=>a.yearJoined-b.yearJoined || a.name.localeCompare(b.name)).forEach(r=>{const decade = Math.floor(r.yearJoined/10)*10; if(!groups.has(decade)) groups.set(decade,[]); groups.get(decade).push(r);});
      for (const [decade, rows] of [...groups].sort((a,b)=>b[0]-a[0])) {
        const box = document.createElement('div'); box.className = 'card bg-white rounded-2xl p-6'; const title = document.createElement('h3'); title.className = 'text-xl font-bold'; title.textContent = `${decade}s`; box.append(title);
        const list = document.createElement('ul'); for(const r of rows){const li=document.createElement('li');li.className='py-2';li.textContent=`${label(r.name,r.guestCount)} (${r.yearJoined})`;list.append(li);} box.append(list);wrap.append(box);
      }
      if(!groups.size) wrap.textContent = 'No public registrations yet.';
    } catch { count.textContent='Headcount temporarily unavailable.'; wrap.textContent='Unable to load attendees. Please refresh.'; }
  }
  document.getElementById('refreshBtn').addEventListener('click',loadRoster); loadRoster();
  form.addEventListener('submit',async e=>{
    e.preventDefault(); if(saved) return; submit.disabled=true; msg.textContent='Saving…';
    try {
      const fd = new FormData(form);
      const res = await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:fd.get('name'),yearJoined:Number(fd.get('yearJoined')),guestCount:Number(fd.get('guestCount')),optInPublic:fd.get('optInPublic')==='on',website:fd.get('website'),requestId})});
      const data = await res.json(); if(!res.ok) throw new Error(data.error || 'Unable to register.');
      const r = data.registration; saved=true; msg.textContent='Registration saved. Your headcount is included!'; submit.textContent='Registered';
      form.querySelectorAll('input').forEach(el=>el.disabled=true);
      document.getElementById('savedSummary').textContent=`${label(r.name,r.guestCount)} • ${r.attendeeCount} ${r.attendeeCount===1?'person':'people'} • Total: $${r.packageAmount}`;
      document.getElementById('payAmount').textContent=`$${r.packageAmount}`;document.getElementById('paymentCode').textContent=r.paymentCode;
      const note = `Tau2026 ${r.name} ${r.paymentCode}`;
      document.getElementById('payVenmo').href='https://venmo.com/morehead?'+new URLSearchParams({txn:'pay',amount:r.packageAmount,note});
      document.getElementById('payCashApp').href='https://cash.app/$Morehead?'+new URLSearchParams({amount:r.packageAmount,note});
      document.getElementById('payPayPal').href=`https://paypal.me/morehead/${r.packageAmount}?`+new URLSearchParams({note});
      document.getElementById('paymentPanel').classList.remove('hidden'); await loadRoster();
    } catch(err) { msg.textContent=err.message || 'Unable to save. Please try again.'; submit.disabled=false; }
  });
  document.getElementById('totalsBtn').addEventListener('click',async()=>{await loadRoster();document.getElementById('totalsOut').textContent=totals?`${totals.registrations} registrations | ${totals.guests} guests | ${totals.attendees} people | $${totals.amount} expected (payments not verified)`:'Unable to load totals.';});
  document.getElementById('csvBtn').addEventListener('click',async()=>{try {const res=await fetch(endpoint+'?format=csv',{headers:{'x-admin-key':document.getElementById('adminKey').value}});if(!res.ok) throw new Error('Unable to export. Check your admin passcode.');const url=URL.createObjectURL(await res.blob());const a=document.createElement('a');a.href=url;a.download='tau-2026-headcount.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){document.getElementById('totalsOut').textContent=e.message;}});
})();
