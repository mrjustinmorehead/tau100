// assets/js/submit-diagnostics.js
(function(){
  const formMsg = document.getElementById('formMsg');
  async function quick(url, opts){ const r = await fetch(url, opts||{}); const t = await r.text(); try{ return { ok:r.ok, status:r.status, json:JSON.parse(t) }; } catch { return { ok:r.ok, status:r.status, text:t }; } }
  window._tauDiag = async function(){
    const out = [];
    try { const a = await quick('/.netlify/functions/ping'); out.push(['ping', a]); } catch(e){ out.push(['ping', String(e)]) }
    try { const b = await quick('/.netlify/functions/submit_manual_registration', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({}) }); out.push(['submit_manual_registration', b]); } catch(e){ out.push(['submit_manual_registration', String(e)]) }
    console.log('[tau diag]', out);
    if (formMsg) formMsg.textContent = 'Diagnostics in console: ' + JSON.stringify(out);
  };
})();