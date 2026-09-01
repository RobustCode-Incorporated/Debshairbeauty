# Specification 005 — Debs Hair Beauty client page

## Goal

Give Debs Hair Beauty (Brussels) its own public, client-facing page at `/debs`, built on the same booking-page pattern as `src/app/client/page.tsx` (Hag & Ink) but with a distinct brand identity and a service catalogue sourced from the salon's public Treatwell listing (`https://www.treatwell.be/en/place/debs-hair-beauty-1/`).

This does not modify `/client`. It adds a second, independent public page so Hag & Ink and Debs Salon can each keep their own brand, content, and (eventually) data.

## Source of truth for salon content

Extracted from the Treatwell listing on 2026-08-27:

- **Name:** Debs Hair Beauty
- **Address:** 150A Rue de Laeken, 1000 Bruxelles (Béguinage-Dixmude, ~2 min from Yser metro)
- **Hours:** Mon closed · Tue 10:00–18:00 · Wed–Thu 10:00–19:00 · Fri 10:00–19:30 · Sat 10:00–20:30 · Sun closed
- **Rating:** 4.0/5 (48 avis)
- **Team:** Déborah — coiffeuse, esthéticienne, maquilleuse (4.1/5, 18 avis)
- **Payment:** especes et carte
- **Service categories:** Cheveux, Ongles, Épilation, Visage, Massage, Maquillage (see page for the priced item list per category)
- **Phone / social links:** not published on the Treatwell listing — see Open questions below.

## In scope

- New route `src/app/debs/page.tsx`, self-contained (own fonts, own color system), following the section rhythm of `client/page.tsx` (hero → offering → trust/info → booking → footer) but not its dark barbershop palette.
- Light, marble/gold/emerald visual identity reflecting the salon's real interior (uses the photos already staged in `public/`: `Debs sal.webp`, `download.webp`…`download (11).webp`).
- A services section grouped by the six Treatwell categories, each with a representative item list and the real price range, replacing Hag & Ink's membership/FlexPay cards.
- A booking flow reusing the existing `SlideOver` slide-over pattern: first name, last name, phone (`+<country><digits>` validation, same regex as `/client`), service category, date, time, notes.
- `SlideOver` gains an optional `theme` prop (`"dark"` default, `"light"` added) so it can render on Debs' light page without changing its look on `/client`.
- Footer with the salon's real address, hours table, and a note that booking finalizes over WhatsApp.
- `specs/005-debs-salon-client-page.md` (this file) and `ROADMAP-DEBS-SALON.md`.

## Out of scope (this iteration)

- Writing bookings to the Prisma database. `Appointment`/`Barber`/`Client` currently model Hag & Ink's single business; auto-assigning a Debs booking to a Hag & Ink barber record would corrupt CEO/manager revenue reporting. See Roadmap phase 2.
- A dedicated WhatsApp number, phone number, or social links for Debs — none are published on the Treatwell listing. The booking CTA is wired to an env-configurable number (`NEXT_PUBLIC_DEBS_WHATSAPP_NUMBER`) and degrades to a clear "not yet configured" state if unset, rather than guessing a number.
- Multi-tenant/custom-domain middleware routing (`www.hag-ink.com` handling in `middleware.ts` stays untouched). A future `debs-hair-beauty.*` domain is a roadmap item.
- Fabricated review quotes. The 4.0/5 · 48 avis stat is shown; no invented testimonial text is attributed to named reviewers.
- CEO/manager dashboards, payroll, or lottery — none of these apply to Debs in this iteration.

## Acceptance criteria

1. Visiting `/debs` renders a page with Debs Hair Beauty's name, address, hours, and rating, and none of Hag & Ink's copy, colors, or membership content.
2. All six Treatwell service categories are visible with their real price ranges.
3. Selecting a category opens the booking slide-over pre-filled with that category.
4. Submitting the booking form with an invalid phone (not matching `+\d{7,15}`) blocks submission and shows the same validation message pattern as `/client`.
5. Submitting a valid booking never calls a Hag & Ink API route and never creates a Prisma `Appointment`/`Client` record; it opens `wa.me/<number>` with a prefilled message when `NEXT_PUBLIC_DEBS_WHATSAPP_NUMBER` is configured, and shows a clear "reservation number not yet configured" message otherwise.
6. `/client` renders unchanged (same visual output, same `SlideOver` default look) after the `theme` prop is added.
7. `npm run lint` introduces no new errors on `src/app/debs/page.tsx` or `src/components/SlideOver.tsx` beyond the pre-existing baseline noted in `README.md`.

## Open questions (need the business owner)

- ~~Real WhatsApp/phone number and Instagram handle~~ — resolved, see Update below.
- ~~Whether Debs bookings should live in their own database~~ — resolved, see Update below.
- Deposit/payment policy for bookings, if any (Treatwell listing shows on-site cash/card only, no prepayment).

## Update — 2026-08-27: real persistence and contact info (roadmap phase 2)

- Debs Hair Beauty now has its own PostgreSQL database (Neon), provided by the business owner, entirely separate from any other business's database in this repository — no shared tables, schema, or client.
- `prisma/debs/schema.sql` defines `debs_staff`, `debs_clients`, `debs_appointments`; applied via `npm run db:debs:migrate`. Déborah is seeded as staff.
- `POST /api/debs/appointments` (`src/app/api/debs/appointments/route.ts`) persists bookings to that database and returns a `wa.me` link, using its own `pg` pool (`src/lib/debs-db.ts`) and its own env vars (`DEBS_DATABASE_URL`, `DEBS_WHATSAPP_NUMBER`). It shares no code path, table, or connection with the appointments API used by any other business in this repository.
- `/debs`'s booking form now calls that endpoint instead of building the WhatsApp link client-side; acceptance criterion 5 above is superseded: a valid booking **does** persist now, into the isolated Debs database only, never into another business's tables.
- Real contact info is live: phone/WhatsApp `+32 472 34 19 68`, Instagram `https://www.instagram.com/debs_hair_beauty/`, TikTok `https://www.tiktok.com/@debshairbeautysalon`.

## Update — 2026-08-27: Stripe deposit checkout (roadmap phase 3, payments)

Payment is now mandatory to create a booking at all — every reservation must be paid for; there is no free/unpaid booking path. FlexPay (Hag & Ink's payment provider, Congo mobile-money-oriented) is not used anywhere for Debs; Debs' payment provider is Stripe exclusively, using its own, separate Stripe account credentials (`DEBS_STRIPE_SECRET_KEY`, `DEBS_STRIPE_WEBHOOK_SECRET`).

- The deposit charged is the selected category's starting price (`src/lib/debs-services.ts`), computed server-side — the client never controls the charged amount.
- `POST /api/debs/checkout` creates a Stripe Checkout Session (booking details in `metadata`, nothing written to the database yet) and returns its hosted `url`; `/debs`'s booking form redirects there instead of calling a booking-creation endpoint directly.
- `POST /api/debs/checkout/webhook` and `GET /api/debs/checkout/confirm` both call the same idempotent `fulfillDebsCheckout()` (`src/lib/debs-checkout.ts`), which is the only code path that ever inserts a `debs_appointments` row — and only once `payment_status === 'paid'`.
- The previous `POST /api/debs/appointments` (free booking creation) was removed for contradicting "payment must happen for every reservation."
- New page `/debs/reservation-confirmee` shows the paid confirmation and a WhatsApp continuation link; a `?booking=annulee` return from a cancelled Stripe session shows a dismissible banner on `/debs`.
- `debs_appointments` gained `payment_status`, `amount_cents`, `currency`, `stripe_session_id`, `stripe_payment_intent_id` — applied via `npm run db:debs:migrate`.
- Verified locally: validation paths (bad phone, closed day, missing/invalid category) return correct errors; with no Stripe key configured, checkout creation and the confirmation page both fail closed with a clear "not configured" message rather than a broken or silent flow. Full payment success cannot be tested until real Stripe keys are added — see Roadmap.
