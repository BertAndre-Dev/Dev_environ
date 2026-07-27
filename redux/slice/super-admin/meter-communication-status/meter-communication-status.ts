import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import type { MeterCommunicationStatusResponse } from "@/types/analytics";

/** GET /api/v1/analytics/operations/meters/communication-status */
export const getMeterCommunicationStatus = createAsyncThunk(
  "super-admin-meter-communication-status/get",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get<MeterCommunicationStatusResponse>(
        "/api/v1/analytics/operations/meters/communication-status",
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      return rejectWithValue({
        message:
          err.response?.data?.message ||
          err.message ||
          "Failed to fetch meter communication status.",
      });
    }
  },
);
