import {
  formatAddressEntryLabel,
  formatAddressLabel,
  type AddressOption,
} from "@/lib/address";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function parseDate(iso?: string | null): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Receipt-style UTC date, e.g. "Sep 24, 2023". */
export function formatReceiptDate(iso?: string | null): string | undefined {
  const date = parseDate(iso);
  if (!date) return undefined;
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

/** Receipt-style UTC datetime, e.g. "May 12, 2026 02:35 PM". */
export function formatReceiptDateTime(iso?: string | null): string | undefined {
  const date = parseDate(iso);
  if (!date) return undefined;
  const hour24 = date.getUTCHours();
  const hour12 = hour24 % 12 || 12;
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  const ampm = hour24 >= 12 ? "PM" : "AM";
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()} ${String(hour12).padStart(2, "0")}:${minute} ${ampm}`;
}

export function formatReceiptNaira(value: number | string | null | undefined): string | undefined {
  if (value == null || value === "") return undefined;
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) return undefined;
  return `₦${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatFrequencyLabel(frequency?: string): string | undefined {
  if (!frequency) return undefined;
  const map: Record<string, string> = {
    oneoff: "One-off",
    oneOff: "One-off",
    quarterly: "Quarterly",
    yearly: "Yearly",
    monthly: "Monthly",
  };
  return map[frequency] || frequency;
}

export function formatTokenGroups(token?: string): string | undefined {
  const digits = token?.replace(/\s+/g, "").trim();
  if (!digits) return undefined;
  return digits.match(/.{1,4}/g)?.join(" ") ?? digits;
}

export function residentDisplayName(
  firstName?: unknown,
  lastName?: unknown,
): string | undefined {
  const name = [firstName, lastName]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean)
    .join(" ");
  return name || undefined;
}

export function resolveReceiptAddressLabel(
  addresses: AddressOption[],
  addressId?: string | null,
): string | undefined {
  if (!addressId) return undefined;
  const match = addresses.find((address) => address.id === addressId);
  if (!match) return undefined;
  return formatAddressEntryLabel(match.data) || formatAddressLabel(match) || undefined;
}

export function sanitizeFileBase(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
  return cleaned.replace(/^-|-$/g, "") || "receipt";
}
