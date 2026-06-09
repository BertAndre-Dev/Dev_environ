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

export function formatRealtimeEnergyKwh(
  value: number | null | undefined,
): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh`;
}

function extractJobMessage(value: unknown): string | undefined {
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
        message: extractJobMessage(value),
      };
    }
  }

  const direct = parseRealtimePayload(job);
  if (!direct) return null;
  return {
    ...direct,
    message: extractJobMessage(value),
  };
}
