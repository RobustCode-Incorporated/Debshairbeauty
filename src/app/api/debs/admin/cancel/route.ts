import { NextRequest, NextResponse } from 'next/server';
import debsPool from '@/lib/debs-db';
import { getDebsStripe } from '@/lib/debs-stripe';
import { isDebsAdminAuthorized } from '@/lib/debs-admin-auth';

type CancelBody = {
  appointmentId: unknown;
};

type CancelledRow = {
  date_time: Date;
  payment_status: string;
  amount_cents: number | null;
  currency: string;
  stripe_payment_intent_id: string | null;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FULL_REFUND_WINDOW_MS = 24 * 60 * 60 * 1000;

type RefundOutcome =
  | { outcome: 'not_applicable' }
  | { outcome: 'refunded'; stripeRefundId: string }
  | { outcome: 'failed'; stripePaymentIntentId: string | null };

/**
 * Cancels one appointment and, when eligible, refunds its Stripe deposit.
 * The DB is always updated to CANCELLED first: if the refund call then
 * fails, the only inconsistent state is "correctly shows cancelled, refund
 * pending manual follow-up in Stripe" — never a stale CONFIRMED row for an
 * appointment the client was already told (by phone) is cancelled.
 */
export async function POST(request: NextRequest) {
  if (!isDebsAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let body: CancelBody;
  try {
    body = (await request.json()) as CancelBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const appointmentId = typeof body.appointmentId === 'string' ? body.appointmentId.trim() : '';
  if (!appointmentId || !UUID_RE.test(appointmentId)) {
    return NextResponse.json({ error: 'Invalid appointmentId.' }, { status: 400 });
  }

  const updateResult = await debsPool.query<CancelledRow>(
    `UPDATE debs_appointments
        SET status = 'CANCELLED', cancelled_at = now()
      WHERE id = $1 AND status = 'CONFIRMED'
      RETURNING date_time, payment_status, amount_cents, currency, stripe_payment_intent_id`,
    [appointmentId],
  );

  const cancelled = updateResult.rows[0];
  if (!cancelled) {
    const existing = await debsPool.query('SELECT id FROM debs_appointments WHERE id = $1', [appointmentId]);
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Appointment not found.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Appointment is not currently confirmed.' }, { status: 409 });
  }

  const refundEligible =
    cancelled.payment_status === 'PAID' &&
    Boolean(cancelled.stripe_payment_intent_id) &&
    new Date(cancelled.date_time).getTime() - Date.now() >= FULL_REFUND_WINDOW_MS;

  let refund: RefundOutcome = { outcome: 'not_applicable' };

  if (refundEligible) {
    const paymentIntentId = cancelled.stripe_payment_intent_id!;
    const stripe = getDebsStripe();
    if (!stripe) {
      console.error(`[DEBS_CANCEL_REFUND_FAILED] appointment ${appointmentId}: Stripe not configured.`);
      refund = { outcome: 'failed', stripePaymentIntentId: paymentIntentId };
    } else {
      try {
        const stripeRefund = await stripe.refunds.create(
          { payment_intent: paymentIntentId },
          { idempotencyKey: `debs-cancel-refund-${appointmentId}` },
        );
        await debsPool.query(
          'UPDATE debs_appointments SET refunded_at = now(), stripe_refund_id = $2 WHERE id = $1',
          [appointmentId, stripeRefund.id],
        );
        refund = { outcome: 'refunded', stripeRefundId: stripeRefund.id };
      } catch (error) {
        console.error(
          `[DEBS_CANCEL_REFUND_FAILED] appointment ${appointmentId} (payment_intent ${paymentIntentId}, ` +
            `${cancelled.amount_cents} ${cancelled.currency}) — needs a manual refund in the Stripe dashboard:`,
          error,
        );
        refund = { outcome: 'failed', stripePaymentIntentId: paymentIntentId };
      }
    }
  }

  return NextResponse.json({ ok: true, status: 'CANCELLED', refund });
}
