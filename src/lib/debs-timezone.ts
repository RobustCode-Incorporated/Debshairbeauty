// The salon only ever operates in one timezone. Clients pick a wall-clock
// time meaning "that time in Brussels" — but the server process interpreting
// `new Date("2026-09-10T11:00:00")` (no offset) treats it as *its own*
// ambient local time, which is Europe/Brussels on this dev machine but UTC
// on Vercel (Node functions there always run in UTC; Vercel doesn't allow
// overriding TZ). Left naive, that's a real 1-2h mismatch in production
// between what a client picked and what actually gets stored/blocked/shown
// on the salon's calendar. These two functions make the conversion explicit
// and independent of whichever zone the server process happens to run in.

const SALON_TIMEZONE = 'Europe/Brussels';

/** The UTC instant for `time` ("HH:MM") wall-clock in Brussels on `date` ("YYYY-MM-DD"). */
export function brusselsDateTimeToUtc(date: string, time: string): Date {
  // First guess: read the wall-clock string as if it were already UTC.
  const guess = new Date(`${date}T${time}:00Z`);
  if (Number.isNaN(guess.getTime())) return guess;

  // What wall-clock time does that guessed instant show in Brussels?
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: SALON_TIMEZONE,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(guess)
      .map((part) => [part.type, part.value]),
  );

  // Re-read that displayed wall-clock time as if it too were UTC — the gap
  // between the two is exactly Brussels' current UTC offset (handles DST).
  const asIfUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  const offsetMs = asIfUtc - guess.getTime();
  return new Date(guess.getTime() - offsetMs);
}

/** "HH:MM" wall-clock time in Brussels for an absolute instant — the inverse of `brusselsDateTimeToUtc`. */
export function utcToBrusselsTime(instant: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: SALON_TIMEZONE,
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
  }).format(instant);
}
