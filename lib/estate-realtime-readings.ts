import { extractEstateEnergyUsageMessage } from "@/lib/estate-energy-usage-chart";

export interface EstateRealtimeReadingsData {
  estateId: string;
  meterCount: number;
  successCount: number;
  failedCount: number;
  totalEnergy: number;
  timestamp?: string;
  message?: string;
  source?: string;
}

export interface EstateRealtimeGaugePoint {
  name: string;
  value: number;
  fill: string;
}

const GAUGE_COLOR = "#0150AC";

export function formatRealtimeTimestamp(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function computeRealtimeSuccessRate(data: EstateRealtimeReadingsData): number {
  if (data.meterCount <= 0) return 0;
  return Math.round((data.successCount / data.meterCount) * 1000) / 10;
}

/** Radial gauge segment for read success rate (0–100). */
export function mapRealtimeToGaugePoints(
  data: EstateRealtimeReadingsData | null | undefined,
): EstateRealtimeGaugePoint[] {
  if (!data) return [];
  return [
    {
      name: "Success rate",
      value: computeRealtimeSuccessRate(data),
      fill: GAUGE_COLOR,
    },
  ];
}

export function mapRealtimeToMeterPieData(
  data: EstateRealtimeReadingsData | null | undefined,
): { name: string; value: number; fill: string }[] {
  if (!data) return [];
  return [
    { name: "Successful reads", value: data.successCount, fill: "#10b981" },
    { name: "Failed reads", value: data.failedCount, fill: "#ef4444" },
  ].filter((item) => item.value > 0);
}

function parseRealtimePayload(value: unknown): EstateRealtimeReadingsData | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;

  if (
    record.meterCount === undefined &&
    record.totalEnergy === undefined &&
    record.successCount === undefined
  ) {
    return null;
  }

  return {
    estateId: typeof record.estateId === "string" ? record.estateId : "",
    meterCount: Number(record.meterCount) || 0,
    successCount: Number(record.successCount) || 0,
    failedCount: Number(record.failedCount) || 0,
    totalEnergy: Number(record.totalEnergy) || 0,
    timestamp:
      typeof record.timestamp === "string" ? record.timestamp : undefined,
    source: typeof record.source === "string" ? record.source : undefined,
  };
}

/** Parses POST /api/v1/meters/estate/{estateId}/hes/realtime/jobs response. */
export function parseEstateRealtimeReadingsJobResponse(
  value: unknown,
): EstateRealtimeReadingsData | null {
  if (!value || typeof value !== "object") return null;
  const job = value as Record<string, unknown>;

  const nested = job.data;
  if (nested && typeof nested === "object") {
    const inner = nested as Record<string, unknown>;
    const readings = parseRealtimePayload(inner.data ?? inner);
    if (readings) {
      return {
        ...readings,
        source:
          readings.source ??
          (typeof job.source === "string" ? job.source : undefined),
        message: extractEstateEnergyUsageMessage(value),
      };
    }
  }

  const direct = parseRealtimePayload(job);
  if (!direct) return null;
  return {
    ...direct,
    message: extractEstateEnergyUsageMessage(value),
  };
}
