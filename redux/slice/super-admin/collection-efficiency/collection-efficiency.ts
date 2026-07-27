import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import type { CollectionEfficiencyResponse } from "@/types/analytics";

/** GET /api/v1/analytics/finance/collection-efficiency */
export const getCollectionEfficiency = createAsyncThunk(
  "super-admin-collection-efficiency/get",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get<CollectionEfficiencyResponse>(
        "/api/v1/analytics/finance/collection-efficiency",
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
          "Failed to fetch collection efficiency.",
      });
    }
  },
);
