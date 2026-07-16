import axiosInstance from "@/utils/axiosInstance";
import {
  parseEstateEnergyUsageJobResponse,
  type EstateEnergyUsageData,
  type EstateEnergyUsageRange,
} from "@/lib/estate-energy-usage-chart";

const POLL_INTERVAL_MS = 2_000;
const MAX_POLL_ATTEMPTS = 90;

export interface EstateEnergyUsageJobMeta {
  jobId?: string;
  progress?: number;
  status?: string;
  source?: string;
}

export interface EstateEnergyUsageJobResult {
  usage: EstateEnergyUsageData;
  meta: EstateEnergyUsageJobMeta;
}

function extractJobMeta(value: unknown): EstateEnergyUsageJobMeta {
  if (!value || typeof value !== "object") return {};
  const job = value as Record<string, unknown>;
  return {
    jobId: typeof job.jobId === "string" ? job.jobId : undefined,
    progress: typeof job.progress === "number" ? job.progress : undefined,
    status: typeof job.status === "string" ? job.status : undefined,
    source: typeof job.source === "string" ? job.source : undefined,
  };
}

function isJobCompleted(value: unknown): boolean {
  return (
    !!value &&
    typeof value === "object" &&
    (value as { completed?: boolean }).completed === true
  );
}

function buildUsageJobParams({
  range,
  refresh,
  year,
  month,
}: {
  range: EstateEnergyUsageRange;
  refresh?: boolean;
  year?: number;
  month?: number;
}): Record<string, string> {
  const params: Record<string, string> = { range };
  const now = new Date();

  const resolvedYear = year ?? now.getFullYear();
  const resolvedMonth = month ?? now.getMonth() + 1;

  if (range === "monthly" || range === "yearly") {
    params.year = String(resolvedYear);
  }
  if (range === "monthly") {
    params.month = String(resolvedMonth);
  }
  if (refresh) {
    params.refresh = "1";
  }

  return params;
}

/**
 * GET /api/v1/meters/estate/{estateId}/hes/usage/jobs
 * Polls this same URL until `completed` is true.
 * Does not call /hes/jobs/{jobId}.
 */
export async function fetchEstateEnergyUsageJob({
  estateId,
  range = "weekly",
  year,
  month,
  refresh,
}: {
  estateId: string;
  range?: EstateEnergyUsageRange;
  year?: number;
  month?: number;
  refresh?: boolean;
}): Promise<EstateEnergyUsageJobResult> {
  const params = buildUsageJobParams({ range, refresh, year, month });
  const usageJobsUrl = `/api/v1/meters/estate/${estateId}/hes/usage/jobs`;

  let body: unknown;
  let meta: EstateEnergyUsageJobMeta = {};
  let attempts = 0;

  while (attempts < MAX_POLL_ATTEMPTS) {
    const res = await axiosInstance.get(usageJobsUrl, { params });
    body = res.data;
    meta = extractJobMeta(body);

    if (isJobCompleted(body)) {
      const usage = parseEstateEnergyUsageJobResponse(body);
      if (!usage) {
        throw new Error("Unexpected estate energy usage response.");
      }
      return {
        usage: {
          ...usage,
          source: usage.source ?? meta.source,
        },
        meta,
      };
    }

    attempts += 1;
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error("Estate energy usage aggregation timed out.");
}
