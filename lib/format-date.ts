// /** Format an ISO timestamp as UTC, matching the backend value (e.g. 2026-06-10T23:47:22). */
// export function formatDateTime(
//   iso?: string | null,
//   fallback = "—",
// ): string {
//   if (!iso) return fallback;
//   const d = new Date(iso);
//   if (Number.isNaN(d.getTime())) return fallback;
//   return d.toISOString().slice(0, 19);
// }



/**
 * Format an ISO timestamp using UTC so the displayed date
 * always matches the backend value regardless of the user's
 * local timezone (e.g. WAT/UTC+1 shifting June 10 → June 11).
 *
 * Output example: "6/10/2026, 11:47:22 PM"
 */
export function formatDateTime(
  iso?: string | null,
  fallback = "—",
): string {
  if (!iso) return fallback;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return fallback;

  // ✅ Always use UTC getters — never toLocaleString() which
  // silently applies the browser's local timezone offset.
  const month  = d.getUTCMonth() + 1;           // 1-based
  const day    = d.getUTCDate();
  const year   = d.getUTCFullYear();
  const hour24 = d.getUTCHours();
  const minute = String(d.getUTCMinutes()).padStart(2, "0");
  const second = String(d.getUTCSeconds()).padStart(2, "0");
  const ampm   = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;             // 0 → 12

  return `${month}/${day}/${year}, ${hour12}:${minute}:${second} ${ampm}`;
}

/**
 * Format an ISO timestamp as a plain UTC date string.
 * Output example: "6/10/2026"
 */
export function formatDate(
  iso?: string | null,
  fallback = "—",
): string {
  if (!iso) return fallback;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return fallback;

  const month = d.getUTCMonth() + 1;
  const day   = d.getUTCDate();
  const year  = d.getUTCFullYear();

  return `${month}/${day}/${year}`;
}