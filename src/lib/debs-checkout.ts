import Stripe from 'stripe';
import debsPool from '@/lib/debs-db';

export type DebsCheckoutMetadata = {
  firstName: string;
  lastName: string;
  phone: string;
  category: string;
  date: string;
  time: string;
  notes: string;
};

export type DebsFulfillmentResult = {
  appointmentId: string;
  whatsappUrl: string | null;
  firstName: string;
  category: string;
  date: string;
  time: string;
};

function normalizeWhatsappNumber(input: string): string {
  return input.replace(/[^\d]/g, '');
}

function buildWhatsappUrl(appointmentId: string, meta: DebsCheckoutMetadata, staff: { first_name: string; last_name: string }): string | null {
  if (!process.env.DEBS_WHATSAPP_NUMBER) return null;
  const digits = normalizeWhatsappNumber(process.env.DEBS_WHATSAPP_NUMBER);
  if (!digits) return null;

  const message = [
    '*Reservation payee - Debs Hair Beauty*',
    `- Nom: ${meta.firstName} ${meta.lastName}`,
    `- Telephone: ${meta.phone}`,
    `- Prestation: ${meta.category}`,
    `- Date: ${meta.date}`,
    `- Heure: ${meta.time}`,
    `- Coiffeuse/Estheticienne assignee: ${staff.first_name} ${staff.last_name}`.trimEnd(),
    `- ID reservation: ${appointmentId}`,
    meta.notes ? `- Notes: ${meta.notes}` : null,
    '- Acompte deja regle par carte (Stripe).',
  ]
    .filter(Boolean)
    .join('\n');

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/**
 * Idempotent: safe to call from both the Stripe webhook and the success-page
 * fallback for the same session. The unique constraint on stripe_session_id
 * guarantees a single appointment row no matter which caller wins the race.
 */
export async function fulfillDebsCheckout(session: Stripe.Checkout.Session): Promise<DebsFulfillmentResult | null> {
  if (session.payment_status !== 'paid') return null;

  const meta = session.metadata as unknown as DebsCheckoutMetadata | null;
  if (!meta?.firstName || !meta.lastName || !meta.phone || !meta.category || !meta.date || !meta.time) {
    throw new Error(`Debs checkout session ${session.id} is paid but missing booking metadata.`);
  }

  const existing = await debsPool.query<{ id: string }>(
    'SELECT id FROM debs_appointments WHERE stripe_session_id = $1',
    [session.id],
  );
  if (existing.rows[0]) {
    const staffResult = await debsPool.query<{ first_name: string; last_name: string }>(
      `SELECT s.first_name, s.last_name FROM debs_appointments a
       JOIN debs_staff s ON s.id = a.staff_id
       WHERE a.id = $1`,
      [existing.rows[0].id],
    );
    const staff = staffResult.rows[0] ?? { first_name: '', last_name: '' };
    return {
      appointmentId: existing.rows[0].id,
      whatsappUrl: buildWhatsappUrl(existing.rows[0].id, meta, staff),
      firstName: meta.firstName,
      category: meta.category,
      date: meta.date,
      time: meta.time,
    };
  }

  const staffResult = await debsPool.query<{ id: string; first_name: string; last_name: string }>(
    'SELECT id, first_name, last_name FROM debs_staff ORDER BY first_name ASC LIMIT 1',
  );
  const assignedStaff = staffResult.rows[0];
  if (!assignedStaff) {
    throw new Error('No Debs staff configured; cannot fulfil a paid checkout session.');
  }

  const clientResult = await debsPool.query<{ id: string }>(
    `INSERT INTO debs_clients (first_name, last_name, phone)
     VALUES ($1, $2, $3)
     ON CONFLICT (phone) DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name
     RETURNING id`,
    [meta.firstName, meta.lastName, meta.phone],
  );
  const clientId = clientResult.rows[0].id;

  const dateTime = new Date(`${meta.date}T${meta.time}:00`);
  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null;

  const appointmentResult = await debsPool.query<{ id: string }>(
    `INSERT INTO debs_appointments
       (date_time, category, notes, status, client_id, staff_id, payment_status, amount_cents, currency, stripe_session_id, stripe_payment_intent_id)
     VALUES ($1, $2, $3, 'CONFIRMED', $4, $5, 'PAID', $6, $7, $8, $9)
     ON CONFLICT (stripe_session_id) DO NOTHING
     RETURNING id`,
    [
      dateTime.toISOString(),
      meta.category,
      meta.notes || null,
      clientId,
      assignedStaff.id,
      session.amount_total ?? 0,
      session.currency ?? 'eur',
      session.id,
      paymentIntentId,
    ],
  );

  const appointmentId = appointmentResult.rows[0]?.id
    ?? (await debsPool.query<{ id: string }>('SELECT id FROM debs_appointments WHERE stripe_session_id = $1', [session.id])).rows[0].id;

  return {
    appointmentId,
    whatsappUrl: buildWhatsappUrl(appointmentId, meta, assignedStaff),
    firstName: meta.firstName,
    category: meta.category,
    date: meta.date,
    time: meta.time,
  };
}
