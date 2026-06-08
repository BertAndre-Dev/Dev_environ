/** Strip commas and non-digits, then parse to number. Returns 0 for empty/invalid input. */
export function parseFormattedNumber(value: string | number): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const cleaned = value.replaceAll(",", "").replaceAll(/[^\d.]/g, "").trim();
  if (!cleaned) return 0;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

/** Format digits with thousand separators as the user types (whole numbers only). */
export function formatAmountInput(raw: string): string {
  const digits = raw.replaceAll(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-US");
}

/** Format a numeric value for display (e.g. table cells). */
export function formatAmountDisplay(value: string | number | null | undefined): string {
  if (value == null || value === "") return "—";
  const num = typeof value === "number" ? value : parseFormattedNumber(value);
  if (!Number.isFinite(num)) return "—";
  return num.toLocaleString("en-US");
}
