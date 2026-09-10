import { NextRequest, NextResponse } from 'next/server';
import debsPool from '@/lib/debs-db';
import { isDebsAdminAuthorized } from '@/lib/debs-admin-auth';

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
