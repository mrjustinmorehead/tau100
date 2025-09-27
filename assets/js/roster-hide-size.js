// assets/js/roster-hide-size.js
(function(){
  const wrap = document.getElementById('rosterWrap');
  if (!wrap) return;
  function scrub(node){
    node.querySelectorAll('li, span, small, div').forEach(el => {
      const t = el.textContent;
      if (!t) return;
      let s = t.replace(/\(\s*(\d{4})\s*,\s*[A-Z0-9\-+ ]{1,5}\s*\)/g, '($1)');
      s = s.replace(/,\s*[A-Z0-9\-+ ]{1,5}\s*\)/g, ')');
      s = s.replace(/,\s*[A-Z0-9\-+ ]{1,5}(?=\s|$)/g, '');
      if (s !== t) el.textContent = s;
    });
  }
  const mo = new MutationObserver(() => scrub(wrap));
  mo.observe(wrap, { childList:true, subtree:true, characterData:true });
  scrub(wrap);
})();