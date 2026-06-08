import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import {
  parseEstateRealtimeReadingsJobResponse,
  type EstateRealtimeReadingsData,
} from "@/lib/estate-realtime-readings";

const DEFAULT_WAIT_MS = 120_000;
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

async function pollJobResult(
  pollUrl: string,
): Promise<{ body: unknown; meta: EstateRealtimeReadingsJobMeta }> {
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

  throw new Error("Estate realtime readings aggregation timed out.");
}

/** POST /api/v1/meters/estate/{estateId}/hes/realtime/jobs */
export const getEstateRealtimeReadings = createAsyncThunk(
  "admin-estate-realtime-readings/getReadings",
  async (
    {
      estateId,
      waitMs = DEFAULT_WAIT_MS,
    }: {
      estateId: string;
      waitMs?: number;
    },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.post(
        `/api/v1/meters/estate/${estateId}/hes/realtime/jobs`,
        {},
        { params: { waitMs: String(waitMs) } },
      );

      let body: unknown = res.data;
      let meta = extractJobMeta(body);

      const record = body as { completed?: boolean; pollUrl?: string };
      if (record?.completed !== true && record?.pollUrl) {
        const polled = await pollJobResult(record.pollUrl);
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
