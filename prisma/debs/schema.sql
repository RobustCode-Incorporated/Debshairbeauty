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
