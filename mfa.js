/* PreMeny – tvåstegsverifiering (TOTP, autentiseringsapp).
 * Delas av admin.html och superadmin.html. Kräver en global supabase-klient `db`.
 *
 * Användning:  mfaGuard(function(){ ...fortsätt starta sidan... })
 *   - redan verifierad (aal2)      -> kör funktionen direkt
 *   - har en enhet, inte verifierad -> visar kodruta, kör funktionen efter lyckad kod
 *   - saknar enhet                  -> visar registrering (QR-kod), kör funktionen efteråt
 *
 * window.MFA_ENFORCED = false  -> registreringen kan hoppas över för sessionen (mjukt läge)
 * window.MFA_ENFORCED = true   -> ingen "hoppa över"; servern kräver dessutom aal2 (RLS)
 */
(function () {
  var continueFn = null;
  var enrollFactorId = null;
  var closableFn = null; // satt när rutan öppnats från Inställningar (kan stängas)

  function $(id) { return document.getElementById(id); }
  function enforced() { return window.MFA_ENFORCED === true; }
  function removeGate() { var g = $('pmMfaGate'); if (g && g.parentNode) g.parentNode.removeChild(g); }
  function msg(t, ok) {
    var m = $('pmMfaMsg'); if (!m) return;
    m.style.display = 'block'; m.style.color = ok ? '#3a6020' : '#a03030'; m.textContent = t;
  }
  function logoutHtml() {
    return '<div style="margin-top:1.2rem;font-size:15px">'
      + (closableFn ? '<a href="#" onclick="mfaCloseGate();return false" style="color:var(--muted)">Avbryt</a>'
                    : '<a href="#" onclick="mfaLogout();return false" style="color:var(--muted)">Logga ut</a>')
      + '</div>';
  }
  var BOX = 'max-width:420px;width:100%;text-align:center;background:var(--surface,#fff);border:1px solid var(--border,#e8e2d8);border-radius:16px;padding:2rem 1.5rem;box-shadow:0 10px 40px rgba(26,23,18,.12)';
  var INPUT = 'width:170px;padding:11px 12px;border:1px solid var(--border,#e8e2d8);border-radius:10px;font-family:inherit;font-size:22px;letter-spacing:.25em;text-align:center;background:var(--bg,#faf8f4);color:var(--text,#2d2a24)';
  var BTN = 'background:var(--dark,#1a1712);color:#fff;border:none;border-radius:100px;padding:12px 26px;font-family:inherit;font-size:15px;font-weight:500;cursor:pointer';

  function showGate(mode, errText) {
    removeGate();
    var ov = document.createElement('div');
    ov.id = 'pmMfaGate';
    ov.style.cssText = 'position:fixed;inset:0;z-index:99999;background:var(--bg,#faf8f4);display:flex;align-items:center;justify-content:center;padding:1.5rem;overflow:auto;font-family:inherit';
    var h = '';
    if (mode === 'verify') {
      h = '<div style="' + BOX + '">'
        + '<div style="font-size:1.4rem;font-family:\'Playfair Display\',serif;color:var(--dark,#1a1712);margin-bottom:.4rem">🔐 Tvåstegsverifiering</div>'
        + '<div style="font-size:14px;color:var(--muted,#4a4238);margin-bottom:1.2rem;line-height:1.55">Skriv in den 6-siffriga koden från din autentiseringsapp.</div>'
        + '<input id="pmMfaCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000" style="' + INPUT + '">'
        + '<div style="margin-top:1rem"><button style="' + BTN + '" onclick="mfaGateVerify()">Fortsätt</button></div>'
        + '<div id="pmMfaMsg" style="display:none;margin-top:1rem;font-size:15px"></div>'
        + '<div style="margin-top:1rem;font-size:14px;color:var(--muted,#4a4238);line-height:1.5">Har du tappat din telefon? Kontakta <a href="mailto:info@premeny.se" style="color:var(--gold-ink,#7a5a1c)">info@premeny.se</a> så nollställer vi.</div>'
        + logoutHtml() + '</div>';
      ov.innerHTML = h; document.body.appendChild(ov);
      focusCode('pmMfaCode', mfaGateVerify);
    } else if (mode === 'enroll') {
      h = '<div style="' + BOX + '">'
        + '<div style="font-size:1.4rem;font-family:\'Playfair Display\',serif;color:var(--dark,#1a1712);margin-bottom:.4rem">🔐 Aktivera tvåstegsverifiering</div>'
        + '<div style="font-size:14px;color:var(--muted,#4a4238);margin-bottom:1rem;line-height:1.55">För att skydda era och era gästers uppgifter kräver PreMeny tvåstegsverifiering. Öppna en autentiseringsapp (Google Authenticator, Microsoft Authenticator eller Authy), skanna QR-koden och skriv in de 6 siffrorna.</div>'
        + '<div id="pmMfaQr" style="margin:.5rem 0 .75rem;min-height:60px;color:var(--muted,#4a4238);font-size:15px">Skapar QR-kod…</div>'
        + '<div style="font-size:14px;color:var(--muted,#4a4238);margin-bottom:1rem">Kan du inte skanna? Skriv in nyckeln:<br><code id="pmMfaSecret" style="font-size:14px;word-break:break-all;background:var(--bg,#faf8f4);padding:2px 6px;border-radius:4px;display:inline-block;margin-top:3px"></code></div>'
        + '<input id="pmMfaEnrollCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000" style="' + INPUT + '">'
        + '<div style="margin-top:1rem"><button style="' + BTN + '" onclick="mfaGateVerifyEnroll()">Aktivera och fortsätt</button></div>'
        + '<div id="pmMfaMsg" style="display:none;margin-top:1rem;font-size:15px"></div>'
        + (!enforced() && !closableFn ? '<div style="margin-top:1rem"><a href="#" onclick="mfaSkip();return false" style="font-size:14px;color:var(--muted,#4a4238)">Hoppa över just nu</a></div>' : '')
        + logoutHtml() + '</div>';
      ov.innerHTML = h; document.body.appendChild(ov);
      startEnroll();
    } else {
      h = '<div style="' + BOX + '">'
        + '<div style="font-size:1.4rem;font-family:\'Playfair Display\',serif;color:var(--dark,#1a1712);margin-bottom:.6rem">🔐 Tvåstegsverifiering</div>'
        + '<div style="font-size:14px;color:#a03030;margin-bottom:1rem;line-height:1.55">Kunde inte kontrollera tvåstegsverifieringen' + (errText ? ': ' + String(errText).replace(/</g, '&lt;') : '') + '.</div>'
        + '<div style="font-size:15px;color:var(--muted,#4a4238)">Försök igen om en stund eller kontakta <a href="mailto:info@premeny.se" style="color:var(--gold-ink,#7a5a1c)">info@premeny.se</a>.</div>'
        + logoutHtml() + '</div>';
      ov.innerHTML = h; document.body.appendChild(ov);
    }
  }
  function focusCode(id, fn) {
    setTimeout(function () {
      try { var i = $(id); i.focus(); i.addEventListener('keydown', function (e) { if (e.key === 'Enter') fn(); }); } catch (e) {}
    }, 100);
  }

  async function startEnroll() {
    try {
      try { var f = await db.auth.mfa.listFactors(); var list = (f.data && f.data.totp) || []; for (var i = 0; i < list.length; i++) { if (list[i].status !== 'verified') await db.auth.mfa.unenroll({ factorId: list[i].id }); } } catch (e) {}
      var r = await db.auth.mfa.enroll({ factorType: 'totp', issuer: 'PreMeny', friendlyName: 'PreMeny ' + Date.now() });
      if (r.error) throw r.error;
      enrollFactorId = r.data.id;
      var q = $('pmMfaQr'); q.innerHTML = '';
      var qr = r.data.totp && r.data.totp.qr_code;
      if (qr) { var im = document.createElement('img'); im.src = qr; im.alt = 'QR-kod'; im.style.cssText = 'width:176px;height:176px'; q.appendChild(im); }
      var s = $('pmMfaSecret'); if (s) s.textContent = (r.data.totp && r.data.totp.secret) || '';
      focusCode('pmMfaEnrollCode', mfaGateVerifyEnroll);
    } catch (e) {
      var q2 = $('pmMfaQr'); if (q2) q2.textContent = '';
      msg('Kunde inte starta: ' + (e && e.message ? e.message : 'okänt fel') + '. Kontakta info@premeny.se om det upprepas.');
    }
  }

  async function verifyWith(factorId, code) {
    var ch = await db.auth.mfa.challenge({ factorId: factorId });
    if (ch.error) throw ch.error;
    var v = await db.auth.mfa.verify({ factorId: factorId, challengeId: ch.data.id, code: code });
    return !v.error;
  }
  function done() { removeGate(); var f = continueFn; closableFn = null; if (typeof f === 'function') f(); }

  window.mfaGateVerify = async function () {
    var code = (($('pmMfaCode') || {}).value || '').trim();
    if (code.length < 6) { msg('Skriv in den 6-siffriga koden.'); return; }
    try {
      var f = await db.auth.mfa.listFactors();
      var t = ((f.data && f.data.totp) || []).filter(function (x) { return x.status === 'verified'; })[0];
      if (!t) { showGate('enroll'); return; }
      if (await verifyWith(t.id, code)) done(); else msg('Fel kod. Försök igen.');
    } catch (e) { msg('Något gick fel. Försök igen.'); }
  };
  window.mfaGateVerifyEnroll = async function () {
    var code = (($('pmMfaEnrollCode') || {}).value || '').trim();
    if (!enrollFactorId) return;
    if (code.length < 6) { msg('Skriv in den 6-siffriga koden.'); return; }
    try {
      if (await verifyWith(enrollFactorId, code)) { enrollFactorId = null; done(); }
      else msg('Fel kod. Kontrollera att klockan i telefonen stämmer och försök igen.');
    } catch (e) { msg('Något gick fel. Försök igen.'); }
  };
  window.mfaSkip = function () { try { sessionStorage.setItem('pm_mfa_skip', '1'); } catch (e) {} done(); };
  window.mfaLogout = function () { if (typeof window.doLogout === 'function') window.doLogout(); else { db.auth.signOut().then(function () { location.reload(); }); } };
  window.mfaCloseGate = function () {
    if (enrollFactorId) { try { db.auth.mfa.unenroll({ factorId: enrollFactorId }); } catch (e) {} enrollFactorId = null; }
    var f = closableFn; closableFn = null; removeGate(); if (typeof f === 'function') f();
  };

  window.mfaGuard = async function (onPass) {
    continueFn = onPass; closableFn = null;
    try {
      if (typeof db === 'undefined' || !db || !db.auth || !db.auth.mfa) { onPass(); return; }
      var r = await db.auth.mfa.getAuthenticatorAssuranceLevel();
      if (r.error) throw r.error;
      var d = r.data;
      if (d.currentLevel === 'aal2') { onPass(); return; }
      if (d.nextLevel === 'aal2') { showGate('verify'); return; }
      var skipped = false; try { skipped = sessionStorage.getItem('pm_mfa_skip') === '1'; } catch (e) {}
      if (!enforced() && skipped) { onPass(); return; }
      showGate('enroll');
    } catch (e) {
      if (enforced()) showGate('error', e && e.message);
      else onPass(); // mjukt läge: ett tekniskt fel ska aldrig stänga ute någon
    }
  };

  // ── Status + hantering (Inställningar) ──
  window.mfaRenderStatus = async function (elId) {
    var el = $(elId); if (!el) return;
    try {
      var s = await db.auth.getSession();
      if (!s.data || !s.data.session) { el.textContent = 'Logga in för att hantera tvåstegsverifiering.'; return; }
      var f = await db.auth.mfa.listFactors();
      var has = ((f.data && f.data.totp) || []).some(function (x) { return x.status === 'verified'; });
      if (has) {
        el.innerHTML = '<span style="display:inline-block;background:#f2f8ec;color:#3a6020;font-weight:500;border-radius:100px;padding:2px 11px;font-size:14px">På</span> &nbsp;Tvåstegsverifiering är aktiverad.'
          + ' <button onclick="mfaChangeDevice(\'' + elId + '\')" style="background:none;border:1px solid var(--border,#e8e2d8);color:var(--muted,#4a4238);border-radius:100px;padding:4px 12px;font-size:14px;cursor:pointer;font-family:inherit;margin-left:.5rem">Byt enhet</button>';
      } else {
        el.innerHTML = '<span style="display:inline-block;background:#fdf6e8;color:#9a6a10;font-weight:500;border-radius:100px;padding:2px 11px;font-size:14px">Av</span> &nbsp;Inte aktiverad ännu.'
          + ' <button onclick="mfaEnrollNow(\'' + elId + '\')" style="' + BTN + ';padding:6px 16px;font-size:15px;margin-left:.5rem">Aktivera nu</button>';
      }
    } catch (e) { el.textContent = 'Tvåstegsverifiering är inte tillgänglig just nu.'; }
  };
  window.mfaEnrollNow = function (elId) {
    continueFn = function () { window.mfaRenderStatus(elId); };
    closableFn = function () { window.mfaRenderStatus(elId); };
    showGate('enroll');
  };
  window.mfaChangeDevice = async function (elId) {
    if (!confirm('Byta enhet?\n\nDen gamla enheten slutar fungera och du får skanna en ny QR-kod nu.')) return;
    try {
      var f = await db.auth.mfa.listFactors();
      var list = ((f.data && f.data.totp) || []).filter(function (x) { return x.status === 'verified'; });
      for (var i = 0; i < list.length; i++) { var u = await db.auth.mfa.unenroll({ factorId: list[i].id }); if (u.error) throw u.error; }
    } catch (e) { alert('Kunde inte byta enhet: ' + (e && e.message ? e.message : 'okänt fel')); return; }
    window.mfaEnrollNow(elId);
  };
})();
