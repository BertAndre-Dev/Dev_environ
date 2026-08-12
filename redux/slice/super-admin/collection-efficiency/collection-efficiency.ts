import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import type { CollectionEfficiencyResponse } from "@/types/analytics";
import { apiErrorRejectValue } from "@/lib/api-error";

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
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);
