import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import type { RevenueBySegmentResponse } from "@/types/analytics";
import { apiErrorRejectValue } from "@/lib/api-error";

/** GET /api/v1/analytics/commercial/revenue */
export const getRevenueBySegment = createAsyncThunk(
  "super-admin-revenue-by-segment/get",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get<RevenueBySegmentResponse>(
        "/api/v1/analytics/commercial/revenue",
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);
