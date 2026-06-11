#!/usr/bin/env node
/*
 * build_demo.js — genererar admin_demo.html från admin.html (PreMeny)
 *
 * Repo: headofhappiness/premeny   Supabase: gndzalmkbsfhclpoidqi
 *
 * KÖRS efter varje admin.html-ändring:  node build_demo.js
 *
 * Transformationer:
 *   1. <head>: title, OG/Twitter-taggar, ta bort version-check-scriptet,
 *      byt byggstämpel till "<stamp>-demo".
 *   2. CSS: lägg till .demo-banner / .demo-toast.
 *   3. Body: injicera demo-banner + demo-toast + demoWelcome efter adminPage-diven.
 *   4. JS: IS_DEMO + DEMO_SLUG + demoBlock() före "let rest=null,...".
 *   5. JS: injicera "if(IS_DEMO)return demoBlock();" först i 35 skrivfunktioner.
 *   6. JS: autoInitDemo/maybeShowDemoWelcome/closeDemoWelcome före initAdmin + anrop sist.
 *
 * Defensivt: varje steg verifierar exakt träff, annars avbryts bygget.
 */

const fs = require('fs');
const SRC = 'admin.html';
const OUT = 'admin_demo.html';

function die(msg){ console.error('\n❌ BYGGFEL: ' + msg + '\n   (admin_demo.html INTE skriven)'); process.exit(1); }
function must(cond, msg){ if(!cond) die(msg); }

let html = fs.readFileSync(SRC, 'utf8');
const orig = html;

/* 1. HEAD */
must(html.includes('<title>Admin – PreMeny</title>'), 'hittade inte <title>Admin – PreMeny</title>');
html = html.replace('<title>Admin – PreMeny</title>', '<title>Demo – PreMeny</title>');

const stampMatch = orig.match(/<meta name="pm-build" content="([^"]+)">/);
must(stampMatch, 'hittade ingen pm-build-stämpel');
const demoStamp = stampMatch[1] + '-demo';

{
  const scriptRe = /<script>\s*\(function\(\)\{[\s\S]*?checkVersion[\s\S]*?\}\)\(\);\s*<\/script>\s*/;
  must(scriptRe.test(html), 'hittade inte version-check-scriptet att ta bort');
  html = html.replace(scriptRe, '');
}
{
  const metaRe = /<meta name="pm-build" content="[^"]+">/;
  must(metaRe.test(html), 'hittade inte pm-build-metan att ersätta');
  const ogBlock =
`<meta property="og:type" content="website">
<meta property="og:site_name" content="PreMeny">
<meta property="og:title" content="PreMeny – Se demon">
<meta property="og:description" content="Klicka runt i en demo av PreMeny och se hur enkelt köket får överblick över gästernas förbeställningar.">
<meta property="og:image" content="https://premeny.se/og-demo.png">
<meta property="og:url" content="https://premeny.se/admin_demo.html">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="PreMeny – Se demon">
<meta name="twitter:description" content="Klicka runt i en demo av PreMeny och se hur enkelt köket får överblick över gästernas förbeställningar.">
<meta name="twitter:image" content="https://premeny.se/og-demo.png">
<meta name="pm-build" content="${demoStamp}">`;
  html = html.replace(metaRe, ogBlock);
}

/* 2. CSS */
{
  const demoCss =
`.demo-banner{background:linear-gradient(135deg,rgba(184,149,90,.1),rgba(184,149,90,.04));border-bottom:1px solid rgba(184,149,90,.3);padding:.7rem 1.5rem;text-align:center;font-size:13px;color:#6a5030}
.demo-banner a{color:var(--gold);font-weight:500;text-decoration:none}
.demo-banner a:hover{text-decoration:underline}
.demo-toast{position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:var(--dark);color:#fff;padding:12px 24px;border-radius:100px;font-size:14px;z-index:1000;display:none;box-shadow:0 4px 24px rgba(0,0,0,.2)}
</style>`;
  must(html.includes('</style>'), 'hittade ingen </style>');
  html = html.replace('</style>', demoCss);
}

/* 3. BODY */
{
  const adminPageRe = /<div id="adminPage" style="display:none">/;
  must(adminPageRe.test(html), 'hittade inte adminPage-diven');
  const demoHtml =
`<div id="adminPage" style="display:none">
<div class="demo-banner">
  <div style="display:flex;flex-direction:column;gap:5px;align-items:center;line-height:1.6;text-align:center">
    <div>👤 <a href="https://premeny.se/guest.html?r=demo&b=84fbc0c1-2b36-4b0c-abfd-462d8630342a" target="_blank" style="color:#b8955a;font-weight:500;text-decoration:none">Se hur det ser ut för dina gäster →</a></div>
    <div>Vill du ha en personlig genomgång? <a href="https://cal.com/lisa-jonsson-lbe4ex/demomote-med-lisa-premeny" target="_blank" style="color:#b8955a;font-weight:500;text-decoration:none">Boka möte</a></div>
    <div>Redo att bli kund? <a href="https://premeny.se/#demo" target="_blank" style="color:#b8955a;font-weight:500;text-decoration:none">Fyll i formuläret</a></div>
  </div>
</div>
<div class="demo-toast" id="demoToast">🔒 I demon kan du inte spara ändringar</div>
<div id="demoWelcome" style="display:none;position:fixed;inset:0;z-index:9999;background:rgba(26,23,18,.6);backdrop-filter:blur(4px);align-items:center;justify-content:center;padding:1rem">
  <div style="background:#fff;max-width:440px;width:100%;border-radius:16px;padding:1.75rem;box-shadow:0 20px 60px rgba(0,0,0,.3);text-align:center">
    <div style="font-family:'Playfair Display',serif;font-weight:500;font-size:1.5rem;color:var(--dark);margin-bottom:.5rem">Välkommen till PreMeny-demon 👋</div>
    <p style="font-size:14px;color:var(--muted);line-height:1.6;margin-bottom:1.25rem">Du tittar på en restaurangs egen adminvy. Klicka runt fritt – inget du gör här sparas. Så här ser det ut när ni tar emot förbeställningar från sällskap.</p>
    <div style="display:flex;flex-direction:column;gap:8px">
      <button class="btn bp" style="font-weight:500" onclick="closeDemoWelcome()">Utforska demon</button>
      <a href="https://cal.com/lisa-jonsson-lbe4ex/demomote-med-lisa-premeny" target="_blank" class="btn bg" style="text-decoration:none;font-weight:500" onclick="closeDemoWelcome()">📅 Boka en genomgång</a>
      <a href="https://premeny.se/guest.html?r=demo&b=84fbc0c1-2b36-4b0c-abfd-462d8630342a" target="_blank" style="font-size:13px;color:var(--gold);text-decoration:none;font-weight:500;margin-top:.35rem">Se hur det ser ut för gästerna →</a>
    </div>
  </div>
</div>`;
  html = html.replace(adminPageRe, demoHtml);
}

/* 4. JS consts */
{
  const restLine = 'let rest=null,cats=[],menus=[],activeMenuId=null,openB={},dtabs={};';
  must(html.includes(restLine), 'hittade inte "let rest=null,..."-raden');
  const demoConsts =
`const IS_DEMO=true;
const DEMO_SLUG='demo';
function demoBlock(){
  const t=document.getElementById('demoToast');
  if(t){t.style.display='block';clearTimeout(t._timer);t._timer=setTimeout(function(){t.style.display='none';},2500);}
  return false;
}
${restLine}`;
  html = html.replace(restLine, demoConsts);
}

/* 5. JS demo-vakt i 35 funktioner */
{
  const guarded = [
    'sendConfirmation','setStatusVal','toggleComplete','saveBulk','saveGuestEdit',
    'delOrder','delBulkPortions','createBooking','delBooking','doReminder',
    'sendSummary','sendContactLink','copyKitchen','copyGuestList','exportPDF','exportGuestPDF',
    'archiveFromCal','delBookingFromCal','exportCalPDF','archiveMenu','restoreBooking',
    'deleteArchivedBooking','showNewMenuForm','openImportForMenu','downloadQR','createMenu',
    'addCat','saveSettings','importMenu','saveItem','delItem',
    'addItem','delCat','renameMenu','copyMenu','deleteMenu'
  ];
  const GUARD = 'if(IS_DEMO)return demoBlock();';
  for(const fn of guarded){
    const reStr = '((?:async )?function ' + fn + '\\([^)]*\\)\\{)';
    const countMatches = html.match(new RegExp(reStr, 'g')) || [];
    must(countMatches.length === 1, 'funktion "' + fn + '" hittades ' + countMatches.length + ' gånger (förväntade 1)');
    html = html.replace(new RegExp(reStr), '$1' + GUARD);
  }
}

/* 6. JS autoInitDemo + welcome + anrop */
{
  const initMarker = 'async function initAdmin(){';
  must(html.includes(initMarker), 'hittade inte "async function initAdmin(){"');
  const demoInit =
`// ── DEMO AUTO-INIT ──
async function autoInitDemo(){
  document.getElementById('loginPage').style.display='none';
  document.getElementById('adminPage').style.display='block';
  const {data:r}=await db.from('restaurants').select('*').eq('slug',DEMO_SLUG).single();
  if(!r){document.getElementById('adminPage').innerHTML='<div style="text-align:center;padding:4rem;color:var(--muted)">Demo-restaurangen hittades inte. Kontakta premeny.se</div>';return;}
  rest=r;
  document.getElementById('restName').textContent=r.name+' (Demo)';
  document.documentElement.style.setProperty('--gold','#b8955a');
  await loadCats();
  const {data:menuList}=await db.from('menus').select('*').eq('restaurant_id',rest.id).eq('archived',false).order('created_at');
  const nbMenu=document.getElementById('nb-menu');
  if(nbMenu){nbMenu.innerHTML='<option value="">Välj meny...</option>';(menuList||[]).forEach(function(m){var o=document.createElement('option');o.value=m.id;o.textContent=m.name;nbMenu.appendChild(o);});}
  renderBookings();
  maybeShowDemoWelcome();
}
function maybeShowDemoWelcome(){
  var el=document.getElementById('demoWelcome');if(el)el.style.display='flex';
}
function closeDemoWelcome(){
  var el=document.getElementById('demoWelcome');if(el)el.style.display='none';
}
async function initAdmin(){`;
  html = html.replace(initMarker, demoInit);

  const lastScriptClose = html.lastIndexOf('</script>');
  must(lastScriptClose !== -1, 'hittade ingen avslutande </script>');
  html = html.slice(0, lastScriptClose)
       + '\n// Demo: starta automatiskt\nautoInitDemo();\n'
       + html.slice(lastScriptClose);
}

must(html !== orig, 'ingenting ändrades – något är fel');
fs.writeFileSync(OUT, html);
console.log('✓ ' + OUT + ' byggd från ' + SRC);
console.log('  byggstämpel: ' + demoStamp);
