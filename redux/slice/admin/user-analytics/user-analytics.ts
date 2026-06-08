import { createAsyncThunk } from "@reduxjs/toolkit";

import { extractEstateId } from "@/lib/user-id";
import axiosInstance from "@/utils/axiosInstance";

export interface ResidentTypeStats {
  total: number;
  active: number;
  averageAddressCount: number;
}

export interface ResidentTypeBreakdownData {
  owner: ResidentTypeStats;
  tenant: ResidentTypeStats;
}

export interface ResidentTypeBreakdownResponse {
  success: boolean;
  message: string;
  data: ResidentTypeBreakdownData;
}

export const getResidentTypeBreakdown = createAsyncThunk(
  "adminUserAnalytics/getResidentTypeBreakdown",
  async ({ estateId }: { estateId: string }, { rejectWithValue }) => {
    const id = extractEstateId(estateId);
    if (!id) {
      return rejectWithValue({ message: "Invalid estate ID." });
    }
    try {
      const res = await axiosInstance.get<ResidentTypeBreakdownResponse>(
        "/api/v1/user-analytics/resident-type-breakdown",
        { params: { estateId: id } },
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to fetch resident type breakdown.",
      });
    }
  },
);
