import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import { getApiErrorMessage } from "@/lib/api-error";

export type CompanyRevenueEntry = {
  id?: string;
  _id?: string;
  headId: string;
  description: string;
  documentNumber: string;
  amount: number;
  createdAt?: string;
  updatedAt?: string;
};

export type CompanyRevenueEntryListResponse = {
  success?: boolean;
  message?: string;
  data?: CompanyRevenueEntry[];
  pagination?: {
    total?: number;
    page?: number;
    pages?: number;
    limit?: number;
  };
};

export const createCompanyRevenueEntries = createAsyncThunk(
  "company-revenue-entry/createCompanyRevenueEntries",
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
    } catch (error: unknown) {
      return rejectWithValue({ message: getApiErrorMessage(error) });
    }
  },
);

export const fetchCompanyRevenueEntries = createAsyncThunk(
  "company-revenue-entry/fetchCompanyRevenueEntries",
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
      return res.data as CompanyRevenueEntryListResponse;
    } catch (error: unknown) {
      return rejectWithValue({ message: getApiErrorMessage(error) });
    }
  },
);

export const fetchCompanyRevenueEntryById = createAsyncThunk(
  "company-revenue-entry/fetchCompanyRevenueEntryById",
  async (id: string, { rejectWithValue }) => {
    try {
      try {
        const res = await axiosInstance.get(`/api/v1/revenue-entry/${id}`, {
          params: { id },
        });
        return res.data;
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        if (status !== 404 && status !== 500) throw err;
      }

      const res2 = await axiosInstance.get(`/api/v1/revenue-entry`, {
        params: { id },
      });
      return res2.data;
    } catch (error: unknown) {
      return rejectWithValue({ message: getApiErrorMessage(error) });
    }
  },
);

export const updateCompanyRevenueEntry = createAsyncThunk(
  "company-revenue-entry/updateCompanyRevenueEntry",
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
    } catch (error: unknown) {
      return rejectWithValue({ message: getApiErrorMessage(error) });
    }
  },
);

export const deleteCompanyRevenueEntry = createAsyncThunk(
  "company-revenue-entry/deleteCompanyRevenueEntry",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`/api/v1/revenue-entry/${id}`);
      return res.data ? { id, ...res.data } : { id };
    } catch (error: unknown) {
      return rejectWithValue({ message: getApiErrorMessage(error) });
    }
  },
);
