import { NextRequest, NextResponse } from 'next/server';
import debsPool from '@/lib/debs-db';
import { isDebsAdminAuthorized } from '@/lib/debs-admin-auth';
import { getDebsCategory } from '@/lib/debs-services';
import { brusselsDateTimeToUtc } from '@/lib/debs-timezone';

const INTL_PHONE_RE = /^\+\d{7,15}$/;

type CreateBody = {
  firstName: unknown;
  lastName: unknown;
  phone: unknown;
  categoryId: unknown;
  date: unknown;
  time: unknown;
  notes?: unknown;
  email?: unknown;
};

function asNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

type Row = {
  id: string;
  date_time: Date;
  category: string;
  notes: string | null;
  amount_cents: number | null;
  currency: string;
  payment_status: string;
  stripe_payment_intent_id: string | null;
  first_name: string;
  last_name: string;
  phone: string;
};

/** Upcoming confirmed appointments for Déborah's cancel-appointment admin page. */
export async function GET(request: NextRequest) {
  if (!isDebsAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const result = await debsPool.query<Row>(
    `SELECT a.id, a.date_time, a.category, a.notes, a.amount_cents, a.currency,
            a.payment_status, a.stripe_payment_intent_id,
            c.first_name, c.last_name, c.phone
       FROM debs_appointments a
       JOIN debs_clients c ON c.id = a.client_id
      WHERE a.status = 'CONFIRMED'
        AND a.date_time >= now()
      ORDER BY a.date_time ASC`,
  );

  return NextResponse.json({
    appointments: result.rows.map((row) => ({
      id: row.id,
      dateTime: row.date_time,
      category: row.category,
      notes: row.notes,
      amountCents: row.amount_cents,
      currency: row.currency,
      clientFirstName: row.first_name,
      clientLastName: row.last_name,
      clientPhone: row.phone,
      paymentStatus: row.payment_status,
      stripePaymentIntentId: row.stripe_payment_intent_id,
    })),
  });
}

/**
 * Records a phone/walk-in booking Déborah already agreed to directly, with
 * no payment collected — same slot-blocking effect as a paid booking (see
 * fulfillDebsCheckout in src/lib/debs-checkout.ts, which this mirrors), just
 * without the Stripe leg. payment_status='PENDING' is otherwise never
 * inserted anywhere else in this app, so it doubles here as "no payment was
 * collected for this appointment" without needing a schema change.
 */
export async function POST(request: NextRequest) {
  if (!isDebsAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const firstName = asNonEmptyString(body.firstName);
  const lastName = asNonEmptyString(body.lastName);
  const phone = asNonEmptyString(body.phone);
  const categoryId = asNonEmptyString(body.categoryId);
  const date = asNonEmptyString(body.date);
  const time = asNonEmptyString(body.time);
  const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
  const email = asNonEmptyString(body.email);

  if (!firstName || !lastName || !phone || !categoryId || !date || !time) {
    return NextResponse.json({ error: 'Champs requis manquants.' }, { status: 400 });
  }
  if (!INTL_PHONE_RE.test(phone)) {
    return NextResponse.json({ error: 'Numéro de téléphone invalide.' }, { status: 400 });
  }
  const category = getDebsCategory(categoryId);
  if (!category) {
    return NextResponse.json({ error: 'Catégorie inconnue.' }, { status: 400 });
  }
  const dateTime = brusselsDateTimeToUtc(date, time);
  if (Number.isNaN(dateTime.getTime())) {
    return NextResponse.json({ error: 'Date ou heure invalide.' }, { status: 400 });
  }

  const existingAtSlot = await debsPool.query(
    "SELECT 1 FROM debs_appointments WHERE date_time = $1 AND status != 'CANCELLED'",
    [dateTime.toISOString()],
  );
  if (existingAtSlot.rows.length > 0) {
    return NextResponse.json({ error: 'Ce créneau est déjà pris.' }, { status: 409 });
  }

  const clientResult = await debsPool.query<{ id: string }>(
    `INSERT INTO debs_clients (first_name, last_name, phone)
     VALUES ($1, $2, $3)
     ON CONFLICT (phone) DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name
     RETURNING id`,
    [firstName, lastName, phone],
  );
  const clientId = clientResult.rows[0].id;

  const staffResult = await debsPool.query<{ id: string }>(
    'SELECT id FROM debs_staff ORDER BY first_name ASC LIMIT 1',
  );
  const staffId = staffResult.rows[0]?.id ?? null;

  try {
    const appointmentResult = await debsPool.query<{ id: string }>(
      `INSERT INTO debs_appointments
         (date_time, category, notes, status, client_id, staff_id, payment_status, currency, email, locale)
       VALUES ($1, $2, $3, 'CONFIRMED', $4, $5, 'PENDING', 'eur', $6, 'fr')
       RETURNING id`,
      [dateTime.toISOString(), category.id, notes || null, clientId, staffId, email],
    );
    return NextResponse.json({ ok: true, appointmentId: appointmentResult.rows[0].id });
  } catch (error) {
    const isSlotConflict = (error as { code?: string; constraint?: string }).code === '23505'
      && (error as { constraint?: string }).constraint === 'debs_appointments_date_time_key';
    if (isSlotConflict) {
      return NextResponse.json({ error: 'Ce créneau est déjà pris.' }, { status: 409 });
    }
    throw error;
  }
}
