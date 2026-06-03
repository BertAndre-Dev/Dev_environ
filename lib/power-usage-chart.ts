import type { MeterUsageData } from "@/redux/slice/resident/meter-mgt/meter-mgt";

export interface PowerUsageDataPoint {
  label: string;
  date?: string;
  usageKwh: number;
}

type VendLike = {
  createdAt?: string;
  value?: string | number;
  unit?: string;
  [key: string]: unknown;
};

function parseUsageKwh(item: VendLike): number {
  const raw = item.value ?? item.units;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function formatDayLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  return `${month} ${d.getDate()}`;
}

export function mapVendHistoryToPowerUsage(
  items: VendLike[],
  maxPoints = 6,
): { points: PowerUsageDataPoint[]; totalKwh: number } {
  if (!items.length) {
    return { points: [], totalKwh: 0 };
  }

  const byDate: Record<string, number> = {};
  let totalKwh = 0;

  for (const item of items) {
    const date = (item.createdAt ?? "").slice(0, 10);
    if (!date) continue;
    const kwh = parseUsageKwh(item);
    totalKwh += kwh;
    byDate[date] = (byDate[date] ?? 0) + kwh;
  }

  const points = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-maxPoints)
    .map(([date, usageKwh]) => ({
      label: formatDayLabel(date),
      date,
      usageKwh,
    }));

  return { points, totalKwh: Math.round(totalKwh) };
}

function formatTimeLabel(isoTime: string): string {
  const d = new Date(isoTime);
  if (Number.isNaN(d.getTime())) return isoTime;
  const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  return `${month} ${d.getDate()}`;
}

/** Maps GET /api/v1/meters/usage/{meterNumber} response to chart points. */
export function mapMeterUsageToPowerUsage(
  usage: MeterUsageData | null | undefined,
  maxPoints = 12,
): { points: PowerUsageDataPoint[]; totalKwh: number } {
  if (!usage) {
    return { points: [], totalKwh: 0 };
  }

  const totalKwh = Math.round(
    Number.isFinite(usage.totalUsage) ? usage.totalUsage : 0,
  );

  const sorted = [...(usage.points ?? [])].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
  );

  const recent =
    sorted.length > maxPoints ? sorted.slice(-maxPoints) : sorted;

  const points = recent.map((p) => ({
    label: formatTimeLabel(p.time),
    date: p.time,
    usageKwh: Math.max(0, Number(p.usageKwh) || 0),
  }));

  return { points, totalKwh };
}
