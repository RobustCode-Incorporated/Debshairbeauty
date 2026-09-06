// Minimal RFC 5545 (iCalendar) builder — no dependency needed for something
// this small. Used to publish a subscribable feed of confirmed appointments
// for Apple Calendar (iPhone/Mac). See src/app/api/debs/calendar/route.ts.

export type IcsAppointment = {
  id: string;
  dateTime: Date;
  /** Minutes — no per-service duration exists yet, so callers pass a default. */
  durationMinutes: number;
  category: string;
  notes: string | null;
  amountCents: number;
  currency: string;
  clientFirstName: string;
  clientLastName: string;
  clientPhone: string;
};

const CRLF = '\r\n';
const FOLD_WIDTH = 73;

/** Escapes TEXT-type values per RFC 5545 §3.3.11. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/** Folds a content line at ~75 octets, continuation lines prefixed with a space (§3.1). */
function foldLine(line: string): string {
  if (line.length <= FOLD_WIDTH) return line;
  const parts: string[] = [];
  let rest = line;
  while (rest.length > FOLD_WIDTH) {
    parts.push(rest.slice(0, FOLD_WIDTH));
    rest = rest.slice(FOLD_WIDTH);
  }
  parts.push(rest);
  return parts.join(CRLF + ' ');
}

function formatUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function buildEvent(appt: IcsAppointment): string {
  const end = new Date(appt.dateTime.getTime() + appt.durationMinutes * 60_000);
  const clientName = `${appt.clientFirstName} ${appt.clientLastName}`.trim();
  const amount = (appt.amountCents / 100).toFixed(2);

  const descriptionLines = [
    `Cliente: ${clientName}`,
    `Telephone: ${appt.clientPhone}`,
    `Prestation: ${appt.category}`,
    `Acompte paye: ${amount} ${appt.currency.toUpperCase()}`,
    appt.notes ? `Notes: ${appt.notes}` : null,
  ].filter(Boolean);

  const lines = [
    'BEGIN:VEVENT',
    `UID:${appt.id}@debshairbeauty.com`,
    `DTSTAMP:${formatUtc(new Date())}`,
    `DTSTART:${formatUtc(appt.dateTime)}`,
    `DTEND:${formatUtc(end)}`,
    `SUMMARY:${escapeText(`${appt.category} — ${clientName}`)}`,
    `DESCRIPTION:${escapeText(descriptionLines.join('\n'))}`,
    'LOCATION:150A Rue de Laeken\\, 1000 Bruxelles',
    'END:VEVENT',
  ];
  return lines.map(foldLine).join(CRLF);
}

export function buildIcsCalendar(appointments: IcsAppointment[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Debs Hair Beauty//Reservations//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Debs Hair Beauty — Reservations',
    'REFRESH-INTERVAL;VALUE=DURATION:PT15M',
    ...appointments.map(buildEvent),
    'END:VCALENDAR',
  ];
  return lines.join(CRLF) + CRLF;
}
