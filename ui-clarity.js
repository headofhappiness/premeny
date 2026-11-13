/* PreMeny – tydlighetslagret (JS): räknar fram en läsbar "bläckfärg" av restaurangens accentfärg.
   Guld/accent på vit eller kräm ger ofta för låg kontrast när den används som textfärg.
   --gold-ink är samma ton, mörkad tills kontrasten mot vitt är minst 6:1. Ytor och ramar använder fortfarande --gold. */
(function(){
  var root=document.documentElement,last=null;
  function parse(h){
    h=String(h||'').trim();
    if(/^#[0-9a-f]{3}$/i.test(h))h='#'+h[1]+h[1]+h[2]+h[2]+h[3]+h[3];
    if(!/^#[0-9a-f]{6}$/i.test(h))return null;
    return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
  }
  function lum(c){
    var a=c.map(function(v){v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});
    return 0.2126*a[0]+0.7152*a[1]+0.0722*a[2];
  }
  function contrastWhite(c){return 1.05/(lum(c)+0.05);}
  function ink(hex){
    var c=parse(hex);if(!c)return null;
    for(var i=0;i<30&&contrastWhite(c)<6;i++){c=c.map(function(v){return Math.round(v*0.92);});}
    return 'rgb('+c[0]+','+c[1]+','+c[2]+')';
  }
  function contrast(a,b){var la=lum(a),lb=lum(b);return (Math.max(la,lb)+0.05)/(Math.min(la,lb)+0.05);}
  /* Härled ur kundens accentfärg: text som alltid går att läsa på den (vit eller mörk), en mörkare hover och en svag tint */
  function brand(hex){
    var c=parse(hex);if(!c)return;
    var on=contrast(c,[255,255,255])>=4.5?'#ffffff':'#1a1712';
    var hov='rgb('+c.map(function(v){return Math.round(v*0.86);}).join(',')+')';
    var tint='rgba('+c.join(',')+',0.10)';
    root.style.setProperty('--on-accent',on);
    root.style.setProperty('--accent-hover',hov);
    root.style.setProperty('--accent-tint',tint);
  }
  var lastGold=null;
  function setGoldInk(hex){
    if(hex!==lastGold){lastGold=hex;brand(hex);}
    var v=ink(hex);if(!v||v===last)return;
    last=v;root.style.setProperty('--gold-ink',v);
  }
  window.setGoldInk=setGoldInk;
  function sync(){
    var g=getComputedStyle(root).getPropertyValue('--gold');
    if(g)setGoldInk(g);
  }
  sync();
  try{new MutationObserver(sync).observe(root,{attributes:true,attributeFilter:['style']});}catch(e){}
})();
