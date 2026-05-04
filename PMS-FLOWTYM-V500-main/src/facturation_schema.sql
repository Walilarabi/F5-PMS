-- ═══════════════════════════════════════════════════════════════════════
-- FLOWTYM PMS — MODULE FACTURATION v1.0
-- Conforme DGFIP · TVA multi-taux · Multi-folio · Night Audit
-- ═══════════════════════════════════════════════════════════════════════

-- ── SÉQUENCE NUMÉROTATION (continue, immuable) ──────────────────────────
CREATE SEQUENCE IF NOT EXISTS invoice_seq START 1000 INCREMENT 1;

-- ── TABLE ACCOUNTS (clients / sociétés / OTA) ────────────────────────────
CREATE TABLE IF NOT EXISTS billing_accounts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type          TEXT NOT NULL CHECK (type IN ('client', 'company', 'ota')),
  name          TEXT NOT NULL,
  address       TEXT,
  city          TEXT,
  zip           TEXT,
  country       TEXT DEFAULT 'France',
  email         TEXT,
  phone         TEXT,
  siret         TEXT,
  vat_number    TEXT,
  hotel_id      UUID REFERENCES hotels(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_billing_accounts_hotel ON billing_accounts(hotel_id);
CREATE INDEX idx_billing_accounts_name  ON billing_accounts(name);

-- ── TABLE PRODUCTS (catalogue produits / prestations) ────────────────────
CREATE TABLE IF NOT EXISTS billing_products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  family        TEXT NOT NULL,   -- Hébergement, Restauration, Spa, Services, Taxe, Pénalité
  price_ht      NUMERIC(10,4) NOT NULL DEFAULT 0,
  tva_rate      NUMERIC(5,2) NOT NULL DEFAULT 10,   -- 0, 5.5, 10, 20
  is_active     BOOLEAN DEFAULT TRUE,
  hotel_id      UUID REFERENCES hotels(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_billing_products_hotel  ON billing_products(hotel_id);
CREATE INDEX idx_billing_products_family ON billing_products(family);

-- ── TABLE INVOICES (facture maîtresse) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number  TEXT NOT NULL UNIQUE,   -- FA-2026-0001 (généré par séquence)
  credit_note_for UUID REFERENCES invoices(id),  -- avoir lié
  reservation_id  UUID REFERENCES reservations(id) ON DELETE SET NULL,
  account_id      UUID NOT NULL REFERENCES billing_accounts(id),
  hotel_id        UUID REFERENCES hotels(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'issued', 'paid', 'cancelled', 'credit_note')),
  -- Totaux (dénormalisés pour perf + piste d'audit)
  total_ht        NUMERIC(12,4) DEFAULT 0,
  total_tva       NUMERIC(12,4) DEFAULT 0,
  total_ttc       NUMERIC(12,4) DEFAULT 0,
  paid_amount     NUMERIC(12,4) DEFAULT 0,
  -- Données séjour (snapshot au moment de la création)
  guest_name      TEXT,
  room_id         TEXT,
  checkin_date    DATE,
  checkout_date   DATE,
  nights          INTEGER,
  -- Horodatage immuable
  created_at      TIMESTAMPTZ DEFAULT now(),
  issued_at       TIMESTAMPTZ,  -- figée après émission
  paid_at         TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  -- Piste d'audit DGFIP
  issuer_user_id  UUID,
  issuer_name     TEXT,
  CONSTRAINT invoice_number_format CHECK (invoice_number ~ '^(FA|AV)-\d{4}-\d{4,}$')
);
CREATE INDEX idx_invoices_hotel       ON invoices(hotel_id);
CREATE INDEX idx_invoices_account     ON invoices(account_id);
CREATE INDEX idx_invoices_reservation ON invoices(reservation_id);
CREATE INDEX idx_invoices_status      ON invoices(status);
CREATE INDEX idx_invoices_created     ON invoices(created_at DESC);

-- Trigger : numérotation automatique continue
CREATE OR REPLACE FUNCTION assign_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    IF NEW.status = 'credit_note' THEN
      NEW.invoice_number := 'AV-' || EXTRACT(YEAR FROM now())::TEXT || '-' || LPAD(nextval('invoice_seq')::TEXT, 4, '0');
    ELSE
      NEW.invoice_number := 'FA-' || EXTRACT(YEAR FROM now())::TEXT || '-' || LPAD(nextval('invoice_seq')::TEXT, 4, '0');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invoice_number
BEFORE INSERT ON invoices
FOR EACH ROW EXECUTE FUNCTION assign_invoice_number();

-- Trigger : interdire modification après émission (DGFIP)
CREATE OR REPLACE FUNCTION lock_issued_invoice()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IN ('issued', 'paid', 'cancelled') THEN
    IF NEW.total_ht <> OLD.total_ht
    OR NEW.total_ttc <> OLD.total_ttc
    OR NEW.invoice_number <> OLD.invoice_number THEN
      RAISE EXCEPTION 'Facture émise — modification interdite (DGFIP art. L.123-22). Créez un avoir.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lock_invoice
BEFORE UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION lock_issued_invoice();

-- ── TABLE FOLIOS (sous-comptes de facturation) ───────────────────────────
CREATE TABLE IF NOT EXISTS folios (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  account_id  UUID REFERENCES billing_accounts(id),
  label       TEXT NOT NULL DEFAULT 'Folio Chambre',
  color       TEXT DEFAULT '#8B5CF6',
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_folios_invoice ON folios(invoice_id);

-- ── TABLE INVOICE_LINES (lignes détaillées) ──────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_lines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio_id        UUID NOT NULL REFERENCES folios(id) ON DELETE CASCADE,
  invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  product_code    TEXT NOT NULL,
  family          TEXT,
  description     TEXT NOT NULL,
  quantity        NUMERIC(10,4) NOT NULL DEFAULT 1,
  unit_price_ht   NUMERIC(10,4) NOT NULL DEFAULT 0,
  tva_rate        NUMERIC(5,2) NOT NULL DEFAULT 10,
  total_ht        NUMERIC(12,4) GENERATED ALWAYS AS (quantity * unit_price_ht) STORED,
  total_tva       NUMERIC(12,4) GENERATED ALWAYS AS (quantity * unit_price_ht * tva_rate / 100) STORED,
  total_ttc       NUMERIC(12,4) GENERATED ALWAYS AS (quantity * unit_price_ht * (1 + tva_rate / 100)) STORED,
  source          TEXT DEFAULT 'manual' CHECK (source IN ('night_audit', 'manual', 'pos', 'extra')),
  locked          BOOLEAN DEFAULT FALSE,
  night_audit_date DATE,   -- date de la nuit auditée (pour verrouillage J-1)
  created_at      TIMESTAMPTZ DEFAULT now(),
  created_by      UUID
);
CREATE INDEX idx_lines_folio   ON invoice_lines(folio_id);
CREATE INDEX idx_lines_invoice ON invoice_lines(invoice_id);
CREATE INDEX idx_lines_date    ON invoice_lines(date);
CREATE INDEX idx_lines_source  ON invoice_lines(source);

-- Trigger : verrouiller lignes night_audit après clôture journée
CREATE OR REPLACE FUNCTION lock_past_audit_lines()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.source = 'night_audit' AND NEW.night_audit_date < CURRENT_DATE THEN
    NEW.locked := TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lock_audit_lines
BEFORE INSERT OR UPDATE ON invoice_lines
FOR EACH ROW EXECUTE FUNCTION lock_past_audit_lines();

-- ── TABLE PAYMENTS (paiements multi-modes) ───────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_payments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  amount      NUMERIC(12,4) NOT NULL CHECK (amount > 0),
  method      TEXT NOT NULL CHECK (method IN ('cash', 'card', 'transfer', 'ota', 'check')),
  reference   TEXT,
  note        TEXT,
  status      TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'cancelled')),
  created_at  TIMESTAMPTZ DEFAULT now(),
  created_by  UUID
);
CREATE INDEX idx_payments_invoice ON invoice_payments(invoice_id);
CREATE INDEX idx_payments_date    ON invoice_payments(date DESC);

-- Trigger : mettre à jour paid_amount et statut facture
CREATE OR REPLACE FUNCTION update_invoice_paid()
RETURNS TRIGGER AS $$
DECLARE
  v_total_ttc NUMERIC;
  v_paid      NUMERIC;
BEGIN
  SELECT total_ttc INTO v_total_ttc FROM invoices
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  SELECT COALESCE(SUM(amount), 0) INTO v_paid
  FROM invoice_payments
  WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
    AND status = 'confirmed';

  UPDATE invoices
  SET paid_amount = v_paid,
      status = CASE
        WHEN v_paid >= v_total_ttc THEN 'paid'
        WHEN status = 'draft' THEN 'draft'
        ELSE 'issued'
      END,
      paid_at = CASE WHEN v_paid >= v_total_ttc THEN now() ELSE NULL END
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_paid
AFTER INSERT OR UPDATE OR DELETE ON invoice_payments
FOR EACH ROW EXECUTE FUNCTION update_invoice_paid();

-- ── TABLE NIGHT_AUDIT_LOG (journal des nuits auditées) ───────────────────
CREATE TABLE IF NOT EXISTS night_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id    UUID REFERENCES hotels(id),
  audit_date  DATE NOT NULL,
  status      TEXT DEFAULT 'open' CHECK (status IN ('open', 'locked', 'cancelled')),
  total_rooms INTEGER,
  total_ht    NUMERIC(14,4),
  total_ttc   NUMERIC(14,4),
  run_by      UUID,
  locked_at   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (hotel_id, audit_date)
);

-- ── VUE : Factures avec soldes ───────────────────────────────────────────
CREATE OR REPLACE VIEW v_invoices_summary AS
SELECT
  i.*,
  i.total_ttc - i.paid_amount AS balance,
  ba.name AS account_name,
  ba.type AS account_type,
  ba.siret,
  COUNT(f.id) AS folio_count,
  COUNT(il.id) AS line_count,
  COUNT(ip.id) AS payment_count
FROM invoices i
LEFT JOIN billing_accounts ba ON ba.id = i.account_id
LEFT JOIN folios f ON f.invoice_id = i.id
LEFT JOIN invoice_lines il ON il.invoice_id = i.id
LEFT JOIN invoice_payments ip ON ip.invoice_id = i.id
GROUP BY i.id, ba.name, ba.type, ba.siret;

-- ── VUE : Récapitulatif TVA par facture ──────────────────────────────────
CREATE OR REPLACE VIEW v_invoice_tva AS
SELECT
  il.invoice_id,
  il.tva_rate,
  SUM(il.total_ht)  AS base_ht,
  SUM(il.total_tva) AS tva_amount,
  SUM(il.total_ttc) AS total_ttc
FROM invoice_lines il
GROUP BY il.invoice_id, il.tva_rate;

-- ── RLS (Row Level Security) ─────────────────────────────────────────────
ALTER TABLE invoices          ENABLE ROW LEVEL SECURITY;
ALTER TABLE folios            ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines     ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_accounts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_products  ENABLE ROW LEVEL SECURITY;

-- Politique tenant_id (accès par hôtel uniquement)
CREATE POLICY invoices_hotel_policy ON invoices
  USING (hotel_id = current_setting('app.hotel_id')::UUID);

CREATE POLICY accounts_hotel_policy ON billing_accounts
  USING (hotel_id = current_setting('app.hotel_id')::UUID);

CREATE POLICY products_hotel_policy ON billing_products
  USING (hotel_id = current_setting('app.hotel_id')::UUID);

-- ── DONNÉES INITIALES PRODUITS ───────────────────────────────────────────
INSERT INTO billing_products (code, name, family, price_ht, tva_rate) VALUES
  ('HEB-DBL', 'Nuitée Double',           'Hébergement', 109.09, 10),
  ('HEB-SUI', 'Nuitée Suite',            'Hébergement', 181.82, 10),
  ('HEB-FAM', 'Nuitée Famille',          'Hébergement', 145.45, 10),
  ('RES-PDJ', 'Petit-déjeuner buffet',   'Restauration', 13.27, 10),
  ('RES-DMI', 'Demi-pension',            'Restauration', 35.51, 10),
  ('RES-MIN', 'Minibar',                 'Restauration',  8.18, 10),
  ('SPA-001', 'Soin corps 60min',        'Spa & Bien-être', 76.36, 20),
  ('SPA-002', 'Massage relaxant',        'Spa & Bien-être', 54.55, 20),
  ('PK-001',  'Parking / nuit',          'Services',      13.64, 20),
  ('LIN-001', 'Linge supplémentaire',    'Services',       9.09, 20),
  ('TX-SEJ',  'Taxe de séjour',          'Taxe séjour',    1.60,  0),
  ('NOS-001', 'Frais no-show',           'Pénalité',     109.09, 10),
  ('CAN-001', 'Frais annulation',        'Pénalité',      54.55, 10)
ON CONFLICT (code) DO NOTHING;
