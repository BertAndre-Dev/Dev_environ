import { createAsyncThunk } from "@reduxjs/toolkit";
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

export interface EstateEnergyUsageResult {
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

function resolvePollUrl(value: unknown, fallbackUrl: string): string {
  if (value && typeof value === "object") {
    const pollUrl = (value as { pollUrl?: unknown }).pollUrl;
    if (typeof pollUrl === "string" && pollUrl.trim()) {
      return pollUrl;
    }
  }
  return fallbackUrl;
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

async function pollJob(
  fetchJob: () => Promise<unknown>,
  shouldStop: (body: unknown) => boolean,
): Promise<{ body: unknown; meta: EstateEnergyUsageJobMeta }> {
  let attempts = 0;
  let lastBody: unknown;
  let lastMeta: EstateEnergyUsageJobMeta = {};

  while (attempts < MAX_POLL_ATTEMPTS) {
    lastBody = await fetchJob();
    lastMeta = extractJobMeta(lastBody);

    if (shouldStop(lastBody)) {
      return { body: lastBody, meta: lastMeta };
    }

    attempts += 1;
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error("Estate energy usage aggregation timed out.");
}

function hasJobId(value: unknown): boolean {
  return !!extractJobMeta(value).jobId;
}

/**
 * GET /api/v1/meters/estate/{estateId}/hes/usage/jobs — queue usage job, then
 * GET /api/v1/meters/estate/hes/jobs/{jobId} until completed.
 */
export const getCompanyEstateEnergyUsage = createAsyncThunk(
  "company-estate-energy-usage/getUsage",
  async (
    {
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
    },
    { rejectWithValue },
  ) => {
    try {
      const params = buildUsageJobParams({ range, refresh, year, month });
      const usageJobsUrl = `/api/v1/meters/estate/${estateId}/hes/usage/jobs`;

      const initialRes = await axiosInstance.get(usageJobsUrl, { params });
      let body: unknown = initialRes.data;
      let meta = extractJobMeta(body);

      if (!isJobCompleted(body) && !hasJobId(body)) {
        let pollUrl = resolvePollUrl(body, usageJobsUrl);

        const usageJobPoll = await pollJob(
          async () => {
            const res =
              pollUrl === usageJobsUrl
                ? await axiosInstance.get(usageJobsUrl, { params })
                : await axiosInstance.get(pollUrl);
            const nextBody = res.data;
            pollUrl = resolvePollUrl(nextBody, pollUrl);
            return nextBody;
          },
          (nextBody) => isJobCompleted(nextBody) || hasJobId(nextBody),
        );

        body = usageJobPoll.body;
        meta = { ...meta, ...usageJobPoll.meta };
      }

      if (!isJobCompleted(body)) {
        const jobId =
          meta.jobId ??
          (body &&
          typeof body === "object" &&
          typeof (body as { jobId?: unknown }).jobId === "string"
            ? (body as { jobId: string }).jobId
            : undefined);

        if (!jobId) {
          return rejectWithValue({
            message: "Estate energy usage job did not return a job id.",
          });
        }

        const jobPoll = await pollJob(
          async () => {
            const res = await axiosInstance.get(
              `/api/v1/meters/estate/hes/jobs/${jobId}`,
            );
            return res.data;
          },
          (nextBody) => isJobCompleted(nextBody),
        );

        body = jobPoll.body;
        meta = { ...meta, ...jobPoll.meta };
      }

      const usage = parseEstateEnergyUsageJobResponse(body);
      if (!usage) {
        return rejectWithValue({
          message: "Unexpected estate energy usage response.",
        });
      }

      const result: EstateEnergyUsageResult = {
        usage: {
          ...usage,
          source: usage.source ?? meta.source,
        },
        meta,
      };

      return result;
    } catch (error: unknown) {
      const err = error as {
        message?: string;
        response?: { data?: { message?: string } };
      };
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch estate energy usage.",
      });
    }
  },
);
