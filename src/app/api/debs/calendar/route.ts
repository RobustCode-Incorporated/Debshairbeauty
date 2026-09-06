import { NextRequest, NextResponse } from 'next/server';
import debsPool from '@/lib/debs-db';
import { buildIcsCalendar, type IcsAppointment } from '@/lib/debs-ics';

// No per-service duration exists yet (see debs-catalog.ts) — every event is
// shown as this long until real durations are collected and wired in.
const DEFAULT_DURATION_MINUTES = 60;

type Row = {
  id: string;
  date_time: Date;
  category: string;
  notes: string | null;
  amount_cents: number | null;
  currency: string;
  first_name: string;
  last_name: string;
  phone: string;
};

/**
 * Subscribable iCalendar feed of confirmed, paid appointments — add once to
 * Apple Calendar (File > New Calendar Subscription on Mac, or Settings >
 * Calendar > Accounts > Add Account > Other > Add Subscribed Calendar on
 * iPhone) and it refreshes on its own. Token-gated: this carries client
 * names/phone numbers, so the URL must stay private to the salon.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const expected = process.env.DEBS_CALENDAR_FEED_TOKEN;
  if (!expected || !token || token !== expected) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const result = await debsPool.query<Row>(
    `SELECT a.id, a.date_time, a.category, a.notes, a.amount_cents, a.currency,
            c.first_name, c.last_name, c.phone
       FROM debs_appointments a
       JOIN debs_clients c ON c.id = a.client_id
      WHERE a.payment_status = 'PAID'
      ORDER BY a.date_time ASC`,
  );

  const appointments: IcsAppointment[] = result.rows.map((row) => ({
    id: row.id,
    dateTime: new Date(row.date_time),
    durationMinutes: DEFAULT_DURATION_MINUTES,
    category: row.category,
    notes: row.notes,
    amountCents: row.amount_cents ?? 0,
    currency: row.currency,
    clientFirstName: row.first_name,
    clientLastName: row.last_name,
    clientPhone: row.phone,
  }));

  return new NextResponse(buildIcsCalendar(appointments), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="debs-hair-beauty.ics"',
      'Cache-Control': 'no-store',
    },
  });
}
