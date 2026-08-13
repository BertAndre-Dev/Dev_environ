import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import type { TransactionSummaryResponse } from "@/types/analytics";

export type {
  TransactionSummary,
  TransactionSummaryResponse,
} from "@/types/analytics";

/** GET /api/v1/analytics/transactions/summary (estate admin overview) */
export const getEstateAdminTransactionSummary = createAsyncThunk(
  "estate-admin-transaction-summary/getSummary",
  async ({ estateId }: { estateId: string }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get<TransactionSummaryResponse>(
        "/api/v1/analytics/transactions/summary",
        { params: { estateId } },
      );
      return res.data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to fetch transaction summary.",
      });
    }
  },
);
