function formatUs12Hour(hour24: number, minute: number): string {
  const totalMinutes = hour24 * 60 + minute;
  const h24 = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

function halfHourSlotsBetween(
  startHour24: number,
  startMinute: number,
  endHour24: number,
  endMinute: number
): string[] {
  const start = startHour24 * 60 + startMinute;
  const end = endHour24 * 60 + endMinute;
  const out: string[] = [];
  for (let t = start; t <= end; t += 30) {
    const h = Math.floor(t / 60);
    const m = t % 60;
    out.push(formatUs12Hour(h, m));
  }
  return out;
}

const DEFAULT_TIME_OPTIONS = halfHourSlotsBetween(7, 0, 21, 0);

function parseAppt1TimeOptions(): string[] {
  const raw = process.env.APPT1_TIMES?.trim();
  if (!raw) {
    return DEFAULT_TIME_OPTIONS;
  }
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
export type BookingGender = "male" | "female";

export type BookingDob = { readonly iso: string; readonly usSlash: string };

/** Plan step — add-on card the tests assert is visible (`data-testid` + visible title copy). */
export type PlanAddOnExpectation = { readonly testId: string; readonly label: string };

export const bookingDefaults = {
  scanName: "MRI Scan",
  expectedTotal: "999",

  expectedAddOn: {
    testId: "lung-addon-card",
    label: "Lungs CT Scan",
  } satisfies PlanAddOnExpectation,

  /** Plan step — when DOB controls appear (e.g. new accounts). */
  dob: {
    iso: "1901-01-01",
    usSlash: "01/01/1901",
  } satisfies BookingDob,

  /** Matches `multiselect__element` option label (Male / Female). */
  gender: "male" as BookingGender,

  /** Payment step — Stripe may require postal/ZIP with the card. */
  postalCode: "M5T 1T4",

  /** Scheduling — `pickSlot` picks first available shown day + first matching time; see `APPT1_TIMES`. */
  appt1TimeOptions: parseAppt1TimeOptions(),
};
