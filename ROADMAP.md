# Roadmap — Debs Hair & Beauty

This repo was extracted on 2026-09-01 from Robust Code's shared multi-tenant
platform into its own dedicated repository, so Debs Hair Beauty's code,
database, and Stripe account stay fully independent from any other client's.
See `README.md` for what "extracted" dropped.

## Phase 1 — Public page

**Status: implemented**

- `src/app/debs/page.tsx`: light/marble/gold page, content sourced from the
  salon's Treatwell listing (services, prices, hours, address, rating).
- Booking form collects name/phone/service category/date/time/notes,
  validates opening days (mardi–samedi) and future date/time client-side.

## Phase 2 — Real booking persistence

**Status: implemented**

- `prisma/debs/schema.sql` — DDL for `debs_staff`, `debs_clients`,
  `debs_appointments`, `debs_orders` (UUID ids). Applied with
  `npm run db:debs:migrate` (`prisma/debs/migrate.ts`), idempotent. No ORM —
  `src/lib/debs-db.ts` is a plain `pg` `Pool` reading `DEBS_DATABASE_URL`.
- Seeded staff: Déborah — "Coiffeuse, esthéticienne, maquilleuse".

## Phase 3 — Stripe deposit checkout

**Status: implemented**

Every booking requires payment to exist at all — no "book now, pay later"
path. The deposit is each category's starting price (`minPriceEuros` in
`src/lib/debs-services.ts`), or the exact price when booking a specific
catalogue service (`src/lib/debs-catalog.ts`).

- `POST /api/debs/checkout` — validates the form, looks up the amount
  server-side (never trusts a client-sent amount), creates a Stripe
  Checkout Session, returns the hosted-checkout `url`.
- No appointment row is written until payment actually succeeds.
- `POST /api/debs/checkout/webhook` — verifies the Stripe signature
  (`DEBS_STRIPE_WEBHOOK_SECRET`), fulfills via `src/lib/debs-checkout.ts`.
- `GET /api/debs/checkout/confirm?session_id=…` — same fulfillment, called
  from `/debs/reservation-confirmee` as a fallback so the browser never has
  to wait on the async webhook; unique constraint on
  `debs_appointments.stripe_session_id` makes both callers idempotent.

**Still needed before this actually charges anyone:**
`DEBS_STRIPE_SECRET_KEY` and `DEBS_STRIPE_WEBHOOK_SECRET` in the deployment
env. Until set, `/api/debs/checkout` returns a clear 503 and the booking
button shows "Le paiement par carte n'est pas encore configuré."

## Phase 4 — Full catalogue, boutique, real availability, calendar sync

### 4.1 Full service catalogue

**Status: implemented**

- `src/lib/debs-catalog.ts` — full transcription of the paper price list
  (10 categories, 59 services, exact price or "à.p.d" when the printed
  price is a starting price). **Have Déborah verify it before treating it
  as billing-accurate** — a transcription error here is a real charge.
- `/debs/prestations` lists all 10 categories; each service is clickable,
  opens the booking flow pre-filled with that exact service and price
  (`POST /api/debs/checkout` accepts an optional `serviceId` alongside the
  existing `category`; server-side price lookup either way).

### 4.2 Boutique — perruques, mèches (tailles), produits de beauté

**Status: implemented with placeholder products — real purchases blocked until the real catalogue is supplied**

- `src/lib/debs-products.ts` — **every entry today is a placeholder**
  (`placeholder: true`): invented names/sizes/prices so the buy flow could
  be built and tested end-to-end.
- Double lock while `placeholder: true`: the "Acheter" button is disabled
  in the UI ("Bientôt disponible") **and** `POST /api/debs/products/checkout`
  refuses the order server-side (409) even if called directly.
- Full payment circuit, ready the moment a product flips to
  `placeholder: false` with a real price: `POST /api/debs/products/checkout`
  (server-priced) → Stripe Checkout (immediate full payment, pickup at the
  salon, no shipping) → the shared webhook (`/api/debs/checkout/webhook`,
  which branches on `metadata.kind`) → `debs_orders` →
  `/debs/commande-confirmee` with a WhatsApp confirmation link.
- Stripe only for now — **PayPal still to do**, needs a PayPal Business
  merchant account (Client ID + Secret).

**To publish a real product:** edit its entry in `debs-products.ts` (name,
variant, price, real photo) and flip `placeholder` to `false`. Nothing else
to change.

### 4.3 Real time slots with locking ("a taken slot disappears")

**Status: planned**

Today the booking form lets anyone pick any future date/time on an open
day — nothing stops two clients from paying for the same slot. This needs:

- A duration per service (currently absent from `debs-catalog.ts` and
  `debs-services.ts`) — without it there's no way to know how long a slot
  stays occupied. Needs confirming from Déborah, service by service (or at
  least by category, as a reasonable approximation).
- `GET /api/debs/availability?date=...` — free slots = opening hours minus
  already-`CONFIRMED` appointments that day.
- Replace the free-text date/time fields with a real slot grid (e.g. 30-min
  increments) that stops showing a slot the moment it's taken.
- A server-side guard at payment-confirmation time to catch the race where
  two people pay for the same slot before either session expires — needs
  an explicit decision (auto-refund + message, or first-paid-wins), not
  left to chance.

### 4.4 Syncing confirmed appointments to the owner's calendars

**Status: planned — blocked on access**

Every **paid and confirmed** appointment should push to three places:

1. **Apple (iOS) Calendar** — via CalDAV directly on the owner's iCloud
   account. Needs an app-specific password generated at id.apple.com for
   her Apple ID, stored as a server secret.
2. **Her email's calendar** — attaching a standard `.ics`/`VEVENT` invite
   to a confirmation email. Universal format (Gmail, Outlook, iCloud Mail
   all offer "Add to calendar"). No email sending exists in this repo yet
   (WhatsApp is the only confirmation channel today) — needs a
   transactional email provider (e.g. Resend) and a verified sending
   address.
3. **A third stack, recommended: Google Calendar.** Mature REST API with a
   real free/busy endpoint, and the owner can add her Google account to
   her iPhone's Calendar app alongside iCloud for redundancy if the CalDAV
   sync ever has an issue. Needs a Google Cloud project + credentials and a
   calendar shared with that account.

**Important design decision:** these three pushes are one-way
notifications, fired *after* a payment succeeds, best-effort (failure
logged, booking not rolled back). Real slot availability (4.3) keeps
resting on `debs_appointments`, not on these external APIs — depending on
three external services for a live "is this slot free" check would make
checkout fragile.

### 4.5 What's needed from Déborah before building the rest (blocking)

- **Boutique**: real product list (perruques, mèches by size, produits de
  beauté), prices, photos, stock policy. Pickup at the salon only —
  decided, no shipping, no address to collect.
- **PayPal**: merchant account credentials (Client ID + Secret).
- **Durations**: per-service (or at least per-category) duration, to build
  the slot grid.
- **Apple Calendar**: her Apple ID + an app-specific password (generated at
  id.apple.com, never her main password).
- **Email**: the address to use for invites, + agreement to add a
  transactional email provider to the project.
- **Google Calendar**: confirmation it's fine as the third channel (or a
  different preference), + access to create/share a calendar.
- Confirmation of `DEBS_STRIPE_SECRET_KEY` / `DEBS_STRIPE_WEBHOOK_SECRET` —
  still needed, catalogue checkout is wired but returns 503 without them.

### 4.6 Suggested build order

1. ~~Full catalogue~~ — done.
2. ~~Boutique (structure + Stripe + guardrails)~~ — done with placeholder
   products; just needs Déborah's real catalogue to actually go on sale.
3. Per-service durations → real slots with locking — independent of the
   rest, build as soon as durations arrive.
4. External calendar sync — once Apple/email/Google access arrives; only
   useful once 3 is in place.
5. PayPal — once merchant credentials arrive, alongside Stripe on the
   boutique.

## Phase 5 — Own domain, announcement page, production

Requested 2026-09-01: the `www.debshairbeauty.com` domain is owned, a page
should announce the site while the full launch isn't ready, and the project
needed its own GitHub repo + Vercel deployment, named `Debshairbeauty`.

**Status: implemented**

- `src/app/page.tsx` is the "coming soon" announcement — that's what's live
  at the domain root today. `/debs` (the full real site) stays reachable
  directly for preview/testing in the meantime.
- To launch fully at the root later: replace `src/app/page.tsx`'s content
  with a redirect to `/debs` (or move `/debs`'s content up to `/`).
- This repo has no `proxy.ts`/`middleware.ts` at all — unlike the shared
  platform it was extracted from (which needs host-based routing because
  one deployment serves multiple businesses), this deployment is dedicated
  to a single domain, so there's nothing to branch on.
- GitHub repo and Vercel project both named `Debshairbeauty`, both
  **private** — this codebase includes real business logic (Stripe
  checkout secrets excluded, but the code itself isn't meant to be public).
  No secrets are committed; `.env` stays local, Vercel holds the production
  values.
- Connecting `www.debshairbeauty.com`'s DNS to the Vercel project is a
  manual step at the domain registrar, done once the Vercel deployment is
  confirmed working.

## Explicitly not planned

- Sharing a database, schema, or payment provider with any other business.
- FlexPay, in any form — Stripe (and later PayPal) are the only payment
  providers here.
- Any AI/analytics feature work before there's enough appointment history
  to analyze.
