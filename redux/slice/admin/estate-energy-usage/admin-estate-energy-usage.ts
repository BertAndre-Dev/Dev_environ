import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import {
  parseEstateEnergyUsageJobResponse,
  type EstateEnergyUsageData,
  type EstateEnergyUsageRange,
} from "@/lib/estate-energy-usage-chart";

const DEFAULT_WAIT_MS = 180_000;
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

async function pollJobResult(
  pollUrl: string,
): Promise<{ body: unknown; meta: EstateEnergyUsageJobMeta }> {
  let attempts = 0;

  while (attempts < MAX_POLL_ATTEMPTS) {
    const res = await axiosInstance.get(pollUrl);
    const body = res.data;
    const meta = extractJobMeta(body);

    if (body?.completed === true) {
      return { body, meta };
    }

    const nextUrl =
      typeof body?.pollUrl === "string" && body.pollUrl.trim()
        ? body.pollUrl
        : pollUrl;

    attempts += 1;
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    pollUrl = nextUrl;
  }

  throw new Error("Estate energy usage aggregation timed out.");
}

/** POST /api/v1/meters/estate/{estateId}/hes/usage/jobs */
export const getEstateEnergyUsage = createAsyncThunk(
  "admin-estate-energy-usage/getUsage",
  async (
    {
      estateId,
      range = "weekly",
      refresh,
      waitMs = DEFAULT_WAIT_MS,
    }: {
      estateId: string;
      range?: EstateEnergyUsageRange;
      refresh?: boolean;
      waitMs?: number;
    },
    { rejectWithValue },
  ) => {
    try {
      const params: Record<string, string> = {
        range,
        waitMs: String(waitMs),
      };
      if (refresh) {
        params.refresh = "true";
      }

      const res = await axiosInstance.post(
        `/api/v1/meters/estate/${estateId}/hes/usage/jobs`,
        {},
        { params },
      );

      let body: unknown = res.data;
      let meta = extractJobMeta(body);

      const record = body as { completed?: boolean; pollUrl?: string };
      if (record?.completed !== true && record?.pollUrl) {
        const polled = await pollJobResult(record.pollUrl);
        body = polled.body;
        meta = { ...meta, ...polled.meta };
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
