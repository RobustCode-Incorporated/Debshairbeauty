import { NextRequest, NextResponse } from 'next/server';
import debsPool from '@/lib/debs-db';
import { getDaySlots } from '@/lib/debs-hours';
import { utcToBrusselsTime } from '@/lib/debs-timezone';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Which slots are already booked for `date` — used by the booking form to
 * grey out taken times. `POST /api/debs/checkout` is the actual guard
 * against double-booking (this endpoint is display-only, so a stale
 * response can never let a double-booking through).
 */
export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date');
  if (!date || !DATE_RE.test(date)) {
    return NextResponse.json({ error: 'Invalid or missing date.' }, { status: 400 });
  }

  const allSlots = getDaySlots(date);
  if (allSlots.length === 0) {
    return NextResponse.json({ slots: [] });
  }

  // Naive (server-ambient-zone) day boundaries are fine here, unlike the
  // slot times themselves: business hours (10:00-20:30 Brussels) never get
  // shifted by Brussels' ±1-2h UTC offset into a different UTC calendar
  // day, so this window always fully contains the real Brussels day.
  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(`${date}T00:00:00`);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const result = await debsPool.query<{ date_time: Date }>(
    "SELECT date_time FROM debs_appointments WHERE date_time >= $1 AND date_time < $2 AND status != 'CANCELLED'",
    [dayStart.toISOString(), dayEnd.toISOString()],
  );
  const taken = new Set(result.rows.map((row) => utcToBrusselsTime(new Date(row.date_time))));

  return NextResponse.json({
    slots: allSlots.map((time) => ({ time, available: !taken.has(time) })),
  });
}
