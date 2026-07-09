import { normalizeAddresses } from "@/lib/address";

export interface MeterLookupUser {
  addressId?: string;
  addressIds?: {
    id?: string;
    _id?: string;
    data?: Record<string, unknown>;
  }[];
}

export function getAddressIdsFromUser(user: MeterLookupUser): string[] {
  const normalized = normalizeAddresses(user as Record<string, unknown>);
  return normalized.map((addr) => addr.id);
}

export function normalizeMeterFromApiResponse(res: unknown): string | null {
  if (!res) return null;

  const data =
    typeof res === "object" && res !== null && "data" in res
      ? (res as { data: unknown }).data
      : res;

  if (!data) return null;

  const meter = Array.isArray(data)
    ? (data[0] as { meterNumber?: string } | undefined)
    : (data as { meterNumber?: string });

  return meter?.meterNumber ?? null;
}

export function formatUserMeterNumbers(
  user: MeterLookupUser,
  meterByAddressId: Record<string, string | null>,
): string {
  const numbers = getAddressIdsFromUser(user)
    .map((id) => meterByAddressId[id])
    .filter((value): value is string => Boolean(value));

  const unique = Array.from(new Set(numbers));
  return unique.length ? unique.join(", ") : "—";
}
