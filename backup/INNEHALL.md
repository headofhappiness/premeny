# Vad som fanns i PreMenys databas 2026-10-12

Avstämt direkt mot `gndzalmkbsfhclpoidqi` innan projektet pausades.
Pausning raderar ingenting — det här är en förteckning över vad som ska
finnas kvar när projektet återställs, så att det går att kontrollera.

## Radantal

| Tabell | Rader |
|---|---|
| order_items | 398 |
| orders | 252 |
| menu_items | 196 |
| menu_categories | 63 |
| menus | 17 |
| bookings | 14 |
| restaurants | 5 |
| restaurant_admins | 4 |
| restaurant_notes | 1 |
| announcements | 0 |
| announcement_reads | 0 |
| headofpassion_contacts | 0 |

## Restauranger

| Slug | Namn | Kontakt |
|---|---|---|
| `demo` | DemoRestaurang | — (demodata) |
| `brunsbo` | Brunsbo Gästgiveri | Niklas, bokning@brunsbo.se, 0511-177 10 |
| `robbans` | Robbans restaurang | Robban, robertwallroth@hotmail.com |
| `roffes` | Roffes Brygga | Roffe, info@vagdata.se |
| `lisa-test` | Lisas pizza | astridminds@gmail.com (eget testkonto) |

Fyra av dem har ett inloggningskonto kopplat (`restaurant_admins`).

## Menyer

17 menyer, varav **elva hos Brunsbo** — sex bröllopsmenyer med satta
priser (325–688 kr), en lunchmeny, en à la carte för kvällen. Det är
den mest tidskrävande datan i hela projektet: 196 rätter med namn,
beskrivning och pris, inskrivna för hand.

Roffes och Robbans menyer har egen ton ("Kräftfrossa – tolv stycken och
en gråtande granne"). Den texten finns inte någon annanstans.

## Bokningar

14 stycken, varav tre raderade (`deleted_at` satt). Den senaste:

- **Peters midag** — Lisas pizza, 24 oktober 2026, skapad 7 oktober.
  Gästlänk skickad till astridminds@gmail.com. Noll beställningar än.

Övriga är från maj–juni 2026.

## Om de 252 beställningarna

Merparten är genererad testdata: `Portion 1`–`Portion 105` och
`Gäst 1`–`Gäst 40 (bokningsansvarig)`. Riktiga gästnamn förekommer i
ett tjugotal rader, framför allt på Roffes bokning "Gustavsson" och
Brunsbos "Viktoria Wikmark".

Allerginoteringarna är däremot äkta och visar att funktionen användes
som tänkt: *"Tål inte ägg"*, *"Glutenfritt"*, *"Skaldjursallergi"*,
*"Vegansk"*, *"Tål inte citron"*, *"kött istället för fisk"*.

## Om du vill ha en råkopia

Supabase bevarar allt under pausning, så det här är bälte och
hängslen. Vill du ändå ha filerna: öppna SQL-editorn i dashboarden,
kör `select * from <tabell>` och klicka **Download CSV**. Tolv tabeller,
någon minut. Det är snabbare och säkrare än att låta mig kopiera data
genom chatten.
