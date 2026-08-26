import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import {
  EXPENSE_ENTRY_BULK_MAX,
  parseExpenseAttachments,
  toExpenseEntryBulkBody,
  toExpenseEntryUpdateBody,
  type ExpenseEntryUpdateArg,
  type ExpenseEntryWriteItem,
} from "@/lib/expense-entry";

export type ExpenseEntry = {
  id?: string;
  _id?: string;
  headId: string;
  description: string;
  documentNumber: string;
  amount: number;
  attachments?: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type ExpenseEntryListResponse = {
  success?: boolean;
  message?: string;
  data?: ExpenseEntry[];
  pagination?: {
    total?: number;
    page?: number;
    pages?: number;
    limit?: number;
  };
};

export const createExpenseEntries = createAsyncThunk(
  "staff-expense-entry/createExpenseEntries",
  async (
    payload: { entries: ExpenseEntryWriteItem[] },
    { rejectWithValue },
  ) => {
    try {
      if (payload.entries.length > EXPENSE_ENTRY_BULK_MAX) {
        return rejectWithValue({
          message: `Max ${EXPENSE_ENTRY_BULK_MAX} entries per request.`,
        });
      }
      const res = await axiosInstance.post(
        "/api/v1/expense-entry",
        toExpenseEntryBulkBody(payload.entries),
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Failed to create expense entries.",
      });
    }
  },
);

export const fetchExpenseEntries = createAsyncThunk(
  "staff-expense-entry/fetchExpenseEntries",
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
        `/api/v1/expense-entry/head/${headId}${qs ? "?" + qs : ""}`,
      );
      const data = res.data as ExpenseEntryListResponse;
      return {
        ...data,
        data: Array.isArray(data.data)
          ? data.data.map((item) => ({
              ...item,
              attachments: parseExpenseAttachments(item.attachments),
            }))
          : data.data,
      };
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Failed to fetch expense entries for head.",
      });
    }
  },
);

export const fetchExpenseEntryById = createAsyncThunk(
  "staff-expense-entry/fetchExpenseEntryById",
  async (id: string, { rejectWithValue }) => {
    try {
      // Backend implementations differ: some do not expose GET /expense-entry/:id.
      try {
        const res = await axiosInstance.get(`/api/v1/expense-entry/${id}`, {
          params: { id },
        });
        return res.data;
      } catch (err: any) {
        const status = err?.response?.status;
        // If route is missing (404) try query-based fallback.
        if (status !== 404 && status !== 500) throw err;
      }

      const res2 = await axiosInstance.get(`/api/v1/expense-entry`, {
        params: { id },
      });
      return res2.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Failed to fetch expense entry.",
      });
    }
  },
);

export const updateExpenseEntry = createAsyncThunk(
  "staff-expense-entry/updateExpenseEntry",
  async ({ id, ...fields }: ExpenseEntryUpdateArg, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(
        `/api/v1/expense-entry/${id}`,
        toExpenseEntryUpdateBody(fields),
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Failed to update expense entry.",
      });
    }
  },
);

export const deleteExpenseEntry = createAsyncThunk(
  "staff-expense-entry/deleteExpenseEntry",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`/api/v1/expense-entry/${id}`);
      return res.data ? { id, ...res.data } : { id };
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Failed to delete expense entry.",
      });
    }
  },
);

