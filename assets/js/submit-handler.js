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
      if (paymentCodeEl) paymentCodeEl.textContent = data.paymentCode || 'PENDING';
      if (confirmLink) confirmLink.href = data.confirmUrl || '#';
      if (confirmPanel) confirmPanel.classList.remove('hidden');
      confirmPanel?.scrollIntoView({ behavior:'smooth', block:'center' });
      setStatus('Saved! Follow the link to confirm.', false);
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