/** Example dates for empty inputs (display only; not sent until the user picks a range). */
export function getDateRangePlaceholders(days = 30): {
  start: string;
  end: string;
} {
  const now = new Date();
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - days);
  const toIso = (d: Date) =>
    new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
      .toISOString()
      .slice(0, 10);
  return { start: toIso(start), end: toIso(now) };
}
