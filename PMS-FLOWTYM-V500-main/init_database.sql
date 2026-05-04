-- ═══════════════════════════════════════════════════════════════════════════
-- FLOWTYM PMS — ÉTAPE 2 : CRÉATION DU SCHÉMA v2.2
-- Exécuter APRÈS reset_database.sql
-- ═══════════════════════════════════════════════════════════════════════════
-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── HOTELS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hotels (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  city          TEXT,
  address       TEXT,
  zip           TEXT,
  country       TEXT DEFAULT 'France',
  phone         TEXT,
  email         TEXT,
  siret         TEXT,
  tva_number    TEXT,
  logo_url      TEXT,
  timezone      TEXT DEFAULT 'Europe/Paris',
  currency      TEXT DEFAULT 'EUR',
  city_tax_rate DECIMAL(5,2) DEFAULT 2.65,
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── CHAMBRES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id      UUID REFERENCES hotels(id) ON DELETE CASCADE,
  number        TEXT NOT NULL,
  type          TEXT,
  category      TEXT,
  floor         INT DEFAULT 1,
  surface_m2    DECIMAL(6,1),
  max_occupancy INT DEFAULT 2,
  base_price    DECIMAL(10,2),
  status        TEXT DEFAULT 'available',
  amenities     JSONB DEFAULT '[]',
  notes         TEXT,
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(hotel_id, number)
);

-- ─── STAFF ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id   UUID REFERENCES hotels(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name  TEXT NOT NULL,
  email      TEXT UNIQUE,
  phone      TEXT,
  role       TEXT NOT NULL,
  shift      TEXT,
  active     BOOLEAN DEFAULT true,
  hired_at   DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── PLANS TARIFAIRES ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rate_plans (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id            UUID REFERENCES hotels(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  code                TEXT,
  description         TEXT,
  discount_pct        DECIMAL(5,2) DEFAULT 0,
  cancellation_policy TEXT DEFAULT 'flexible',
  min_stay            INT DEFAULT 1,
  active              BOOLEAN DEFAULT true,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── TAUX DE CHANGE ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exchange_rates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  currency_from TEXT NOT NULL DEFAULT 'EUR',
  currency_to   TEXT NOT NULL,
  rate          DECIMAL(12,6) NOT NULL,
  rate_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  source        TEXT DEFAULT 'ECB',
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(currency_from, currency_to, rate_date)
);

-- ─── CLIENTS / GUESTS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS guests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id      UUID REFERENCES hotels(id) ON DELETE SET NULL,
  legacy_id     SERIAL UNIQUE,
  first_name    TEXT,
  last_name     TEXT NOT NULL,
  email         TEXT,
  phone         TEXT,
  country       TEXT DEFAULT 'FR',
  nationality   TEXT,
  passport      TEXT,
  date_of_birth DATE,
  address       TEXT,
  city          TEXT,
  zip           TEXT,
  language      TEXT DEFAULT 'fr',
  segment       TEXT DEFAULT 'Leisure',
  loyalty_level TEXT DEFAULT 'Standard',
  total_spent   DECIMAL(12,2) DEFAULT 0,
  total_stays   INT DEFAULT 0,
  id_verified   BOOLEAN DEFAULT false,
  gdpr_consent  BOOLEAN DEFAULT false,
  gdpr_date     TIMESTAMP WITH TIME ZONE,
  blacklisted   BOOLEAN DEFAULT false,
  notes         TEXT,
  tags          TEXT[],
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── HISTORIQUE CLIENTS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS guest_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id        UUID REFERENCES guests(id) ON DELETE CASCADE,
  reservation_id  UUID,                 -- FK ajoutée après création reservations
  stay_start      DATE,
  stay_end        DATE,
  room_number     TEXT,
  amount          DECIMAL(10,2),
  rating          INT CHECK (rating BETWEEN 1 AND 5),
  comment         TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── GROUPES ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_reservations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id      UUID REFERENCES hotels(id) ON DELETE CASCADE,
  group_name    TEXT NOT NULL,
  contact_name  TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  room_count    INT DEFAULT 1,
  total_amount  DECIMAL(12,2),
  deposit       DECIMAL(12,2) DEFAULT 0,
  status        TEXT DEFAULT 'confirmed',
  notes         TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── RÉSERVATIONS ────────────────────────────────────────────────────────────
-- IMPORTANT : id UUID (compatible avec toutes les FK)
-- reference TEXT pour le format lisible RES-XXXX (affiché dans l'UI)
CREATE TABLE IF NOT EXISTS reservations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference            TEXT UNIQUE,          -- ex: 'RES-001' (affiché dans l'UI)
  hotel_id             UUID REFERENCES hotels(id) ON DELETE SET NULL,
  room_id              UUID REFERENCES rooms(id) ON DELETE SET NULL,
  room_number          TEXT,
  guest_id             UUID REFERENCES guests(id) ON DELETE SET NULL,
  client_id            INT,                  -- compat legacy guests.legacy_id
  guest_name           TEXT,
  guest_email          TEXT,
  guest_phone          TEXT,
  group_id             UUID REFERENCES group_reservations(id) ON DELETE SET NULL,
  rate_plan_id         UUID REFERENCES rate_plans(id) ON DELETE SET NULL,
  check_in             DATE NOT NULL,
  check_out            DATE NOT NULL,
  nights               INT,
  status               TEXT DEFAULT 'confirmed'
    CHECK (status IN ('confirmed','pending','checked_in','checked_out','cancelled','no_show')),
  checkin_status       TEXT DEFAULT 'pending'
    CHECK (checkin_status IN ('pending','completed')),
  adults               INT DEFAULT 2,
  children             INT DEFAULT 0,
  pax                  INT,
  total_amount         DECIMAL(12,2) DEFAULT 0,
  paid_amount          DECIMAL(12,2) DEFAULT 0,
  solde                DECIMAL(12,2),
  city_tax             DECIMAL(10,2) DEFAULT 0,
  source               TEXT DEFAULT 'Direct',
  segment              TEXT DEFAULT 'Leisure',
  external_id          TEXT,
  payment_mode         TEXT DEFAULT 'Carte bancaire',
  payment_status       TEXT DEFAULT 'pending'
    CHECK (payment_status IN ('pending','paid','partial','expired','refunded')),
  guarantee_type       TEXT DEFAULT 'cb',
  guarantee_status     TEXT DEFAULT 'pending',
  cancellation_policy  TEXT DEFAULT 'flexible'
    CHECK (cancellation_policy IN ('flexible','modere','stricte','non_remboursable')),
  cancelled_at         TIMESTAMP WITH TIME ZONE,
  cancellation_reason  TEXT,
  no_show_at           TIMESTAMP WITH TIME ZONE,
  cleaning_requested   BOOLEAN DEFAULT false,
  cleaning_date        DATE,
  notes                TEXT,
  special_requests     TEXT,
  room_type            TEXT,
  room_category        TEXT,
  created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter la FK guest_history → reservations maintenant que la table existe
ALTER TABLE guest_history
  ADD CONSTRAINT fk_guest_history_reservation
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE SET NULL
  NOT VALID;

-- ─── PAIEMENTS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id  UUID REFERENCES reservations(id) ON DELETE CASCADE,
  hotel_id        UUID REFERENCES hotels(id) ON DELETE SET NULL,
  amount          DECIMAL(12,2) NOT NULL,
  payment_method  TEXT NOT NULL DEFAULT 'Carte bancaire',
  payment_date    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reference       TEXT,
  transaction_id  TEXT,
  status          TEXT DEFAULT 'completed'
    CHECK (status IN ('completed','pending','refunded','failed')),
  payment_type    TEXT DEFAULT 'settlement'
    CHECK (payment_type IN ('deposit','settlement','refund','credit_note')),
  notes           TEXT,
  created_by      UUID,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── PRESTATIONS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prestations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id  UUID REFERENCES reservations(id) ON DELETE CASCADE,
  room_id         UUID REFERENCES rooms(id) ON DELETE SET NULL,
  hotel_id        UUID REFERENCES hotels(id) ON DELETE SET NULL,
  family          TEXT NOT NULL,
  code            TEXT,
  label           TEXT NOT NULL,
  quantity        INT DEFAULT 1,
  unit_price      DECIMAL(10,2) NOT NULL,
  discount_pct    DECIMAL(5,2) DEFAULT 0,
  total_amount    DECIMAL(12,2),
  tva_rate        DECIMAL(5,2) DEFAULT 10.0,
  tva_amount      DECIMAL(10,2),
  prestation_date DATE DEFAULT CURRENT_DATE,
  status          TEXT DEFAULT 'active'
    CHECK (status IN ('active','cancelled','invoiced')),
  notes           TEXT,
  created_by      UUID,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── FACTURES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id  UUID REFERENCES reservations(id) ON DELETE SET NULL,
  hotel_id        UUID REFERENCES hotels(id) ON DELETE SET NULL,
  invoice_number  TEXT UNIQUE NOT NULL,
  invoice_type    TEXT DEFAULT 'invoice'
    CHECK (invoice_type IN ('invoice','proforma','credit_note','avoir')),
  guest_name      TEXT,
  guest_email     TEXT,
  guest_siret     TEXT,
  issue_date      DATE DEFAULT CURRENT_DATE,
  due_date        DATE,
  total_ht        DECIMAL(12,2),
  total_tva       DECIMAL(12,2),
  total_ttc       DECIMAL(12,2),
  status          TEXT DEFAULT 'draft'
    CHECK (status IN ('draft','sent','paid','cancelled','overdue')),
  pdf_url         TEXT,
  xml_url         TEXT,
  pdp_status      TEXT,
  pdp_reference   TEXT,
  notes           TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── AVOIRS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS avoirs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      UUID REFERENCES invoices(id) ON DELETE SET NULL,
  reservation_id  UUID REFERENCES reservations(id) ON DELETE SET NULL,
  hotel_id        UUID REFERENCES hotels(id) ON DELETE SET NULL,
  avoir_number    TEXT UNIQUE NOT NULL,
  amount          DECIMAL(12,2) NOT NULL,
  reason          TEXT NOT NULL,
  status          TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','applied','refunded')),
  created_by      UUID,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── MÉNAGE ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS room_cleaning_tasks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id          UUID REFERENCES rooms(id) ON DELETE CASCADE,
  room_num         TEXT,
  hotel_id         UUID REFERENCES hotels(id) ON DELETE SET NULL,
  assigned_to      UUID REFERENCES staff_members(id) ON DELETE SET NULL,
  assigned_name    TEXT,
  task_type        TEXT DEFAULT 'cleaning',
  priority         TEXT DEFAULT 'normal',
  status           TEXT DEFAULT 'pending',
  scheduled_date   DATE DEFAULT CURRENT_DATE,
  started_at       TIMESTAMP WITH TIME ZONE,
  completed_at     TIMESTAMP WITH TIME ZONE,
  duration_minutes INT,
  notes            TEXT,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── PLANNING PERSONNEL ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff_schedules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id    UUID REFERENCES staff_members(id) ON DELETE CASCADE,
  hotel_id    UUID REFERENCES hotels(id) ON DELETE SET NULL,
  shift_date  DATE NOT NULL,
  shift_start TIME NOT NULL,
  shift_end   TIME NOT NULL,
  post        TEXT,
  status      TEXT DEFAULT 'scheduled',
  notes       TEXT,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── MAINTENANCE ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS maintenance_tasks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id       UUID REFERENCES hotels(id) ON DELETE CASCADE,
  room_id        UUID REFERENCES rooms(id) ON DELETE SET NULL,
  title          TEXT NOT NULL,
  description    TEXT,
  task_type      TEXT,
  priority       TEXT DEFAULT 'normal',
  assigned_to    UUID REFERENCES staff_members(id) ON DELETE SET NULL,
  scheduled_date DATE,
  completed_date DATE,
  status         TEXT DEFAULT 'pending',
  cost           DECIMAL(10,2),
  notes          TEXT,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── CAISSE ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cash_register (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id         UUID REFERENCES hotels(id) ON DELETE SET NULL,
  transaction_date DATE DEFAULT CURRENT_DATE,
  transaction_type TEXT NOT NULL
    CHECK (transaction_type IN ('cash_in','cash_out','opening','closing')),
  amount           DECIMAL(10,2) NOT NULL,
  category         TEXT,
  description      TEXT,
  reservation_id   UUID REFERENCES reservations(id) ON DELETE SET NULL,
  user_id          UUID,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── OBJETS TROUVÉS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lost_found_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id    UUID REFERENCES hotels(id) ON DELETE SET NULL,
  room_num    TEXT,
  description TEXT NOT NULL,
  found_by    TEXT,
  found_date  DATE DEFAULT CURRENT_DATE,
  status      TEXT DEFAULT 'stored',
  claimed_by  TEXT,
  claimed_at  TIMESTAMP WITH TIME ZONE,
  storage_loc TEXT,
  photo_url   TEXT,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── ALERTES ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id   UUID REFERENCES hotels(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  message    TEXT,
  priority   TEXT DEFAULT 'normal',
  is_read    BOOLEAN DEFAULT false,
  related_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── DOCUMENTS & JOURNAL ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  hotel_id       UUID,
  event_type     TEXT,
  description    TEXT,
  user_id        UUID,
  user_email     TEXT,
  file_name      TEXT,
  file_path      TEXT,
  file_size      INT,
  mime_type      TEXT,
  expires_at     TIMESTAMP WITH TIME ZONE,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── COMPTAGE CAISSE ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cash_counts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID REFERENCES hotels(id) ON DELETE SET NULL,
  counts       JSONB,
  total_caisse DECIMAL(10,2),
  fdc          DECIMAL(10,2),
  ecart        DECIMAL(10,2),
  user_id      TEXT,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── CONFORMITÉ FISCALE ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_pdp_status (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id       UUID REFERENCES invoices(id) ON DELETE CASCADE,
  status           TEXT CHECK (status IN ('sent','accepted','rejected','pending')),
  response_payload JSONB,
  error_message    TEXT,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pdp_exchange_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id       UUID REFERENCES invoices(id) ON DELETE SET NULL,
  request_payload  JSONB NOT NULL,
  response_payload JSONB,
  http_status      INT,
  duration_ms      INT,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ereporting_batches (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id          UUID REFERENCES hotels(id) ON DELETE SET NULL,
  period            DATE NOT NULL,
  generated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  file_path         TEXT,
  file_format       TEXT DEFAULT 'csv',
  status            TEXT DEFAULT 'generated',
  total_amount      DECIMAL(12,2),
  transaction_count INT
);

-- ─── INDEX DE PERFORMANCE ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_res_checkin        ON reservations(check_in);
CREATE INDEX IF NOT EXISTS idx_res_checkout       ON reservations(check_out);
CREATE INDEX IF NOT EXISTS idx_res_status         ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_res_source         ON reservations(source);
CREATE INDEX IF NOT EXISTS idx_res_guest_id       ON reservations(guest_id);
CREATE INDEX IF NOT EXISTS idx_res_dates          ON reservations(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_res_hotel          ON reservations(hotel_id);
CREATE INDEX IF NOT EXISTS idx_res_reference      ON reservations(reference);
CREATE INDEX IF NOT EXISTS idx_pay_reservation    ON payments(reservation_id);
CREATE INDEX IF NOT EXISTS idx_pay_date           ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_pay_method         ON payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_prest_reservation  ON prestations(reservation_id);
CREATE INDEX IF NOT EXISTS idx_prest_family       ON prestations(family);
CREATE INDEX IF NOT EXISTS idx_prest_date         ON prestations(prestation_date);
CREATE INDEX IF NOT EXISTS idx_guests_email       ON guests(email);
CREATE INDEX IF NOT EXISTS idx_guests_country     ON guests(country);
CREATE INDEX IF NOT EXISTS idx_rooms_status       ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_hotel        ON rooms(hotel_id);
CREATE INDEX IF NOT EXISTS idx_inv_status         ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_clean_room         ON room_cleaning_tasks(room_id);
CREATE INDEX IF NOT EXISTS idx_clean_date         ON room_cleaning_tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_alerts_hotel       ON alerts(hotel_id);
CREATE INDEX IF NOT EXISTS idx_alerts_read        ON alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_docs_reservation   ON documents(reservation_id);
CREATE INDEX IF NOT EXISTS idx_pdp_logs_date      ON pdp_exchange_logs(created_at DESC);

-- ─── VUES RAPPORTS ───────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_exp01_occupation AS
SELECT
  COUNT(DISTINCT r.id) AS occupied_rooms,
  (SELECT COUNT(*) FROM rooms WHERE active = true) AS total_rooms,
  ROUND(COUNT(DISTINCT r.id) * 100.0 / NULLIF((SELECT COUNT(*) FROM rooms WHERE active = true), 0), 1) AS to_pct,
  COUNT(CASE WHEN r.check_in = CURRENT_DATE THEN 1 END) AS arrivals_today,
  COUNT(CASE WHEN r.check_out = CURRENT_DATE THEN 1 END) AS departures_today
FROM reservations r
WHERE r.check_in <= CURRENT_DATE
  AND r.check_out > CURRENT_DATE
  AND r.status IN ('confirmed','checked_in');

CREATE OR REPLACE VIEW v_exp09_noshow AS
SELECT r.id, r.reference, r.guest_name, r.check_in, r.check_out,
       r.source AS canal, r.total_amount AS montant_perdu, r.status
FROM reservations r
WHERE r.status = 'no_show'
   OR (r.check_in < CURRENT_DATE AND r.checkin_status = 'pending' AND r.status = 'confirmed')
ORDER BY r.check_in DESC;

CREATE OR REPLACE VIEW v_exp10_departures AS
SELECT r.id, r.reference, r.room_number, r.guest_name,
       r.check_in, r.check_out, r.status, r.solde
FROM reservations r
WHERE r.check_out = CURRENT_DATE AND r.status NOT IN ('cancelled','no_show')
ORDER BY r.room_number;

CREATE OR REPLACE VIEW v_sta01_dashboard AS
SELECT
  COUNT(*) AS total_reservations,
  SUM(total_amount) AS ca_total,
  SUM(paid_amount) AS ca_encaisse,
  SUM(COALESCE(solde,0)) AS ca_impaye,
  ROUND(AVG(total_amount / NULLIF(nights, 0)), 2) AS adr,
  SUM(nights) AS total_nights,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancellations,
  COUNT(CASE WHEN status = 'no_show' THEN 1 END) AS no_shows
FROM reservations;

CREATE OR REPLACE VIEW v_sta05_channels AS
SELECT COALESCE(source, 'Direct') AS canal,
       COUNT(*) AS bookings, SUM(total_amount) AS revenue,
       ROUND(SUM(total_amount) * 100.0 / NULLIF(SUM(SUM(total_amount)) OVER (), 0), 1) AS share_pct
FROM reservations GROUP BY canal ORDER BY revenue DESC;

CREATE OR REPLACE VIEW v_sta06_nationalities AS
SELECT COALESCE(g.country, 'FR') AS country,
       COUNT(DISTINCT r.id) AS reservations,
       SUM(r.nights) AS total_nights, SUM(r.total_amount) AS revenue
FROM reservations r LEFT JOIN guests g ON r.guest_id = g.id
GROUP BY country ORDER BY revenue DESC;

CREATE OR REPLACE VIEW v_fin02_payments AS
SELECT payment_method, COUNT(*) AS nb_transactions, SUM(amount) AS total_amount,
       ROUND(SUM(amount) * 100.0 / NULLIF(SUM(SUM(amount)) OVER (), 0), 1) AS share_pct
FROM payments WHERE status = 'completed'
GROUP BY payment_method ORDER BY total_amount DESC;

CREATE OR REPLACE VIEW v_fin09_tva AS
SELECT DATE_TRUNC('month', prestation_date) AS month, tva_rate,
       SUM(total_amount) AS total_ttc, SUM(tva_amount) AS tva_collected,
       COUNT(*) AS nb_lines
FROM prestations WHERE status != 'cancelled'
GROUP BY month, tva_rate ORDER BY month DESC;

CREATE OR REPLACE VIEW v_cli01_debtors AS
SELECT r.id, r.reference, r.guest_name, r.guest_email,
       r.check_in, r.check_out, r.source AS canal,
       r.total_amount, r.paid_amount, r.solde AS amount_due, r.payment_mode
FROM reservations r
WHERE r.solde > 0 AND r.status NOT IN ('cancelled','no_show')
ORDER BY r.solde DESC;

CREATE OR REPLACE VIEW v_cli05_clv AS
SELECT g.id, g.first_name || ' ' || g.last_name AS full_name,
       g.email, g.country, g.loyalty_level, g.total_stays, g.total_spent,
       CASE WHEN g.total_stays > 0 THEN ROUND(g.total_spent / g.total_stays, 2) ELSE 0 END AS clv
FROM guests g ORDER BY total_spent DESC;

CREATE OR REPLACE VIEW v_dir01_direction AS
SELECT
  (SELECT SUM(total_amount) FROM reservations
   WHERE EXTRACT(MONTH FROM check_in) = EXTRACT(MONTH FROM CURRENT_DATE)) AS ca_month,
  (SELECT ROUND(AVG(total_amount / NULLIF(nights,0)), 2) FROM reservations
   WHERE status NOT IN ('cancelled','no_show')) AS adr,
  (SELECT COUNT(*) FROM reservations WHERE status = 'no_show') AS total_noshow,
  (SELECT COUNT(*) FROM reservations WHERE status = 'cancelled') AS total_cancellations,
  (SELECT SUM(solde) FROM reservations
   WHERE solde > 0 AND status NOT IN ('cancelled','no_show')) AS total_impaye;

-- ─── REALTIME ────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE guests;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
ALTER PUBLICATION supabase_realtime ADD TABLE prestations;
ALTER PUBLICATION supabase_realtime ADD TABLE room_cleaning_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE documents;
ALTER PUBLICATION supabase_realtime ADD TABLE cash_register;
ALTER PUBLICATION supabase_realtime ADD TABLE lost_found_items;
ALTER PUBLICATION supabase_realtime ADD TABLE cash_counts;
ALTER PUBLICATION supabase_realtime ADD TABLE hotels;
ALTER PUBLICATION supabase_realtime ADD TABLE maintenance_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE invoice_pdp_status;

-- ─── DONNÉES DE DÉMONSTRATION ─────────────────────────────────────────────────
INSERT INTO hotels (id, name, city, address, zip, siret, tva_number, city_tax_rate)
VALUES ('00000000-0000-0000-0000-000000000001','Mas Provencal Aix','Aix-en-Provence','12 Cours Mirabeau','13100','000 000 000 00000','FR00 000 000 000',2.65)
ON CONFLICT DO NOTHING;

INSERT INTO rooms (hotel_id, number, type, category, floor, base_price, max_occupancy, status) VALUES
  ('00000000-0000-0000-0000-000000000001','101','Simple','Classique',1,99,1,'occupied'),
  ('00000000-0000-0000-0000-000000000001','102','Double','Classique',1,129,2,'to_clean'),
  ('00000000-0000-0000-0000-000000000001','103','Double','Deluxe',1,149,2,'available'),
  ('00000000-0000-0000-0000-000000000001','104','Twin','Classique',1,129,2,'available'),
  ('00000000-0000-0000-0000-000000000001','201','Suite','Deluxe',2,249,3,'occupied'),
  ('00000000-0000-0000-0000-000000000001','202','Double','Classique',2,129,2,'available'),
  ('00000000-0000-0000-0000-000000000001','203','Suite Premium','Superieure',2,349,4,'occupied'),
  ('00000000-0000-0000-0000-000000000001','204','Double','Classique',2,129,2,'maintenance'),
  ('00000000-0000-0000-0000-000000000001','301','Double Superieure','Deluxe',3,179,2,'available'),
  ('00000000-0000-0000-0000-000000000001','302','Suite','Superieure',3,299,3,'to_clean')
ON CONFLICT DO NOTHING;

INSERT INTO rate_plans (hotel_id, name, code, cancellation_policy) VALUES
  ('00000000-0000-0000-0000-000000000001','Tarif public','BAR','flexible'),
  ('00000000-0000-0000-0000-000000000001','Early Bird -10%','EARLY','modere'),
  ('00000000-0000-0000-0000-000000000001','Non remboursable -15%','NR','non_remboursable'),
  ('00000000-0000-0000-0000-000000000001','Petit-dejeuner inclus','BB','flexible'),
  ('00000000-0000-0000-0000-000000000001','Corporate','CORP','modere')
ON CONFLICT DO NOTHING;

INSERT INTO staff_members (hotel_id, first_name, last_name, role, shift) VALUES
  ('00000000-0000-0000-0000-000000000001','Sophie','Martin','housekeeper','morning'),
  ('00000000-0000-0000-0000-000000000001','Fatima','Khalil','housekeeper','morning'),
  ('00000000-0000-0000-0000-000000000001','Ali','Larabi','reception','morning'),
  ('00000000-0000-0000-0000-000000000001','Marc','Dubois','reception','night'),
  ('00000000-0000-0000-0000-000000000001','Karim','Hassan','maintenance','morning'),
  ('00000000-0000-0000-0000-000000000001','Julie','Petit','restaurant','afternoon')
ON CONFLICT DO NOTHING;

INSERT INTO exchange_rates (currency_from, currency_to, rate, rate_date) VALUES
  ('EUR','USD',1.0842,CURRENT_DATE),('EUR','GBP',0.8601,CURRENT_DATE),
  ('EUR','CHF',0.9312,CURRENT_DATE),('EUR','SAR',4.0658,CURRENT_DATE),
  ('EUR','AED',3.9801,CURRENT_DATE),('EUR','CNY',7.8412,CURRENT_DATE),
  ('EUR','JPY',163.42,CURRENT_DATE)
ON CONFLICT (currency_from, currency_to, rate_date) DO UPDATE SET rate = EXCLUDED.rate;

INSERT INTO guests (id, hotel_id, first_name, last_name, email, phone, country, nationality, segment, loyalty_level, total_spent, total_stays)
VALUES
  ('00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000001','Pierre','Bernard','pierre.bernard@email.fr','+33612345678','FR','Francaise','Leisure','Gold',1250.00,4),
  ('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000001','Sophie','Dubois','sophie.dubois@email.fr','+33698765432','FR','Francaise','Business','Silver',680.00,2),
  ('00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000001','Ali','Larabi','ali.larabi@email.com','+33654321098','DZ','Algerienne','Leisure','Platinum',3200.00,8),
  ('00000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000001','Marie','Martin','marie.martin@email.fr','+33601234567','FR','Francaise','Leisure','Standard',360.00,1)
ON CONFLICT DO NOTHING;

-- Réservations avec UUID + reference lisible
INSERT INTO reservations (id, reference, hotel_id, room_number, guest_id, guest_name, guest_email, check_in, check_out, nights, status, source, total_amount, paid_amount, solde, payment_mode, payment_status, adults, city_tax, cancellation_policy)
VALUES
  ('00000000-0000-0000-0001-000000000001','RES-001','00000000-0000-0000-0000-000000000001','101','00000000-0000-0000-0000-000000000010','Pierre Bernard','pierre.bernard@email.fr','2026-03-23','2026-03-27',4,'checked_out','Direct',480.00,480.00,0.00,'Carte bancaire','paid',2,21.20,'flexible'),
  ('00000000-0000-0000-0001-000000000002','RES-002','00000000-0000-0000-0000-000000000001','103','00000000-0000-0000-0000-000000000011','Sophie Dubois','sophie.dubois@email.fr','2026-04-07','2026-04-10',3,'checked_in','Booking.com',360.00,0.00,360.00,'Carte bancaire','pending',2,15.90,'modere'),
  ('00000000-0000-0000-0001-000000000003','RES-003','00000000-0000-0000-0000-000000000001','201','00000000-0000-0000-0000-000000000012','Ali Larabi','ali.larabi@email.com','2026-04-18','2026-04-25',7,'checked_in','Direct',1750.00,1750.00,0.00,'Virement','paid',2,37.10,'flexible'),
  ('00000000-0000-0000-0001-000000000004','RES-004','00000000-0000-0000-0000-000000000001','102','00000000-0000-0000-0000-000000000013','Marie Martin','marie.martin@email.fr','2026-04-07','2026-04-09',2,'confirmed','Direct',360.00,360.00,0.00,'Carte bancaire','paid',2,10.60,'flexible')
ON CONFLICT DO NOTHING;

INSERT INTO payments (reservation_id, hotel_id, amount, payment_method, payment_type, status) VALUES
  ('00000000-0000-0000-0001-000000000001','00000000-0000-0000-0000-000000000001',480.00,'Carte bancaire','settlement','completed'),
  ('00000000-0000-0000-0001-000000000003','00000000-0000-0000-0000-000000000001',525.00,'Virement','deposit','completed'),
  ('00000000-0000-0000-0001-000000000003','00000000-0000-0000-0000-000000000001',1225.00,'Virement','settlement','completed'),
  ('00000000-0000-0000-0001-000000000004','00000000-0000-0000-0000-000000000001',360.00,'Carte bancaire','settlement','completed')
ON CONFLICT DO NOTHING;

INSERT INTO prestations (reservation_id, hotel_id, family, label, quantity, unit_price, tva_rate, total_amount, tva_amount, prestation_date) VALUES
  ('00000000-0000-0000-0001-000000000001','00000000-0000-0000-0000-000000000001','pdj','Petit-dejeuner adulte',2,18.00,5.5,34.58,1.80,'2026-03-24'),
  ('00000000-0000-0000-0001-000000000001','00000000-0000-0000-0000-000000000001','pdj','Petit-dejeuner adulte',2,18.00,5.5,34.58,1.80,'2026-03-25'),
  ('00000000-0000-0000-0001-000000000003','00000000-0000-0000-0000-000000000001','spa','Massage 60 min',1,85.00,20.0,85.00,14.17,'2026-04-20'),
  ('00000000-0000-0000-0001-000000000003','00000000-0000-0000-0000-000000000001','bar','Bouteille de vin',2,35.00,20.0,70.00,11.67,'2026-04-21'),
  ('00000000-0000-0000-0001-000000000003','00000000-0000-0000-0000-000000000001','restaurant','Menu gastronomique',2,68.00,10.0,136.00,12.36,'2026-04-22'),
  ('00000000-0000-0000-0001-000000000002','00000000-0000-0000-0000-000000000001','room_service','Petit-dejeuner en chambre',2,24.00,5.5,46.11,2.41,'2026-04-08')
ON CONFLICT DO NOTHING;

INSERT INTO alerts (hotel_id, type, title, message, priority) VALUES
  ('00000000-0000-0000-0000-000000000001','payment','Solde impaye RES-002','Sophie Dubois : 360 EUR a encaisser','high'),
  ('00000000-0000-0000-0000-000000000001','cleaning','Menage en attente Ch.102','Chambre 102 a nettoyer avant 14h','normal'),
  ('00000000-0000-0000-0000-000000000001','arrival','Arrivees du jour','2 arrivees prevues aujourd''hui','normal')
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- FIN DU SCHEMA FLOWTYM PMS v2.1
-- Fix v2.1 : reservations.id UUID (cohérence FK) + champ reference TEXT
-- ═══════════════════════════════════════════════════════════════════════════
