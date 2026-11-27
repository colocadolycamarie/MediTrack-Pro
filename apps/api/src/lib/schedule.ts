/**
 * Schedule helpers shared by the medications and dashboard routes.
 *
 * Time zone: clock times like "08:00" are interpreted in APP_TIMEZONE
 * (e.g. "Asia/Manila"). When APP_TIMEZONE is NOT set, the server's own local
 * time zone is used — which is exactly how the app behaved before this
 * helper existed, so nothing already stored shifts when you deploy this.
 * Set APP_TIMEZONE on cloud hosts (they run in UTC) so 08:00 means 08:00
 * for your patients.
 */

export const APP_TIMEZONE: string =
  process.env["APP_TIMEZONE"]?.trim() || Intl.DateTimeFormat().resolvedOptions().timeZone;

const DOW = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

// Default clock times for meal-relative schedules, and the before/after shift.
const MEAL_TIMES: Record<string, [number, number]> = {
  breakfast: [7, 0],
  lunch: [12, 0],
  dinner: [18, 0],
};
const MEAL_OFFSET_MINUTES = 30;

export const VALID_MEAL_RELATIONS = [
  "before_breakfast", "after_breakfast",
  "before_lunch", "after_lunch",
  "before_dinner", "after_dinner",
] as const;

type ScheduleLike = {
  timeType: string;
  clockTime: string | null;
  mealRelation: string | null;
  daysOfWeek: string;
};

function partsInZone(date: Date) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    hourCycle: "h23",
    year: "numeric", month: "numeric", day: "numeric",
    hour: "numeric", minute: "numeric", second: "numeric",
  });
  const get: Record<string, number> = {};
  for (const p of fmt.formatToParts(date)) {
    if (p.type !== "literal") get[p.type] = Number(p.value);
  }
  return get as { year: number; month: number; day: number; hour: number; minute: number; second: number };
}

function offsetMs(date: Date): number {
  const p = partsInZone(date);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** The UTC instant at which the wall clock in APP_TIMEZONE reads y-m-d h:mi. */
function zonedToUtc(y: number, m: number, d: number, h: number, mi: number): Date {
  const guess = Date.UTC(y, m - 1, d, h, mi, 0);
  const first = new Date(guess - offsetMs(new Date(guess)));
  return new Date(guess - offsetMs(first));
}

/** Calendar day (in APP_TIMEZONE) containing `now` (+ plusDays), with helpers to build instants on it. */
export function calendarDay(now: Date = new Date(), plusDays = 0) {
  const p = partsInZone(now);
  const base = new Date(Date.UTC(p.year, p.month - 1, p.day + plusDays));
  const y = base.getUTCFullYear();
  const m = base.getUTCMonth() + 1;
  const d = base.getUTCDate();
  return {
    start: zonedToUtc(y, m, d, 0, 0),
    end: new Date(zonedToUtc(y, m, d + 1, 0, 0).getTime() - 1),
    dow: DOW[base.getUTCDay()],
    at: (hour: number, minute: number) => zonedToUtc(y, m, d, hour, minute),
  };
}

/** Wall-clock hour/minute a schedule fires at, or null if it can't be resolved. */
export function resolveClock(
  s: Pick<ScheduleLike, "timeType" | "clockTime" | "mealRelation">,
): { hour: number; minute: number } | null {
  if (s.timeType === "clock") {
    const m = /^(\d{1,2}):(\d{2})$/.exec(s.clockTime ?? "");
    if (!m) return null;
    const hour = Number(m[1]);
    const minute = Number(m[2]);
    if (hour > 23 || minute > 59) return null;
    return { hour, minute };
  }
  if (s.timeType === "meal_relative" && s.mealRelation) {
    const match = /^(before|after)_(breakfast|lunch|dinner)$/.exec(s.mealRelation);
    if (!match) return null;
    const base = MEAL_TIMES[match[2]];
    const total = base[0] * 60 + base[1] + (match[1] === "before" ? -MEAL_OFFSET_MINUTES : MEAL_OFFSET_MINUTES);
    return { hour: Math.floor(total / 60), minute: total % 60 };
  }
  return null;
}

/** An empty / unparsable days list means "every day", matching how schedules were stored before. */
export function runsOnDay(daysOfWeekJson: string, dow: string): boolean {
  let days: unknown;
  try {
    days = JSON.parse(daysOfWeekJson || "[]");
  } catch {
    return true;
  }
  if (!Array.isArray(days) || days.length === 0) return true;
  return days.includes(dow);
}

/** Next time this schedule fires after `now` (looks up to 8 days ahead). */
export function computeNextDose(s: ScheduleLike, now: Date = new Date()): string | null {
  const clock = resolveClock(s);
  if (!clock) return null;
  for (let i = 0; i < 8; i++) {
    const day = calendarDay(now, i);
    if (!runsOnDay(s.daysOfWeek, day.dow)) continue;
    const at = day.at(clock.hour, clock.minute);
    if (at.getTime() > now.getTime()) return at.toISOString();
  }
  return null;
}
