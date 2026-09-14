import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import {
  parseEstateRealtimeReadingsJobResponse,
  type EstateRealtimeReadingsData,
} from "@/lib/estate-realtime-readings";

const POLL_INTERVAL_MS = 2_000;
const MAX_POLL_ATTEMPTS = 90;

export interface EstateRealtimeReadingsJobMeta {
  jobId?: string;
  progress?: number;
  status?: string;
  source?: string;
}

export interface EstateRealtimeReadingsResult {
  readings: EstateRealtimeReadingsData;
  meta: EstateRealtimeReadingsJobMeta;
}

function extractJobMeta(value: unknown): EstateRealtimeReadingsJobMeta {
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

async function pollJob(
  fetchJob: () => Promise<unknown>,
): Promise<{ body: unknown; meta: EstateRealtimeReadingsJobMeta }> {
  let attempts = 0;
  let lastBody: unknown;
  let lastMeta: EstateRealtimeReadingsJobMeta = {};

  while (attempts < MAX_POLL_ATTEMPTS) {
    lastBody = await fetchJob();
    lastMeta = extractJobMeta(lastBody);

    if (isJobCompleted(lastBody)) {
      return { body: lastBody, meta: lastMeta };
    }

    attempts += 1;
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error("Estate realtime readings aggregation timed out.");
}

/**
 * GET /api/v1/meters/estate/{estateId}/hes/realtime/jobs — queue realtime job,
 * then poll the same GET URL until completed.
 */
export const getEstateRealtimeReadings = createAsyncThunk(
  "staff-estate-realtime-readings/getReadings",
  async (
    {
      estateId,
      refresh,
    }: {
      estateId: string;
      refresh?: boolean;
    },
    { rejectWithValue },
  ) => {
    try {
      const params: Record<string, string> = {};
      if (refresh) {
        params.refresh = "1";
      }

      const realtimeJobsUrl = `/api/v1/meters/estate/${estateId}/hes/realtime/jobs`;
      const initialRes = await axiosInstance.get(realtimeJobsUrl, { params });
      let body: unknown = initialRes.data;
      let meta = extractJobMeta(body);

      if (!isJobCompleted(body)) {
        let pollUrl = resolvePollUrl(body, realtimeJobsUrl);

        const polled = await pollJob(async () => {
          const res =
            pollUrl === realtimeJobsUrl
              ? await axiosInstance.get(realtimeJobsUrl, { params })
              : await axiosInstance.get(pollUrl);
          const nextBody = res.data;
          pollUrl = resolvePollUrl(nextBody, pollUrl);
          return nextBody;
        });

        body = polled.body;
        meta = { ...meta, ...polled.meta };
      }

      const readings = parseEstateRealtimeReadingsJobResponse(body);
      if (!readings) {
        return rejectWithValue({
          message: "Unexpected estate realtime readings response.",
        });
      }

      return {
        readings: {
          ...readings,
          source: readings.source ?? meta.source,
        },
        meta,
      } satisfies EstateRealtimeReadingsResult;
    } catch (error: unknown) {
      const err = error as {
        message?: string;
        response?: { data?: { message?: string } };
      };
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch estate realtime readings.",
      });
    }
  },
);
