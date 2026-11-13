/* PreMeny – "ny version finns"-banderoll (admin och superadmin).
   Sidan har en egen byggstämpel (<meta name="pm-build">). version.json innehåller senaste stämpeln.
   Skiljer de sig åt visas en tydlig banderoll där användaren själv väljer när sidan laddas om
   (vi laddar aldrig om automatiskt – någon kan sitta mitt i en bokning). */
(function(){
  var meta=document.querySelector('meta[name=pm-build]');
  if(!meta)return;
  var CURRENT=meta.getAttribute('content')||'';
  if(!CURRENT||/-demo$/.test(CURRENT))return; // demon ska aldrig visa banderollen
  var timer=null;

  function show(){
    if(document.getElementById('_update-bar'))return;
    var bar=document.createElement('div');
    bar.id='_update-bar';
    bar.setAttribute('role','alert');
    bar.style.cssText='position:fixed;left:12px;right:12px;bottom:12px;z-index:99999;max-width:640px;margin:0 auto;background:#1f5a2e;color:#fff;border-radius:14px;padding:14px 16px;box-shadow:0 8px 32px rgba(0,0,0,.28);display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;font-family:Outfit,Arial,sans-serif;font-size:17px;line-height:1.4;font-weight:500';
    var t=document.createElement('span');
    t.textContent='🔄 En ny version av PreMeny finns.';
    var b=document.createElement('button');
    b.type='button';
    b.textContent='Ladda om och se nyheterna';
    b.style.cssText='background:#fff;color:#1f5a2e;border:none;border-radius:100px;padding:12px 20px;font-family:inherit;font-size:16px;font-weight:600;cursor:pointer;min-height:44px';
    b.onclick=function(){location.reload();};
    bar.appendChild(t);bar.appendChild(b);
    (document.body||document.documentElement).appendChild(bar);
    if(timer){clearInterval(timer);timer=null;}
  }

  function check(){
    if(document.getElementById('_update-bar'))return;
    fetch('/version.json?_='+Date.now(),{cache:'no-store'})
      .then(function(r){return r.ok?r.json():null;})
      .then(function(j){if(j&&j.build&&String(j.build)!==CURRENT)show();})
      .catch(function(){});
  }

  window.addEventListener('load',function(){setTimeout(check,8000);timer=setInterval(check,120000);});
  document.addEventListener('visibilitychange',function(){if(!document.hidden)check();});
  window.addEventListener('focus',check);
})();
