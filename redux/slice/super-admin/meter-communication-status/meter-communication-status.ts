import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import type { MeterCommunicationStatusResponse } from "@/types/analytics";
import { getApiErrorMessage } from "@/lib/api-error";

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
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") return rejectWithValue(data);
      return rejectWithValue({ message: getApiErrorMessage(error) });
    }
  },
);
