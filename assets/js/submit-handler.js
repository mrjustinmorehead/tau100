(function () {
  const FORM_SEL = '#regForm';
  const ENDPOINT = '/.netlify/functions/submit_manual_registration';
  const form = document.querySelector(FORM_SEL);
  const submitBtn = document.querySelector('#submitBtn');
  const msg = document.querySelector('#formMsg');
  const confirmPanel = document.querySelector('#confirmPanel');
  const payAmountLabel = document.querySelector('#payAmount');
  const paymentCodeEl = document.querySelector('#paymentCode');
  const confirmLink = document.querySelector('#confirmLink');
  const venmoBtn  = document.querySelector('#payVenmo');
  const cashBtn   = document.querySelector('#payCashApp');
  const paypalBtn = document.querySelector('#payPayPal');
  const paidCheck = document.querySelector('#paidCheck');

  if (!form) { console.error('Form not found at selector', FORM_SEL); return; }

  function getTier() {
    const chosen = document.querySelector('input[name="tier"]:checked');
    if (!chosen) return { amount: 100, name: 'Centennial Sponsorship' };
    const [amount, name] = chosen.value.split('|');
    return { amount: Number(amount), name };
  }

  function setStatus(text, isError) {
    if (!msg) return;
    msg.textContent = text || '';
    msg.style.color = isError ? '#b00020' : '#0b6';
  }

  function setConfirmEnabled(enabled) {
    if (!confirmLink) return;
    confirmLink.setAttribute('aria-disabled', enabled ? 'false' : 'true');
    confirmLink.style.pointerEvents = enabled ? 'auto' : 'none';
    confirmLink.style.opacity = enabled ? '1' : '0.5';
  }

  function buildVenmo(username, amount, note) {
    try {
      const params = new URLSearchParams({ txn: 'pay', amount: String(amount || 0), note: note || '' });
      return `https://venmo.com/${encodeURIComponent(username)}?${params.toString()}`;
    } catch { return `https://venmo.me/${encodeURIComponent(username)}?txn=pay&amount=${encodeURIComponent(amount||0)}&note=${encodeURIComponent(note||'')}`; }
  }
  function buildCashApp(cashtag, amount, note) {
    const base = `https://cash.app/${cashtag.startsWith('$') ? cashtag : '$' + cashtag}`;
    const qs = new URLSearchParams();
    if (amount) qs.set('amount', String(amount));
    if (note)   qs.set('note', note);
    const q = qs.toString();
    return q ? `${base}?${q}` : base;
  }
  function buildPayPal(user, amount, note) {
    const base = `https://paypal.me/${encodeURIComponent(user)}`;
    const withAmount = amount ? `${base}/${encodeURIComponent(String(amount))}` : base;
    if (note) return `${withAmount}?note=${encodeURIComponent(note)}`;
    return withAmount;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setStatus('', false);
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Submitting…'; }

    try {
      const fd = new FormData(form);
      const tier = getTier();

      const payload = {
        name: fd.get('name')?.trim(),
        email: fd.get('email')?.trim(),
        phone: fd.get('phone')?.trim(),
        yearJoined: Number(fd.get('yearJoined')),
        tshirtSize: fd.get('tshirtSize'),
        website: fd.get('website'),
        optInPublic: fd.get('optInPublic') === 'on',
        packageName: tier.name,
        packageAmount: tier.amount
      };

      for (const k of ['name','email','phone','yearJoined','tshirtSize']) {
        if (!payload[k]) { setStatus(`Missing field: ${k}`, true); return; }
      }

      if (payAmountLabel) payAmountLabel.textContent = `$${tier.amount}`;

      const res = await fetch(ENDPOINT, {
        method: 'POST', headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(payload),
      });
      const raw = await res.text();
      let data;
      try { data = JSON.parse(raw); } catch (e) {
        console.error('Non-JSON response:', raw);
        setStatus('Unexpected server response.', true);
        return;
      }
      if (!res.ok || data?.ok === false) {
        console.error('Function error:', data);
        setStatus(data?.error || 'Unable to submit.', true);
        return;
      }

      const code = data.paymentCode || 'PENDING';
      if (paymentCodeEl) paymentCodeEl.textContent = code;
      if (confirmLink)   confirmLink.href = data.confirmUrl || '#';
      if (confirmPanel)  confirmPanel.classList.remove('hidden');
      confirmPanel?.scrollIntoView({ behavior:'smooth', block:'center' });

      const note = `Tau100 ${code}`;
      const venmoUrl  = buildVenmo('morehead', tier.amount, note);
      const cashUrl   = buildCashApp('$Morehead', tier.amount, note);
      const paypalUrl = buildPayPal('morehead', tier.amount, note);

      if (venmoBtn)  venmoBtn.href  = venmoUrl;
      if (cashBtn)   cashBtn.href   = cashUrl;
      if (paypalBtn) paypalBtn.href = paypalUrl;

      const focusPaid = () => setTimeout(() => { paidCheck && paidCheck.focus(); }, 300);
      [venmoBtn, cashBtn, paypalBtn].forEach(btn => btn && btn.addEventListener('click', focusPaid, { once: true }));

      setConfirmEnabled(false);
      if (paidCheck) {
        paidCheck.checked = false;
        paidCheck.addEventListener('change', () => setConfirmEnabled(paidCheck.checked));
      }

      setStatus('Saved! Choose a payment method, then check “I paid” to enable the confirm link.', false);
    } catch (err) {
      console.error('Submit exception:', err);
      setStatus(err?.message || 'Something went wrong.', true);
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Continue'; }
    }
  }

  form.removeEventListener('submit', onSubmit);
  form.addEventListener('submit', onSubmit);
})();