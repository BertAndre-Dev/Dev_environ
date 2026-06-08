import {
  extractEstateEnergyUsageMessage,
  type EstateEnergyUsageRange,
} from "@/lib/estate-energy-usage-chart";

export type { EstateEnergyUsageRange as EstateConsumptionChartRange };
export {
  ESTATE_ENERGY_USAGE_RANGE_OPTIONS as ESTATE_CONSUMPTION_CHART_RANGE_OPTIONS,
  formatEstateUsageDateRange as formatEstateConsumptionDateRange,
} from "@/lib/estate-energy-usage-chart";

export interface EstateConsumptionChartPoint {
  time: string;
  value: number;
}

export interface EstateConsumptionBarPoint {
  label: string;
  date: string;
  value: number;
}

export interface EstateConsumptionChartData {
  estateId: string;
  range: EstateEnergyUsageRange;
  meterCount: number;
  successCount: number;
  failedCount: number;
  count: number;
  totalConsumption: number;
  from?: string;
  to?: string;
  chart: EstateConsumptionChartPoint[];
  source?: string;
  message?: string;
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

export function mapEstateConsumptionToBarPoints(
  data: EstateConsumptionChartData | null | undefined,
): EstateConsumptionBarPoint[] {
  if (!data?.chart?.length) return [];

  return [...data.chart]
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
    .map((point) => ({
      label: formatPointLabel(point.time, data.range),
      date: point.time,
      value: Math.max(0, Number(point.value) || 0),
    }));
}

function parseChartPayload(value: unknown): EstateConsumptionChartData | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;

  if (!Array.isArray(record.chart)) return null;

  const rangeRaw = record.range;
  const range =
    rangeRaw === "daily" ||
    rangeRaw === "weekly" ||
    rangeRaw === "monthly" ||
    rangeRaw === "yearly"
      ? rangeRaw
      : "monthly";

  return {
    estateId: typeof record.estateId === "string" ? record.estateId : "",
    range,
    meterCount: Number(record.meterCount) || 0,
    successCount: Number(record.successCount) || 0,
    failedCount: Number(record.failedCount) || 0,
    count: Number(record.count) || 0,
    totalConsumption: Number(record.totalConsumption) || 0,
    from: typeof record.from === "string" ? record.from : undefined,
    to: typeof record.to === "string" ? record.to : undefined,
    source: typeof record.source === "string" ? record.source : undefined,
    chart: record.chart.map((point) => {
      const p = point as Record<string, unknown>;
      return {
        time: typeof p.time === "string" ? p.time : "",
        value: Number(p.value) || 0,
      };
    }),
  };
}

/** Parses POST /api/v1/meters/estate/{estateId}/hes/chart/jobs response. */
export function parseEstateConsumptionChartJobResponse(
  value: unknown,
): EstateConsumptionChartData | null {
  if (!value || typeof value !== "object") return null;
  const job = value as Record<string, unknown>;

  const nested = job.data;
  if (nested && typeof nested === "object") {
    const inner = nested as Record<string, unknown>;
    const chartData = parseChartPayload(inner.data ?? inner);
    if (chartData) {
      return {
        ...chartData,
        source:
          chartData.source ??
          (typeof job.source === "string" ? job.source : undefined),
        message: extractEstateEnergyUsageMessage(value),
      };
    }
  }

  const direct = parseChartPayload(job);
  if (!direct) return null;
  return {
    ...direct,
    message: extractEstateEnergyUsageMessage(value),
  };
}
