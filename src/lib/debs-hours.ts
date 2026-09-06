// Canonical opening hours for Debs Hair Beauty, used to compute bookable
// slots (src/app/api/debs/availability/route.ts). Mirrored for display in
// `HOURS` (src/app/[locale]/debs/DebsPageClient.tsx) and in the
// `openingHoursSpecification` JSON-LD (src/lib/debs-schema.ts) — keep all
// three in sync if the salon's real hours ever change.

export type DaySchedule = { opens: string; closes: string } | null;

/** Index = `Date#getDay()` (0 = Sunday). Closed Sunday & Monday. */
export const OPENING_HOURS: readonly DaySchedule[] = [
  null,
  null,
  { opens: "10:00", closes: "18:00" },
  { opens: "10:00", closes: "19:00" },
  { opens: "10:00", closes: "19:00" },
  { opens: "10:00", closes: "19:30" },
  { opens: "10:00", closes: "20:30" },
];

export const SLOT_MINUTES = 30;

/** Bookable slot start times ("HH:MM") for a "YYYY-MM-DD" date string — `[]` if the salon is closed that day. */
export function getDaySlots(date: string): string[] {
  const schedule = OPENING_HOURS[new Date(`${date}T00:00:00`).getDay()];
  if (!schedule) return [];

  const [closeH, closeM] = schedule.closes.split(":").map(Number);
  let [h, m] = schedule.opens.split(":").map(Number);
  const slots: string[] = [];
  while (h < closeH || (h === closeH && m < closeM)) {
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    m += SLOT_MINUTES;
    if (m >= 60) {
      m -= 60;
      h += 1;
    }
  }
  return slots;
}
