import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import type { CollectionEfficiencyResponse } from "@/types/analytics";
import { getApiErrorMessage } from "@/lib/api-error";

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
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") return rejectWithValue(data);
      return rejectWithValue({ message: getApiErrorMessage(error) });
    }
  },
);
