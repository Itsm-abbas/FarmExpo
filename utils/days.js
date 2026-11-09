// Calendar days as "YYYY-MM-DD" strings, the form purchases are stored and
// filtered by (no time zones involved).

// Today on this device.
export const today = () => new Date().toLocaleDateString("en-CA");

export function daysBefore(day, n) {
  const d = new Date(`${day.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

const dayOf = (y, m, d) => new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10);

// Quick periods for date filters; presetRange(id) gives their { from, to }.
export const DATE_PRESETS = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "this-month", label: "This month" },
  { id: "last-month", label: "Last month" },
  { id: "2m", label: "Last 2 months" },
  { id: "3m", label: "Last 3 months" },
  { id: "6m", label: "Last 6 months" },
  { id: "this-year", label: "This year" },
  { id: "last-year", label: "Last year" },
];

export function presetRange(id) {
  const now = today();
  const [y, m, d] = now.split("-").map(Number);
  // "Last n months": the same day n months ago (clamped to month end) to today.
  const monthsBack = (n) => dayOf(y, m - 1 - n, Math.min(d, new Date(Date.UTC(y, m - 1 - n + 1, 0)).getUTCDate()));
  switch (id) {
    case "today": return { from: now, to: now };
    case "7d": return { from: daysBefore(now, 6), to: now };
    case "30d": return { from: daysBefore(now, 29), to: now };
    case "this-month": return { from: dayOf(y, m - 1, 1), to: now };
    case "last-month": return { from: dayOf(y, m - 2, 1), to: dayOf(y, m - 1, 0) };
    case "2m": return { from: monthsBack(2), to: now };
    case "3m": return { from: monthsBack(3), to: now };
    case "6m": return { from: monthsBack(6), to: now };
    case "this-year": return { from: dayOf(y, 0, 1), to: now };
    case "last-year": return { from: dayOf(y - 1, 0, 1), to: dayOf(y - 1, 11, 31) };
    default: return { from: "", to: "" };
  }
}

// "26 Oct 2026"; pass options for e.g. a weekday.
export const formatDay = (day, options = {}) =>
  new Date(`${String(day).slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  });

export const formatKg = (kg) =>
  `${Number(kg || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })} kg`;
