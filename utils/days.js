// Calendar days as "YYYY-MM-DD" strings, the form purchases are stored and
// filtered by (no time zones involved).

// Today on this device.
export const today = () => new Date().toLocaleDateString("en-CA");

export function daysBefore(day, n) {
  const d = new Date(`${day.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
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
