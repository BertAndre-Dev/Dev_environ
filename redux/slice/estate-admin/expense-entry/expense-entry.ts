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

export const createExpenseEntriesBulk = createAsyncThunk(
  "estate-admin-expense-entry/createExpenseEntriesBulk",
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

export const getExpenseEntriesByHead = createAsyncThunk(
  "estate-admin-expense-entry/getExpenseEntriesByHead",
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

export const updateExpenseEntry = createAsyncThunk(
  "estate-admin-expense-entry/updateExpenseEntry",
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
  "estate-admin-expense-entry/deleteExpenseEntry",
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

