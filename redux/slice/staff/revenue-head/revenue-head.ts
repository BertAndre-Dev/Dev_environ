import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export type RevenueHead = {
  id?: string;
  _id?: string;
  estateId?: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type RevenueHeadListResponse = {
  success?: boolean;
  message?: string;
  data?: RevenueHead[];
  pagination?: {
    total?: number;
    page?: number;
    pages?: number;
    limit?: number;
  };
};

export const createRevenueHead = createAsyncThunk(
  "staff-revenue-head/createRevenueHead",
  async (
    data: { estateId: string; name: string; description?: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.post("/api/v1/revenue-head", data);
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Failed to create revenue head.",
      });
    }
  },
);

export const fetchRevenueHeads = createAsyncThunk(
  "staff-revenue-head/fetchRevenueHeads",
  async (
    {
      estateId,
      page = 1,
      limit = 12,
      startDate,
      endDate,
    }: {
      estateId: string;
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
      // Some backend versions also require the estate id as a query param.
      params.set("estateId", estateId);
      params.set("id", estateId);

      const qs = params.toString();
      const res = await axiosInstance.get(
        `/api/v1/revenue-head/estate/${estateId}${qs ? "?" + qs : ""}`,
      );
      return res.data as RevenueHeadListResponse;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Failed to fetch revenue heads.",
      });
    }
  },
);

export const fetchRevenueHeadById = createAsyncThunk(
  "staff-revenue-head/fetchRevenueHeadById",
  async (id: string, { rejectWithValue }) => {
    try {
      // Backend implementations differ: some require `?id=` even with path param.
      try {
        const res = await axiosInstance.get(`/api/v1/revenue-head/${id}`, {
          params: { id },
        });
        return res.data;
      } catch (err: any) {
        const status = err?.response?.status;
        if (status !== 404 && status !== 500) throw err;
      }

      const res2 = await axiosInstance.get(`/api/v1/revenue-head`, {
        params: { id },
      });
      return res2.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Failed to fetch revenue head.",
      });
    }
  },
);

export const updateRevenueHead = createAsyncThunk(
  "staff-revenue-head/updateRevenueHead",
  async (
    {
      id,
      name,
      description,
    }: { id: string; name: string; description?: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.put(`/api/v1/revenue-head/${id}`, {
        name,
        description,
      });
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Failed to update revenue head.",
      });
    }
  },
);

export const deleteRevenueHead = createAsyncThunk(
  "staff-revenue-head/deleteRevenueHead",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`/api/v1/revenue-head/${id}`, {
        params: { id },
      });
      return res.data ? { id, ...res.data } : { id };
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Failed to delete revenue head.",
      });
    }
  },
);

