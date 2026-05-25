-- patch3.sql – Kör i Supabase SQL Editor
-- Lägger till alla nya kolumner

-- Bokningar: telefon och intern kommentar (om inte redan gjort)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS contact_phone text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS internal_comment text;

-- Order items: kommentar per rätt
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS comment text default '';

-- Restauranger: telefon och adress för kontaktinfo till gäster
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS website text;

-- Verifiera att allt finns
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_name IN ('bookings','order_items','restaurants') 
AND column_name IN ('contact_phone','internal_comment','comment','phone','address','website')
ORDER BY table_name, column_name;

-- Kontakt-email för restaurangen (för gäster vid stängd beställning)
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS contact_email text;

-- Logga när sammanställning skickades till kontaktpersonen
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS summary_sent_at timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS summary_sent_log text default '';

-- Logo URL för restaurangen (för landningssidan)
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS logo_url text;

-- Bokningsansvarig (restaurangens personal)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS responsible_staff text;

-- Typ av sittning (Middag, Lunch, Brunch osv)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS event_type text;
