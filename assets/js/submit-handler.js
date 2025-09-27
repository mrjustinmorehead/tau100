
(function () {
  const form = document.querySelector('#regForm');
  if (!form) return;

  const submitBtn = document.querySelector('#submitBtn') || form.querySelector('button[type="submit"]');
  const msg = document.querySelector('#formMsg') || document.createElement('div');
  if (!msg.parentNode) form.appendChild(msg);

  const confirmPanel   = document.querySelector('#confirmPanel');
  const payAmountLabel = document.getElementById('payAmount');
  const paymentCodeEl  = document.getElementById('paymentCode');
  const confirmLink    = document.getElementById('confirmLink');
  const venmoBtn       = document.getElementById('payVenmo');
  const cashBtn        = document.getElementById('payCashApp');
  const paypalBtn      = document.getElementById('payPayPal');
  const paidCheck      = document.getElementById('paidCheck');

  function setStatus(t, isErr){
    msg.textContent = t || '';
    msg.style.color = isErr ? '#b00020' : '#0b6';
  }
  function setConfirmEnabled(on){
    if (!confirmLink) return;
    confirmLink.setAttribute('aria-disabled', on ? 'false' : 'true');
    confirmLink.style.pointerEvents = on ? 'auto' : 'none';
    confirmLink.style.opacity = on ? '1' : '0.5';
  }

  function getTier(){
    const chosen = document.querySelector('input[name="tier"]:checked');
    if (!chosen) return { amount: 100, name: 'Centennial Sponsorship' };
    const [amount, name] = chosen.value.split('|');
    return { amount: Number(amount), name };
  }

  // Payment URL builders
  function buildVenmo(username, amount, note){
    const p = new URLSearchParams({ txn:'pay', amount:String(amount||0), note:note||'' });
    return `https://venmo.com/${encodeURIComponent(username)}?${p.toString()}`;
  }
  function buildCashApp(cashtag, amount, note){
    const base = `https://cash.app/${cashtag.startsWith('$') ? cashtag : ('$'+cashtag)}`;
    const p = new URLSearchParams();
    if (amount) p.set('amount', String(amount));
    if (note)   p.set('note', note);
    const q = p.toString();
    return q ? `${base}?${q}` : base;
  }
  function buildPayPal(user, amount, note){
    const base = `https://paypal.me/${encodeURIComponent(user)}`;
    const withAmount = amount ? `${base}/${encodeURIComponent(String(amount))}` : base;
    return note ? `${withAmount}?note=${encodeURIComponent(note)}` : withAmount;
  }

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    setStatus('', false);
    if (submitBtn){ submitBtn.disabled = true; submitBtn.textContent = 'Submitting…'; }
    try{
      const fd = new FormData(form);
      const t = getTier();
      const payload = {
        name: fd.get('name')?.trim(),
        email: fd.get('email')?.trim(),
        phone: fd.get('phone')?.trim(),
        yearJoined: Number(fd.get('yearJoined')),
        tshirtSize: fd.get('tshirtSize'),
        website: fd.get('website'),
        optInPublic: fd.get('optInPublic') === 'on',
        packageName: t.name,
        packageAmount: t.amount
      };

      for (const k of ['name','email','phone','yearJoined','tshirtSize']) {
        if (!payload[k]) { setStatus('Missing ' + k, true); return; }
      }

      if (payAmountLabel) payAmountLabel.textContent = `$${t.amount}`;

      const r = await fetch('/.netlify/functions/submit_manual_registration', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(payload)
      });

      const raw = await r.text();
      let data;
      try { data = JSON.parse(raw); } catch {
        setStatus('Unexpected server response.', true);
        return;
      }
      if (!r.ok || data?.ok === false) {
        setStatus(data?.error || 'Unable to submit.', true);
        return;
      }

      const code = data.paymentCode || 'PENDING';
      const amount = Number(data.packageAmount || t.amount || 100);
      const note = `Tau100 ${code}`;

      if (paymentCodeEl) paymentCodeEl.textContent = code;
      if (confirmLink)   confirmLink.href = data.confirmUrl || '#';
      if (confirmPanel)  confirmPanel.classList.remove('hidden');

      if (venmoBtn)  venmoBtn.href  = buildVenmo('morehead', amount, note);
      if (cashBtn)   cashBtn.href   = buildCashApp('$Morehead', amount, note);
      if (paypalBtn) paypalBtn.href = buildPayPal('morehead', amount, note);

      setConfirmEnabled(false);
      if (paidCheck) {
        paidCheck.checked = false;
        paidCheck.addEventListener('change', () => setConfirmEnabled(paidCheck.checked));
      }

      setStatus('Saved! Choose Venmo, Cash App, or PayPal, then check “I paid” to enable Confirm.', false);
    }catch(err){
      setStatus(err?.message || 'Something went wrong.', true);
    }finally{
      if (submitBtn){ submitBtn.disabled = false; submitBtn.textContent = 'Continue'; }
    }
  });
})();
