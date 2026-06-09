import type { PowerUsageDataPoint } from "@/lib/power-usage-chart";

export type EstateEnergyUsageRange =
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly";

export const ESTATE_ENERGY_USAGE_RANGE_OPTIONS: {
  label: string;
  value: EstateEnergyUsageRange;
}[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

export interface EstateEnergyUsagePoint {
  time: string;
  usageKwh: number;
}

export interface EstateEnergyUsageData {
  estateId: string;
  range: EstateEnergyUsageRange;
  meterCount: number;
  successCount: number;
  failedCount: number;
  unit: string;
  totalUsage: number;
  from?: string;
  to?: string;
  points: EstateEnergyUsagePoint[];
  source?: string;
  message?: string;
}

/** Extracts display message from the HES usage jobs API response. */
export function extractEstateEnergyUsageMessage(
  value: unknown,
): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const job = value as Record<string, unknown>;

  const nested = job.data;
  if (nested && typeof nested === "object") {
    const inner = nested as Record<string, unknown>;
    if (typeof inner.message === "string" && inner.message.trim()) {
      return inner.message;
    }
  }

  if (typeof job.message === "string" && job.message.trim()) {
    return job.message;
  }

  return undefined;
}

function formatPointLabel(
  isoTime: string,
  range: EstateEnergyUsageRange,
): string {
  const d = new Date(isoTime);
  if (Number.isNaN(d.getTime())) return isoTime;

  switch (range) {
    case "yearly":
    case "monthly":
      return d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    case "weekly":
    case "daily":
    default:
      return d.toLocaleString("en-US", { month: "short", day: "numeric" });
  }
}

export function formatEstateUsageDateRange(
  from?: string,
  to?: string,
): string | null {
  if (!from && !to) return null;
  const fmt = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  if (from && to) return `${fmt(from)} – ${fmt(to)}`;
  if (from) return fmt(from);
  if (to) return fmt(to);
  return null;
}

/** Maps estate HES usage job payload to chart points. */
export function mapEstateEnergyUsageToChartPoints(
  usage: EstateEnergyUsageData | null | undefined,
): PowerUsageDataPoint[] {
  if (!usage?.points?.length) return [];

  const { range } = usage;
  return [...usage.points]
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
    .map((point) => ({
      label: formatPointLabel(point.time, range),
      date: point.time,
      usageKwh: Math.max(0, Number(point.usageKwh) || 0),
    }));
}

/** Maps estate usage API data for PowerUsageCard. */
export function mapEstateEnergyUsageToPowerUsage(
  usage: EstateEnergyUsageData | null | undefined,
): { points: PowerUsageDataPoint[]; totalKwh: number } {
  const points = mapEstateEnergyUsageToChartPoints(usage);
  const rawTotal = usage?.totalUsage;
  const totalKwh = Math.round(
    Number.isFinite(rawTotal) ? Number(rawTotal) : 0,
  );
  return { points, totalKwh };
}

function parseUsagePayload(value: unknown): EstateEnergyUsageData | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;

  if (!Array.isArray(record.points)) return null;

  const rangeRaw = record.range;
  const range =
    rangeRaw === "daily" ||
    rangeRaw === "weekly" ||
    rangeRaw === "monthly" ||
    rangeRaw === "yearly"
      ? rangeRaw
      : "weekly";

  return {
    estateId: typeof record.estateId === "string" ? record.estateId : "",
    range,
    meterCount: Number(record.meterCount) || 0,
    successCount: Number(record.successCount) || 0,
    failedCount: Number(record.failedCount) || 0,
    unit: typeof record.unit === "string" ? record.unit : "kWh",
    totalUsage: Number(record.totalUsage) || 0,
    from: typeof record.from === "string" ? record.from : undefined,
    to: typeof record.to === "string" ? record.to : undefined,
    source: typeof record.source === "string" ? record.source : undefined,
    points: record.points.map((point) => {
      const p = point as Record<string, unknown>;
      return {
        time: typeof p.time === "string" ? p.time : "",
        usageKwh: Number(p.usageKwh) || 0,
      };
    }),
  };
}

/** Parses POST /api/v1/meters/estate/{estateId}/hes/usage/jobs response. */
export function parseEstateEnergyUsageJobResponse(
  value: unknown,
): EstateEnergyUsageData | null {
  if (!value || typeof value !== "object") return null;
  const job = value as Record<string, unknown>;

  const nested = job.data;
  if (nested && typeof nested === "object") {
    const inner = nested as Record<string, unknown>;
    const usage = parseUsagePayload(inner.data ?? inner);
    if (usage) {
      return {
        ...usage,
        source:
          usage.source ??
          (typeof job.source === "string" ? job.source : undefined),
        message: extractEstateEnergyUsageMessage(value),
      };
    }
  }

  const direct = parseUsagePayload(job);
  if (!direct) return null;
  return {
    ...direct,
    message: extractEstateEnergyUsageMessage(value),
  };
}
