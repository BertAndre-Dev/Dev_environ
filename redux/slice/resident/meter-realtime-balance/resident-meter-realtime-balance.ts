import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import {
  parseMeterRealtimeBalanceResponse,
  type MeterRealtimeBalanceData,
} from "@/lib/meter-realtime-balance";

export interface MeterRealtimeBalanceResult {
  balance: MeterRealtimeBalanceData;
}

/** GET /api/v1/meters/realtime/balance/{meterNumber} */
export const getMeterRealtimeBalance = createAsyncThunk(
  "resident-meter-realtime-balance/getBalance",
  async (
    {
      meterNumber,
      refresh,
      includeUsed = true,
    }: {
      meterNumber: string;
      refresh?: boolean;
      includeUsed?: boolean;
    },
    { rejectWithValue },
  ) => {
    try {
      const params: Record<string, string> = {};
      if (refresh) params.refresh = "true";
      if (includeUsed) params.includeUsed = "true";

      const res = await axiosInstance.get(
        `/api/v1/meters/realtime/balance/${encodeURIComponent(meterNumber)}`,
        { params },
      );

      const balance = parseMeterRealtimeBalanceResponse(res.data);
      if (!balance) {
        return rejectWithValue({
          message: "Unexpected realtime balance response.",
        });
      }

      return { balance } satisfies MeterRealtimeBalanceResult;
    } catch (error: unknown) {
      const err = error as {
        message?: string;
        response?: { data?: { message?: string } };
      };
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch realtime meter balance.",
      });
    }
  },
);
