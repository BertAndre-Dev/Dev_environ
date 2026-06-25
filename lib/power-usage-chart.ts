import type { MeterUsageData } from "@/redux/slice/resident/meter-mgt/meter-mgt";

export interface PowerUsageDataPoint {
  label: string;
  date?: string;
  usageKwh: number;
}

export function formatPowerUsageKwh(value: number | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0.00";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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

  const totalKwh = Number.isFinite(usage.totalUsage) ? usage.totalUsage : 0;

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

function csvEscape(value: string | number): string {
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

export function exportPowerUsageToCsv(
  data: PowerUsageDataPoint[],
  options?: {
    fileName?: string;
    totalUsageKwh?: number;
  },
): boolean {
  if (!data.length) return false;

  const headers = ["Period", "Date", "Usage (kWh)"];
  const body = data.map((point) =>
    [
      csvEscape(point.label),
      csvEscape(point.date ?? point.label),
      csvEscape(formatPowerUsageKwh(point.usageKwh)),
    ].join(","),
  );

  if (typeof options?.totalUsageKwh === "number") {
    body.push(
      ["Total", "", csvEscape(formatPowerUsageKwh(options.totalUsageKwh))].join(
        ",",
      ),
    );
  }

  const csv = [headers.join(","), ...body].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const baseName = (options?.fileName ?? "energy_usage").replace(
    /[^a-z0-9-_]/gi,
    "_",
  );
  a.download = `${baseName}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}
