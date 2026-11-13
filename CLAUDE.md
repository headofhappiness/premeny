# PreMeny – arbetsregler för Claude

Förbeställning av mat för sällskap. Statiskt frontend på GitHub Pages (premeny.se) + Supabase (backend, auth, edge functions). Del av Head of Happiness AB. Systerprojekt: LagPasset (samma stack).

Lisa (ägare) pratar svenska. Skriv svar, UI-texter och kommentarer på svenska. Visa inget slutgiltigt som "klart" förrän det är kört och verifierat.

## Arbetssätt

- **Verifiera genom att KÖRA**, inte bara läsa. Öppna den skarpt deployade adressen (med cache-buster), inte en proxy eller förhandsvisning. En runtime-krasch passerar syntaxkontroll.
- **Testa databasändringar med rollsimulering** i en transaktion som rullas tillbaka (`set local role anon/authenticated`, `set_config('request.jwt.claims' / 'request.headers', …)`), och bekräfta sedan med ett skarpt anrop mot REST-API:t med den publika nyckeln.
- Git: **namnge filerna** i `git add`, aldrig `git add -A`. Hämta senaste (`pull --rebase --autostash`) före push. Inget `cd`-prefix i skal-kommandon – använd `git -C <mapp>`.
- **Före varje push av något användaren ska se: `node bump_version.js`.** Den uppdaterar `version.json`, `pm-build`-metan i admin och superadmin, cache-nycklarna (`?v=`) på delade filer och bygger om `admin_demo.html`. Öppna admin-/superadmin-sidor visar då banderollen "ny version finns".
- `admin_demo.html` är **genererad** av `build_demo.js` ur `admin.html`. Redigera aldrig demon för hand.
- Tydlighet (kontrast, storlek, knappar) styrs av `ui-clarity.css` + `ui-clarity.js`, som laddas sist. Justera där, inte sida för sida. Inline-stilar satta via JS serialiseras med mellanslag (`font-size: 13px`) – attributväljare i CSS måste täcka båda skrivsätten.
- Skicka aldrig något (mejl/sms) utan bekräftelseruta. Starta aldrig kostnadsdrivande tjänster utan att fråga.

## Arkitektur och hotbild

- Ingen egen server. Säkerheten vilar på **RLS, token/session, escaping i webbläsaren och 2FA**. Serverside-/Next.js-råd gäller inte.
- `service_role`-nyckeln finns **aldrig** i frontend, bara i edge functions.
- Gäster (anon) identifieras av en bokningslänk: klienten skickar rubriken `x-booking-id`, och RLS-policyerna `guest_hdr_*` släpper bara igenom den bokningens rader. Gästsidor läser via vyerna `guest_restaurants` och `guest_bookings`, inte tabellerna.
- Restauranger och superadmin loggar in med **länk (magic link) + tvingande TOTP**. Restauranger har inga lösenord.

## RLS

- Varje tabell i `public` ska ha RLS på: `select schemaname,tablename from pg_tables where schemaname='public' and rowsecurity=false;` ska ge 0 rader.
- Inga "allow all"-policyer (`qual`/`with_check` = `true`) på persondata. Granska `pg_policies`. `true` är bara OK på publik ofarlig data (menyer) och insert-only-loggar utan läspolicy.
- Loggtabeller: RLS på och inga policyer (bara service_role).
- Kör Supabase Security Advisor efter varje DDL. Mål: inga fel utöver de avsiktliga (gästvyerna är definer-vyer med flit).
- **Vyer ärver ägarens rättigheter och går förbi RLS.** En vy som `grant`:as till `authenticated` läcker alla restaurangers data. Gör inga vyer för intern data; om en vy behövs: `security_invoker = true`, eller en smal definer-vy med bara säkra kolumner och rader.
- Policyer med rollen `public` utvärderas även för `anon`. Funktioner som anropas i policyer (t.ex. `my_restaurant_id()`) måste därför gå att köra och läsa sina tabeller som `anon`. Återkalla inte `select` på en hjälptabell från anon utan att testa gäst- och demoflödet.

## SECURITY DEFINER-fällor

1. En definer-funktion som anropbar av anon och "tillåter när `auth.uid()` är null" är öppen för alla. Blockera null-uid explicit.
2. NULL-osäkra IF-spärrar i plpgsql: `if not (x = nån_fn())` blir NULL om funktionen ger NULL och släpper då igenom. Kräv `nån_fn() is not null` före jämförelsen. (RLS-policyer är OK: där räknas NULL som nekad.)
3. `revoke execute … from public, anon, authenticated` på allt som inte ska anropas direkt, och lägg behörighetskontroll i funktionskroppen. `PUBLIC` måste också dras in – `revoke from anon` räcker inte.
4. Sätt `set search_path = ''` och skriv ut scheman (`public.`, `auth.`).

## Affärsregler: tvinga dem i databasen

Klientkontroller (sista beställningsdag, antal, behörighet) går att kringgå med direkta REST-anrop och den publika nyckeln. Kritiska invarianter ska ligga i triggers och constraints. Se `guard_guest_order` och `guard_guest_order_item` (sista dag, tak per bokning, rätt tillhör restaurangen) och längdspärrarna på fritext. Bestäm "anonym" med `current_setting('role')`, inte JWT-claims.

## 2FA (tvingande)

- Tvinga `aal2` på serversidan: restriktiv RLS-policy (`require_aal2`) på alla tabeller med persondata, aal2-kontroll i RPC:er (`create_my_restaurant`) och avkodning av `aal` i edge functions. Inte bara i UI.
- Bootstrap-tabeller (`restaurant_admins`) stannar på aal1 så att inloggningen kan läsa sin egen rad.

## XSS och CSP

- All användar- eller databastext som läggs i `innerHTML`/mallar måste escapas: `escHtml()` (admin), `escapeHtml()`/`escAttrSM()` (superadmin), `escGuest()`/`escAttrGuest()` (gäst). Gäst- och registrantstyrd text är fientlig indata: gästnamn, kommentarer, allergier, restaurangnamn, telefon, adress, webbplats, accentfärg, logotyp.
- Data i `onclick="fn('…')"`: skicka via `data-`-attribut (`this.dataset.x`) i stället för att bygga in strängen. Färger i `style` ska passera `safeColor()`.
- CSP-meta finns på varje sida. Frame-ancestors/X-Frame-Options går inte att sätta via meta på GitHub Pages.
- Bevisa escaping genom att köra: mata renderfunktionerna med `"><img src=x onerror=…>` och kontrollera att inget injiceras eller körs.

## Hemligheter

- Aldrig i repot. Skanna hela git-historiken före större ändringar (`service_role`-JWT, `re_` för Resend, 46elks, Anthropic). `.env` ska aldrig committas.
- Repot är publikt: skriv ingenting här som beskriver ofixade sårbarheter.

## Publika endpoints som skickar mejl/sms (kostnad och rykte)

- Edge functions kräver egen auth (`verify_jwt` släpper in den publika anon-nyckeln). Oautentiserat anrop ska ge 401/403. Superadmin-funktioner kräver dessutom aal2.
- Öppen registrering/inloggning med länk ska skyddas med CAPTCHA (Cloudflare Turnstile) och rate-limit. Dygnstak per restaurang finns för mejl/sms. Håll förbetalt saldo utan automatisk påfyllning hos sms-leverantören.
- Skicka aldrig till godtyckliga adresser oskyddat. Svara lika oavsett om en adress finns (ingen uppräkning).

## GDPR

- Dataminimering. Inga personnummer. Specialkost kan vara känsliga personuppgifter: behandla med särskild omsorg.
- Gallring av persondata ska vara automatiserad (schemalagt jobb), tidsbegränsad och loggad.
- Personuppgiftsbiträdesavtal (art. 28) med rätt underbiträden (Supabase, Resend, 46elks, Cloudflare, GitHub).
