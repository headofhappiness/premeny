/* Bumpa PreMenys versionsstämpel så att öppna admin-/superadmin-sidor visar "ny version finns".
   Körs INNAN commit när något användaren ska se har ändrats:
     node bump_version.js            (stämpel = dagens datum + nästa bokstav)
     node bump_version.js 2026-11-14a   (egen stämpel)
   Uppdaterar version.json + <meta name="pm-build"> i admin.html och superadmin.html, och bygger om admin_demo.html. */
const fs = require('fs');
const path = require('path');
const dir = __dirname;

function nextStamp() {
  const d = new Date();
  const day = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  let cur = '';
  try { cur = JSON.parse(fs.readFileSync(path.join(dir, 'version.json'), 'utf8')).build || ''; } catch (e) {}
  if (cur.startsWith(day) && /[a-z]$/.test(cur)) return day + String.fromCharCode(cur.charCodeAt(cur.length - 1) + 1);
  return day + 'a';
}
const stamp = process.argv[2] || nextStamp();

fs.writeFileSync(path.join(dir, 'version.json'), JSON.stringify({ build: stamp }) + '\n');
for (const f of ['admin.html', 'superadmin.html']) {
  const p = path.join(dir, f);
  let h = fs.readFileSync(p, 'utf8');
  const re = /<meta name="pm-build" content="[^"]*">/;
  if (!re.test(h)) throw new Error(f + ': saknar pm-build-meta');
  h = h.replace(re, '<meta name="pm-build" content="' + stamp + '">');
  fs.writeFileSync(p, h);
}
// Cache-nyckel på delade filer, så att en ändrad stilmall/skript verkligen hämtas på nytt
for (const f of ['admin.html', 'superadmin.html', 'guest.html', 'landing.html', 'registrera.html']) {
  const p = path.join(dir, f);
  let h = fs.readFileSync(p, 'utf8');
  const re = /(ui-clarity\.css|ui-clarity\.js|update-check\.js|mfa\.js|pm-captcha\.js)\?v=[^"']*/g;
  const ny = h.replace(re, '$1?v=' + stamp);
  if (ny !== h) fs.writeFileSync(p, ny);
}
process.chdir(dir);
require('./build_demo.js');
console.log('Versionsstämpel: ' + stamp);
