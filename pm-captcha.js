/* PreMeny – robotskydd (Cloudflare Turnstile), delat av registrering, admin-inloggning och superadmin-inloggning.
   Site key är publik. Secret key ligger bara i Supabase (Authentication → Attack Protection).
   Så länge CAPTCHA inte är påslaget i Supabase ignoreras token, så sidorna fungerar likadant före och efter.
   Fungerar inte rutan (blockerad av en tillägg/nätverk) skickar vi ändå utan token – Supabase avgör, och vi visar ett tydligt fel. */
(function(){
  var SITEKEY='0x4AAAAAAF_yMBpO6JCq_Jid';
  var st={id:null,token:null};

  function loadScript(cb){
    if(window.turnstile){cb();return;}
    var ex=document.getElementById('cf-ts-js');
    if(ex){var t=setInterval(function(){if(window.turnstile){clearInterval(t);cb();}},100);return;}
    var s=document.createElement('script');
    s.id='cf-ts-js';
    s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async=true;s.defer=true;
    s.onload=cb;
    document.head.appendChild(s);
  }

  window.pmCaptcha={
    /* Visa rutan i elementet (id eller element). Görs en gång. */
    mount:function(el){
      if(typeof el==='string')el=document.getElementById(el);
      if(!el||st.id!==null)return;
      st.id='laddar';
      el.style.display='block';
      loadScript(function(){
        try{
          st.id=turnstile.render(el,{
            sitekey:SITEKEY,theme:'light',
            callback:function(t){st.token=t;},
            'expired-callback':function(){st.token=null;},
            'error-callback':function(){st.token=null;}
          });
        }catch(e){st.id=null;}
      });
    },
    token:function(){return st.token;},
    /* Väntar högst ms på en token (Managed-läget löser sig oftast av sig självt). Ger null om ingen kom. */
    wait:function(ms){
      return new Promise(function(res){
        var t0=Date.now();
        (function poll(){
          if(st.token||Date.now()-t0>ms)return res(st.token);
          setTimeout(poll,150);
        })();
      });
    },
    /* En token gäller bara en gång: nollställ efter varje försök */
    reset:function(){
      st.token=null;
      try{if(window.turnstile&&st.id!==null&&st.id!=='laddar')turnstile.reset(st.id);}catch(e){}
    },
    isCaptchaError:function(err){
      var m=String(err&&err.message||'').toLowerCase();
      return m.indexOf('captcha')>-1;
    }
  };
})();
