import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import type { ConsumptionSnapshotResponse } from "@/types/analytics";
import { apiErrorRejectValue } from "@/lib/api-error";

/** GET /api/v1/analytics/operations/consumption/trends (snapshot, not a time series) */
export const getConsumptionSnapshot = createAsyncThunk(
  "super-admin-consumption-snapshot/get",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get<ConsumptionSnapshotResponse>(
        "/api/v1/analytics/operations/consumption/trends",
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);
