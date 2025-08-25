(function(){
  function showToast(msg, ok=true){
    var root = document.getElementById('toast-root');
    if(!root){
      root = document.createElement('div');
      root.id = 'toast-root';
      root.className = 'fixed top-4 right-4 z-50 space-y-2';
      document.body.appendChild(root);
    }
    var div = document.createElement('div');
    div.className = (ok
      ? 'bg-green-600 text-white shadow rounded-xl px-4 py-3'
      : 'bg-amber-600 text-white shadow rounded-xl px-4 py-3');
    div.textContent = msg;
    root.appendChild(div);
    setTimeout(function(){ div.remove(); }, 6000);
  }
  try {
    var params = new URLSearchParams(window.location.search);
    if(params.get('success') === '1'){
      showToast('Registration complete! Check your email for confirmation.' , true);
    } else if(params.get('canceled') === '1'){
      showToast('Checkout canceled. You can try again anytime.', false);
    }
  } catch(e){}
})();