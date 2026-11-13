/* PreMeny – "ny version finns"-banderoll (admin och superadmin).
   Sidan har en egen byggstämpel (<meta name="pm-build">). version.json innehåller senaste stämpeln.
   Skiljer de sig åt visas en smal grön list längst upp där användaren själv väljer när sidan laddas om
   (vi laddar aldrig om automatiskt – någon kan sitta mitt i en bokning). Innehållet skjuts ned så att
   menyn aldrig döljs. */
(function(){
  var meta=document.querySelector('meta[name=pm-build]');
  if(!meta)return;
  var CURRENT=meta.getAttribute('content')||'';
  if(!CURRENT||/-demo$/.test(CURRENT))return; // demon ska aldrig visa banderollen
  var timer=null;

  function pad(){
    var bar=document.getElementById('_update-bar');
    if(!bar)return;
    var h=bar.offsetHeight||40;
    var st=document.getElementById('_update-pad');
    if(!st){st=document.createElement('style');st.id='_update-pad';document.head.appendChild(st);}
    // skjut ned innehållet och den klibbiga menyn så att ingenting hamnar bakom listen
    st.textContent='body{padding-top:'+h+'px!important}.nav,nav{top:'+h+'px!important}';
  }

  function show(){
    if(document.getElementById('_update-bar'))return;
    var bar=document.createElement('div');
    bar.id='_update-bar';
    bar.setAttribute('role','alert');
    bar.style.cssText='position:fixed;top:0;left:0;right:0;z-index:99999;background:#1f5a2e;color:#fff;padding:7px 14px;display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;font-family:Outfit,Arial,sans-serif;font-size:15px;line-height:1.3;font-weight:500;text-align:center';
    var t=document.createElement('span');
    t.textContent='🔄 En ny version av PreMeny finns.';
    var b=document.createElement('button');
    b.type='button';
    b.textContent='Ladda om och se nyheterna';
    b.style.cssText='background:#fff;color:#1f5a2e;border:none;border-radius:100px;padding:5px 16px;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;min-height:30px';
    b.onclick=function(){location.reload();};
    bar.appendChild(t);bar.appendChild(b);
    (document.body||document.documentElement).appendChild(bar);
    pad();
    window.addEventListener('resize',pad);
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
