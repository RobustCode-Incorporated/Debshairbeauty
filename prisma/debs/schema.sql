-- Schema for the Debs Hair Beauty database.
--
-- This is its own, fully independent PostgreSQL database, isolated from any
-- other business in this repository. It lives at DEBS_DATABASE_URL and has
-- no foreign keys, shared tables, or shared Prisma/pg client with anything
-- else — Debs Hair Beauty's data never mixes with another business's data.
--
-- Applied with: npx tsx prisma/debs/migrate.ts

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE debs_appointment_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS debs_staff (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name  TEXT NOT NULL,
  role       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS debs_clients (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name  TEXT NOT NULL,
  phone      TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS debs_appointments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_time  TIMESTAMPTZ NOT NULL,
  category   TEXT NOT NULL,
  notes      TEXT,
  status     debs_appointment_status NOT NULL DEFAULT 'PENDING',
  client_id  UUID NOT NULL REFERENCES debs_clients(id) ON DELETE CASCADE,
  staff_id   UUID REFERENCES debs_staff(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS debs_appointments_date_time_idx ON debs_appointments (date_time);
CREATE INDEX IF NOT EXISTS debs_appointments_client_id_idx ON debs_appointments (client_id);

-- Last-resort guard against two payments racing for the same slot (the API
-- already checks and rejects before creating the Stripe session — this is
-- only for the sliver of time between that check and the webhook's insert).
-- Assumes a single stylist handling every booking, true today; the day a
-- second stylist is hired this needs to become UNIQUE (date_time, staff_id)
-- alongside making staff assignment actually availability-aware (currently
-- it always assigns the first staff row — see debs-checkout.ts).
DO $$ BEGIN
  ALTER TABLE debs_appointments ADD CONSTRAINT debs_appointments_date_time_key UNIQUE (date_time);
EXCEPTION
  -- Postgres raises duplicate_table (42P07), not duplicate_object, when the
  -- constraint (and its backing index) already exists — caught this the hard
  -- way re-running the migration after it had already applied once.
  WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

-- A booking only ever exists once its deposit is paid: an appointment row is
-- inserted exclusively by the Stripe checkout fulfillment path (webhook, with
-- a same-idempotency-key fallback on the confirmation page), never before
-- payment succeeds. See src/lib/debs-checkout.ts.
ALTER TABLE debs_appointments ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'PENDING'
  CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED'));
ALTER TABLE debs_appointments ADD COLUMN IF NOT EXISTS amount_cents INTEGER;
ALTER TABLE debs_appointments ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'eur';
ALTER TABLE debs_appointments ADD COLUMN IF NOT EXISTS stripe_session_id TEXT UNIQUE;
ALTER TABLE debs_appointments ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- Product orders (perruques, mèches, produits de beauté) — pickup at the
-- salon only, no shipping address collected. Same "only exists once paid"
-- rule as debs_appointments: a row is inserted exclusively by the Stripe
-- checkout fulfillment path. See src/lib/debs-product-checkout.ts.
CREATE TABLE IF NOT EXISTS debs_orders (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id                UUID NOT NULL REFERENCES debs_clients(id) ON DELETE CASCADE,
  product_id               TEXT NOT NULL,
  product_name             TEXT NOT NULL,
  variant                  TEXT,
  quantity                 INTEGER NOT NULL DEFAULT 1,
  unit_price_cents         INTEGER NOT NULL,
  amount_cents             INTEGER NOT NULL,
  currency                 TEXT NOT NULL DEFAULT 'eur',
  payment_status           TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED')),
  fulfillment_status       TEXT NOT NULL DEFAULT 'PENDING' CHECK (fulfillment_status IN ('PENDING', 'READY_FOR_PICKUP', 'PICKED_UP')),
  notes                    TEXT,
  stripe_session_id        TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS debs_orders_client_id_idx ON debs_orders (client_id);

-- Post-appointment review funnel: a private star rating first (see
-- src/app/[locale]/debs/avis), then only 4-5★ clients are shown the real
-- Google review link — 1-3★ stays private so Déborah can do service
-- recovery instead of it becoming a public bad review. See
-- src/app/api/debs/cron/review-requests and src/app/api/debs/reviews.
ALTER TABLE debs_appointments ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE debs_appointments ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'fr';
ALTER TABLE debs_appointments ADD COLUMN IF NOT EXISTS review_token UUID UNIQUE DEFAULT gen_random_uuid();
ALTER TABLE debs_appointments ADD COLUMN IF NOT EXISTS review_email_sent_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS debs_reviews (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL UNIQUE REFERENCES debs_appointments(id) ON DELETE CASCADE,
  rating         SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin cancellation (src/app/[locale]/debs/admin, src/app/api/debs/admin) —
-- the >=24h-before-appointment full-refund policy decides whether
-- refunded_at gets set. cancelled_at is separate from status so "when"
-- survives even though status is a single enum value.
ALTER TABLE debs_appointments ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE debs_appointments ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;
ALTER TABLE debs_appointments ADD COLUMN IF NOT EXISTS stripe_refund_id TEXT;

-- A cancelled appointment must free its slot for rebooking (rows are never
-- deleted, so the old blanket UNIQUE(date_time) would otherwise block it
-- forever). Replace with a partial unique index scoped to active rows.
-- IMPORTANT: keep the name identical to the dropped constraint —
-- src/lib/debs-checkout.ts's slot-race guard matches on this exact
-- constraint name in the pg error object
-- (error.constraint === 'debs_appointments_date_time_key'); renaming it
-- here would silently break that guard.
ALTER TABLE debs_appointments DROP CONSTRAINT IF EXISTS debs_appointments_date_time_key;
CREATE UNIQUE INDEX IF NOT EXISTS debs_appointments_date_time_key
  ON debs_appointments (date_time) WHERE status != 'CANCELLED';
