export const APP_TIMEZONE = "Africa/Lagos";

const DATETIME_OPTIONS: Intl.DateTimeFormatOptions = {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
};

/** Format an ISO timestamp in Nigeria local time (WAT). */
export function formatDateTime(
  iso?: string | null,
  fallback = "—",
): string {
  if (!iso) return fallback;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toLocaleString("en-NG", DATETIME_OPTIONS);
}
