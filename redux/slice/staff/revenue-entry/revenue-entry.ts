import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export type RevenueEntry = {
  id?: string;
  _id?: string;
  headId: string;
  description: string;
  documentNumber: string;
  amount: number;
  createdAt?: string;
  updatedAt?: string;
};

export type RevenueEntryListResponse = {
  success?: boolean;
  message?: string;
  data?: RevenueEntry[];
  pagination?: {
    total?: number;
    page?: number;
    pages?: number;
    limit?: number;
  };
};

export const createRevenueEntries = createAsyncThunk(
  "staff-revenue-entry/createRevenueEntries",
  async (
    payload: {
      entries: Array<{
        headId: string;
        description: string;
        documentNumber: string;
        amount: number;
      }>;
    },
    { rejectWithValue },
  ) => {
    try {
      if (payload.entries.length > 100) {
        return rejectWithValue({
          message: "Max 100 entries per request.",
        });
      }
      const res = await axiosInstance.post("/api/v1/revenue-entry", payload);
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Failed to create revenue entries.",
      });
    }
  },
);

export const fetchRevenueEntries = createAsyncThunk(
  "staff-revenue-entry/fetchRevenueEntries",
  async (
    {
      headId,
      page = 1,
      limit = 10,
      startDate,
      endDate,
    }: {
      headId: string;
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const qs = params.toString();
      const res = await axiosInstance.get(
        `/api/v1/revenue-entry/head/${headId}${qs ? "?" + qs : ""}`,
      );
      return res.data as RevenueEntryListResponse;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Failed to fetch revenue entries for head.",
      });
    }
  },
);

export const fetchRevenueEntryById = createAsyncThunk(
  "staff-revenue-entry/fetchRevenueEntryById",
  async (id: string, { rejectWithValue }) => {
    try {
      // Backend implementations differ: some do not expose GET /revenue-entry/:id.
      try {
        const res = await axiosInstance.get(`/api/v1/revenue-entry/${id}`, {
          params: { id },
        });
        return res.data;
      } catch (err: any) {
        const status = err?.response?.status;
        // If route is missing (404) try query-based fallback.
        if (status !== 404 && status !== 500) throw err;
      }

      const res2 = await axiosInstance.get(`/api/v1/revenue-entry`, {
        params: { id },
      });
      return res2.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Failed to fetch revenue entry.",
      });
    }
  },
);

export const updateRevenueEntry = createAsyncThunk(
  "staff-revenue-entry/updateRevenueEntry",
  async (
    {
      id,
      headId,
      description,
      documentNumber,
      amount,
    }: {
      id: string;
      headId: string;
      description: string;
      documentNumber: string;
      amount: number;
    },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.put(`/api/v1/revenue-entry/${id}`, {
        headId,
        description,
        documentNumber,
        amount,
      });
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Failed to update revenue entry.",
      });
    }
  },
);

export const deleteRevenueEntry = createAsyncThunk(
  "staff-revenue-entry/deleteRevenueEntry",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`/api/v1/revenue-entry/${id}`);
      return res.data ? { id, ...res.data } : { id };
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Failed to delete revenue entry.",
      });
    }
  },
);

