export interface MeterRealtimeBalanceData {
  meterNumber: string;
  balance: number;
  used?: number;
  timestamp?: string;
  source?: string;
  message?: string;
}

export interface MeterRealtimeBalanceBarRow {
  name: string;
  balance: number;
  used: number;
  total: number;
}

const REMAINING_COLOR = "#0150AC";
const CONSUMED_COLOR = "#cbd5e1";

export function formatKwhValue(value: number | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function formatMeterRealtimeTimestamp(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Arc fill for the balance gauge (0–100). */
export function computeBalanceGaugeFill(
  data: MeterRealtimeBalanceData | null | undefined,
): number {
  if (!data) return 0;
  const balance = Math.max(0, Number(data.balance) || 0);
  const used = Math.max(0, Number(data.used) || 0);
  const total = balance + used;
  if (total > 0) {
    return Math.round((balance / total) * 1000) / 10;
  }
  return balance > 0 ? 100 : 0;
}

/** Single row for a stacked horizontal energy bar. */
export function mapRealtimeBalanceToStackedBar(
  data: MeterRealtimeBalanceData | null | undefined,
): MeterRealtimeBalanceBarRow[] {
  if (!data) return [];

  const balance = Math.max(0, Number(data.balance) || 0);
  const used =
    data.used === undefined ? 0 : Math.max(0, Number(data.used) || 0);

  return [
    {
      name: "Energy",
      balance,
      used,
      total: balance + used,
    },
  ];
}

export function hasRealtimeBalanceUsage(
  data: MeterRealtimeBalanceData | null | undefined,
): boolean {
  return data?.used !== undefined;
}

export { REMAINING_COLOR, CONSUMED_COLOR };

function parseBalancePayload(value: unknown): MeterRealtimeBalanceData | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;

  if (typeof record.meterNumber !== "string") return null;

  const parsed: MeterRealtimeBalanceData = {
    meterNumber: record.meterNumber,
    balance: Number(record.balance) || 0,
    timestamp: typeof record.timestamp === "string" ? record.timestamp : undefined,
    source: typeof record.source === "string" ? record.source : undefined,
    message: typeof record.message === "string" ? record.message : undefined,
  };

  if (record.used !== undefined && record.used !== null) {
    parsed.used = Number(record.used) || 0;
  }

  return parsed;
}

/** Parse GET /api/v1/meters/realtime/balance/{meterNumber} response body. */
export function parseMeterRealtimeBalanceResponse(
  body: unknown,
): MeterRealtimeBalanceData | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;

  if (record.data && typeof record.data === "object") {
    const parsed = parseBalancePayload(record.data);
    if (parsed) {
      const message =
        typeof record.message === "string" ? record.message : undefined;
      return { ...parsed, message: parsed.message ?? message };
    }
  }

  return parseBalancePayload(body);
}
