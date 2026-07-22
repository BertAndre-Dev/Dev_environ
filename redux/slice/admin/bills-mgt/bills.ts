import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

interface BillData {
  estateId: string;
  name: string;
  description: string;
  yearlyAmount: number;
}

export interface CreateBillForAddressPayload {
  addressId: string;
  estateId: string;
  name: string;
  description: string;
  amount: number;
  frequency: "quarterly" | "yearly" | "oneOff";
  isServiceCharge: boolean;
}

export interface UpdateBillPayload {
  estateId: string;
  name: string;
  description: string;
  yearlyAmount: number;
}

export interface UpdateBillForAddressPayload {
  name: string;
  description: string;
  amount: number;
  isServiceCharge: boolean;
}

// Create estate bill
export const createBill = createAsyncThunk(
  "bills/createBill",
  async (data: BillData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/v1/bills-mgt", data);
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message: error.res?.data?.message,
      });
    }
  },
);

// Update estate bill
export const updateBill = createAsyncThunk(
  "bills/updateBill",
  async (
    { billId, data }: { billId: string; data: UpdateBillPayload },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.put(`/api/v1/bills-mgt/${billId}`, data);
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          error.res?.data?.message ||
          "Failed to update bill",
      });
    }
  },
);

// Update address-specific (assigned) bill
export const updateBillForAddress = createAsyncThunk(
  "bills/updateBillForAddress",
  async (
    {
      billId,
      data,
    }: { billId: string; data: UpdateBillForAddressPayload },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.put(
        `/api/v1/bills-mgt/for-address/${billId}`,
        {
          name: data.name,
          description: data.description,
          amount: data.amount,
          isServiceCharge: data.isServiceCharge,
        },
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          error.res?.data?.message ||
          "Failed to update assigned bill",
      });
    }
  },
);

// Delete existing bill
export const deleteBill = createAsyncThunk(
  "bills/deleteBill",
  async (billId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`/api/v1/bills-mgt/${billId}`);
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message: error.res?.data?.message,
      });
    }
  },
);

// Suspend an existing bill
export const suspendBill = createAsyncThunk(
  "bills/suspendBill",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(
        `/api/v1/bills-mgt/${id}/suspend-bill`,
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message: error.res?.data?.message,
      });
    }
  },
);

// Activate an existing bill
export const activateBill = createAsyncThunk(
  "bills/activateBill",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(
        `/api/v1/bills-mgt/${id}/activate-bill`,
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message: error.res?.data?.message,
      });
    }
  },
);

// Get bill
export const getBill = createAsyncThunk(
  "bills/getBill",
  async (billId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/api/v1/bills-mgt/${billId}`);
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message: error.res?.data?.message,
      });
    }
  },
);

// Get bills by estate (with pagination)
export const getBillsByEstate = createAsyncThunk(
  "bills/getBillsByEstate",
  async (
    {
      estateId,
      page = 1,
      limit = 10,
      startDate,
      endDate,
    }: { estateId: string; page?: number; limit?: number; startDate?: string; endDate?: string },
    { rejectWithValue },
  ) => {
    try {
      const params = new URLSearchParams();
      if (page != null) params.set("page", String(page));
      if (limit != null) params.set("limit", String(limit));
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const query = params.toString();
      const suffix = query ? "?" + query : "";
      const res = await axiosInstance.get(
        `/api/v1/bills-mgt/bills/${estateId}` + suffix,
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message: error?.response?.data?.message || "Failed to fetch bills",
      });
    }
  },
);

// Get bills assigned to a specific address (with pagination)
export const getBillsForAddress = createAsyncThunk(
  "bills/getBillsForAddress",
  async (
    {
      addressId,
      estateId,
      page = 1,
      limit = 10,
      startDate,
      endDate,
    }: {
      addressId: string;
      estateId: string;
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const params = new URLSearchParams({
        addressId,
        estateId,
        page: String(page),
        limit: String(limit),
      });
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await axiosInstance.get(
        `/api/v1/bills-mgt/for-address?${params.toString()}`,
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Failed to fetch bills for address",
      });
    }
  },
);

// Create one-off bill for a specific address
export const createBillForAddress = createAsyncThunk(
  "bills/createBillForAddress",
  async (data: CreateBillForAddressPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        "/api/v1/bills-mgt/for-address/create",
        data,
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ??
          error.res?.data?.message ??
          "Failed to create bill for address",
      });
    }
  },
);
