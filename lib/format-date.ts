/** Format an ISO timestamp as UTC, matching the backend value (e.g. 2026-06-10T23:47:22). */
export function formatDateTime(
  iso?: string | null,
  fallback = "—",
): string {
  if (!iso) return fallback;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toISOString().slice(0, 19);
}
