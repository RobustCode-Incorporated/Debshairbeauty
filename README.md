# Debs Hair & Beauty

Public site for Debs Hair & Beauty (Bruxelles) — online booking with a Stripe
deposit, a full service catalogue, and a small boutique (perruques, mèches,
produits de beauté) for card-paid pickup-at-salon purchases.

Extracted on 2026-09-01 from Robust Code's shared multi-tenant platform into
its own dedicated repository/deployment for `www.debshairbeauty.com`, so
that this business's code and Stripe account stay fully independent from
any other client's.

## Routes

All page routes are locale-aware (see [Internationalization](#internationalization)
below). French is the default locale and keeps unprefixed URLs; other locales
are prefixed (`/en/...`, `/nl/...`, `/es/...`).

- `/` — redirects to `/debs` (the site now launches directly on the full
  site instead of a "coming soon" announcement).
- `/debs` — the full site: hero, service categories, boutique, gallery,
  team, hours.
- `/debs/prestations` — full 59-item service catalogue, grouped by
  category; each service opens the booking flow pre-filled with its exact
  price.
- `/debs/reservation-confirmee`, `/debs/commande-confirmee` — Stripe
  success-page fallbacks for bookings and boutique orders respectively.

## Internationalization

The site is available in **4 languages**: French (`fr`, default), English
(`en`), Dutch (`nl`) and Spanish (`es`), powered by
[`next-intl`](https://next-intl.dev).

- `src/i18n/routing.ts` — supported locales and default locale
  (`localePrefix: "as-needed"`, so French stays at `/debs` while the others
  live at `/en/debs`, `/nl/debs`, `/es/debs`).
- `src/i18n/navigation.ts` — locale-aware `Link`/`redirect`/`useRouter`/
  `usePathname`, used everywhere instead of the plain `next/link` and
  `next/navigation` equivalents so links and redirects keep (or switch) the
  current locale.
- `src/i18n/request.ts` — loads the matching `messages/<locale>.json`
  dictionary per request.
- `src/proxy.ts` — locale detection/routing (this file replaced
  `middleware.ts` in Next.js 16; same request/response signature).
- `messages/{fr,en,nl,es}.json` — one dictionary per locale. All 4 files
  must have identical keys. This includes the translated labels for the
  service catalogue (`CatalogItems`, `CatalogCategories`), booking
  categories (`ServiceCategories`) and boutique products (`Products`,
  `ProductCategories`) — looked up by the stable French-derived `id` from
  `src/lib/debs-catalog.ts`, `debs-services.ts` and `debs-products.ts`,
  which are otherwise unchanged (those ids are also used for Stripe pricing
  and must stay stable).
- A language switcher lives in `DebsNav` (desktop dropdown + mobile row);
  switching locale keeps the current page.
- The booking/purchase checkout API routes (`/api/debs/checkout`,
  `/api/debs/products/checkout`) receive the current `locale` from the
  client, use it to build the Stripe Checkout page in the right language,
  localize their JSON error messages, and redirect back to the correctly
  localized success/cancel page.

To add a new UI string: add the key to all 4 `messages/*.json` files (same
path in each), then read it with `useTranslations`/`getTranslations`.

## Stack

- Next.js 16 (App Router), React 19, Tailwind CSS 4, Framer Motion.
- `next-intl` for the French/English/Dutch/Spanish i18n described above.
- Stripe Checkout for both bookings (deposit) and boutique orders
  (immediate full payment, pickup at the salon — no shipping, no PayPal
  yet).
- PostgreSQL (`pg`, no ORM) — a Neon database dedicated to Debs, reachable
  only via `DEBS_DATABASE_URL`. Apply/update the schema with
  `npm run db:debs:migrate` (idempotent, see `prisma/debs/schema.sql`).

`npm run dev` runs webpack instead of Turbopack — this machine's native
Turbopack bindings weren't available when the project was set up. Remove
`--webpack` from the `dev` script if that's not the case for you.

## Environment variables

See `.env.example`. None of them are committed — `.env` stays local, and
Vercel holds the production values.

## Product catalogue

`src/lib/debs-products.ts` currently ships **placeholder** boutique
products (`placeholder: true`) — invented names/sizes/prices so the buy
flow could be built and tested end-to-end. The buy button stays disabled
and the checkout API refuses the order (409) for any product still flagged
`placeholder: true`. To publish a real product: fill in its real data and
flip `placeholder` to `false` — no other code change needed.

## What didn't come along from the shared platform

This repo intentionally excludes everything specific to Robust Code's other
client on that platform (Hag & Ink): its CEO/manager dashboards, payroll,
treasury, HR, lottery, FlexPay integration, and Prisma-backed main database.
Debs never used any of that — its own data access is a plain `pg` pool
against its own database, no Prisma client involved.

See `ROADMAP.md` for what's built, what's still placeholder, and what's
planned next (boutique with a real catalogue, PayPal, real time-slot
booking, syncing confirmed appointments to the owner's calendars).
