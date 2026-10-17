(() => {
  const endpoint = '/.netlify/functions/tailgate_registration';
  const form = document.getElementById('regForm'), msg = document.getElementById('formMsg'), submit = document.getElementById('submitBtn');
  const guestInput = document.getElementById('regGuests');
  const storageKey = 'tau.registration.2026';
  const validId = id => typeof id === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id);
  let storedId = null; try { storedId = localStorage.getItem(storageKey); } catch {}
  const linkedId = new URLSearchParams(location.hash.slice(1)).get('manage');
  let requestId = validId(linkedId) ? linkedId : validId(storedId) ? storedId : crypto.randomUUID();
  const remember = () => { try { localStorage.setItem(storageKey,requestId); } catch {} };
  remember();
  let saved = false, cancelled = false, busy = true, totals = null;
  submit.disabled = true;
  let paymentLinks = document.getElementById('paymentPanel');
  const ownHeaders = () => ({'Content-Type':'application/json','x-registration-id':requestId});
  const manageUrl = () => `${location.origin}${location.pathname}#manage=${requestId}`;
  function showRegistration(r) {
    saved = true; cancelled = !!r.cancelledAt;
    document.getElementById('regName').value = r.name;
    guestInput.value = r.guestCount || 0;
    form.elements.optInPublic.checked = r.optInPublic !== false;
    form.querySelectorAll('input').forEach(el=>el.disabled=cancelled);
    summary(); submit.textContent = cancelled ? 'Registration cancelled' : 'Save changes';
    submit.disabled = cancelled;
    document.getElementById('manageActions').classList.remove('hidden');
    document.getElementById('cancelRegistration').classList.toggle('hidden',cancelled);
    document.getElementById('restoreRegistration').classList.toggle('hidden',!cancelled);
    document.getElementById('cancelQuestion').classList.add('hidden');
    document.getElementById('savedSummary').textContent = cancelled ? `${label(r.name,r.guestCount)} • Cancelled • Removed from headcount` : `${label(r.name,r.guestCount)} • ${r.attendeeCount} ${r.attendeeCount===1?'person':'people'} • Total: $${r.packageAmount}`;
    document.querySelector('#paymentPanel h3').textContent = cancelled ? 'Registration cancelled' : '2. Pay for the Tailgate';
    document.getElementById('payAmount').textContent=`$${r.packageAmount}`;
    document.getElementById('paymentCode').textContent=`and ${r.paymentCode}`;
    const note=`Tau2026 ${r.name} ${r.paymentCode}`;
    document.getElementById('payVenmo').href='https://venmo.com/morehead?'+new URLSearchParams({txn:'pay',amount:r.packageAmount,note});
    document.getElementById('payCashApp').href='https://cash.app/$Morehead?'+new URLSearchParams({amount:r.packageAmount,note});
    document.getElementById('payPayPal').href=`https://paypal.me/morehead/${r.packageAmount}?`+new URLSearchParams({note});
    document.getElementById('manageLink').value=manageUrl();
    paymentLinks.classList.remove('hidden');
    document.getElementById('privateLinkPanel').classList.remove('hidden');
    paymentLinks.querySelectorAll('a').forEach(el=>el.classList.toggle('hidden',cancelled));
    document.getElementById('paymentInstructions').classList.toggle('hidden',cancelled);
  }
  async function readSaved() {
    busy = true; submit.disabled=true; msg.textContent='Checking for your registration…';
    try {
      const res=await fetch(endpoint,{headers:ownHeaders(),cache:'no-store'});
      if(res.status===404){saved=false;cancelled=false;msg.textContent='';submit.disabled=false;}
      else {const data=await res.json();if(!res.ok)throw new Error(data.error);showRegistration(data.registration);msg.textContent=cancelled?'Your registration is cancelled. You can restore it below.':'Your saved registration is loaded. Update your details below.';}
    } catch {msg.textContent='Unable to check your saved registration. Reload to try again.';submit.disabled=true;}
    finally {busy=false;}
  }
  document.getElementById('copyManageLink').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(manageUrl());msg.textContent='Private link copied.';}catch{msg.textContent='Select and copy your private link above.';}});
  document.getElementById('cancelRegistration').addEventListener('click',()=>document.getElementById('cancelQuestion').classList.remove('hidden'));
  document.getElementById('keepRegistration').addEventListener('click',()=>document.getElementById('cancelQuestion').classList.add('hidden'));
  async function changeStatus(action){
    if(busy)return;busy=true;submit.disabled=true;
    const buttons=[document.getElementById('confirmCancel'),document.getElementById('restoreRegistration')];buttons.forEach(b=>b.disabled=true);
    try{const res=await fetch(endpoint,{method:'PATCH',headers:ownHeaders(),body:JSON.stringify({action})});const data=await res.json();if(!res.ok)throw new Error(data.error);showRegistration(data.registration);msg.textContent=action==='cancel'?'Cancelled. Your party has been removed from the headcount. Payments are not refunded automatically.':'Registration restored. Your party is included in the headcount.';await loadRoster();}
    catch(e){msg.textContent=e.message||'Unable to update registration.';submit.disabled=cancelled;}
    finally{busy=false;buttons.forEach(b=>b.disabled=false);}
  }
  document.getElementById('confirmCancel').addEventListener('click',()=>changeStatus('cancel'));
  document.getElementById('restoreRegistration').addEventListener('click',()=>changeStatus('restore'));
  document.getElementById('registerAnother').addEventListener('click',()=>{
    if(busy)return;requestId=crypto.randomUUID();remember();history.replaceState(null,'','#register');saved=false;cancelled=false;
    form.reset();form.querySelectorAll('input').forEach(el=>el.disabled=false);submit.textContent='Register';submit.disabled=false;msg.textContent='New registration for another person.';document.getElementById('privateLinkPanel').classList.add('hidden');document.querySelector('#paymentPanel h3').textContent='2. Pay for the Tailgate';document.getElementById('savedSummary').textContent='Already registered? Choose a payment option below.';document.getElementById('payAmount').textContent='$25 per person, including guests';document.getElementById('paymentCode').textContent='';document.getElementById('payVenmo').href='https://venmo.com/morehead';document.getElementById('payCashApp').href='https://cash.app/$Morehead';document.getElementById('payPayPal').href='https://paypal.me/morehead';paymentLinks.querySelectorAll('a').forEach(el=>el.classList.remove('hidden'));document.getElementById('paymentInstructions').classList.remove('hidden');document.getElementById('manageActions').classList.add('hidden');document.getElementById('cancelQuestion').classList.add('hidden');summary();
  });
  if(linkedId) document.getElementById('register').scrollIntoView();
  readSaved();
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
      wrap.replaceChildren();
      data.registrants.sort((a,b)=>a.name.localeCompare(b.name,undefined,{sensitivity:'base'})).forEach(r=>{
        const card=document.createElement('div');card.className='card bg-white p-5 flex items-center gap-3';card.setAttribute('role','listitem');
        const avatar=document.createElement('span');avatar.className='shrink-0 w-11 h-11 rounded-full bg-[var(--pbs-royal)] text-white flex items-center justify-center font-bold';avatar.setAttribute('aria-hidden','true');avatar.textContent=r.name.trim().split(/\s+/).filter(Boolean).slice(0,2).map(n=>Array.from(n)[0]).join('').toUpperCase();
        const info=document.createElement('div');info.className='min-w-0';const name=document.createElement('p');name.className='font-semibold break-words';name.textContent=r.name;info.append(name);
        if(r.guestCount){const badge=document.createElement('span');badge.className='inline-block mt-2 rounded-full border border-[var(--sigma-gray)] px-2 py-1 text-xs text-[var(--pbs-royal)] font-semibold';badge.textContent=`+${r.guestCount} ${r.guestCount===1?'guest':'guests'}`;info.append(badge);}
        card.append(avatar,info);wrap.append(card);
      });
      if(!data.registrants.length) wrap.textContent = 'No public registrations yet.';
    } catch { count.textContent='Headcount temporarily unavailable.'; wrap.textContent='Unable to load attendees. Please refresh.'; }
  }
  document.getElementById('refreshBtn').addEventListener('click',loadRoster); loadRoster();
  form.addEventListener('submit',async e=>{
    e.preventDefault(); if(busy || cancelled)return; busy=true;submit.disabled=true;msg.textContent='Saving…';
    try{
      const fd=new FormData(form);const body={name:fd.get('name'),guestCount:Number(fd.get('guestCount')),optInPublic:fd.get('optInPublic')==='on',website:fd.get('website'),requestId,action:'update'};
      const res=await fetch(endpoint,{method:saved?'PATCH':'POST',headers:saved?ownHeaders():{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const data=await res.json();if(!res.ok)throw new Error(data.error||'Unable to save registration.');
      showRegistration(data.registration);remember();msg.textContent='Registration saved. Next: use the payment buttons below. Already paid? Do not pay again.';paymentLinks.scrollIntoView({behavior:'smooth',block:'start'});paymentLinks.focus({preventScroll:true});await loadRoster();
    }catch(err){msg.textContent=err.message||'Unable to save. Please try again.';submit.disabled=false;}
    finally{busy=false;}
  });
  document.getElementById('totalsBtn').addEventListener('click',async()=>{await loadRoster();document.getElementById('totalsOut').textContent=totals?`${totals.registrations} registrations | ${totals.guests} guests | ${totals.attendees} people | $${totals.amount} expected (payments not verified)`:'Unable to load totals.';});
  document.getElementById('csvBtn').addEventListener('click',async()=>{try {const res=await fetch(endpoint+'?format=csv',{headers:{'x-admin-key':document.getElementById('adminKey').value}});if(!res.ok) throw new Error('Unable to export. Check your admin passcode.');const url=URL.createObjectURL(await res.blob());const a=document.createElement('a');a.href=url;a.download='tau-2026-headcount.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){document.getElementById('totalsOut').textContent=e.message;}});
})();
