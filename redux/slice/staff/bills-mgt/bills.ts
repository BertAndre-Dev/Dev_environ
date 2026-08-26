import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import { getApiErrorMessage } from "@/lib/api-error";

export const BILL_FREQUENCY_VALUES = [
  "oneoff",
  "monthly",
  "quarterly",
  "yearly",
] as const;

export type BillFrequency = (typeof BILL_FREQUENCY_VALUES)[number];

export const BILL_FREQUENCY_OPTIONS: { label: string; value: BillFrequency }[] =
  [
    { label: "One-off", value: "oneoff" },
    { label: "Monthly", value: "monthly" },
    { label: "Quarterly", value: "quarterly" },
    { label: "Yearly", value: "yearly" },
  ];

/** Service-charge bills may only be billed quarterly or yearly. */
export const SERVICE_CHARGE_FREQUENCY_VALUES: BillFrequency[] = [
  "quarterly",
  "yearly",
];

export function billFrequencyOptions(
  isServiceCharge?: boolean,
): { label: string; value: BillFrequency }[] {
  if (!isServiceCharge) return BILL_FREQUENCY_OPTIONS;
  return BILL_FREQUENCY_OPTIONS.filter((option) =>
    SERVICE_CHARGE_FREQUENCY_VALUES.includes(option.value),
  );
}

export function coerceFrequencyForServiceCharge(
  frequency: BillFrequency,
  isServiceCharge?: boolean,
): BillFrequency {
  if (!isServiceCharge) return frequency;
  if (frequency === "quarterly" || frequency === "yearly") return frequency;
  return "yearly";
}

export function normalizeBillFrequency(
  value?: string,
  fallback: BillFrequency = "yearly",
): BillFrequency {
  const normalized = (value ?? "").toLowerCase().replace(/[_-]/g, "");
  if (normalized === "oneoff") return "oneoff";
  if (normalized === "monthly") return "monthly";
  if (normalized === "quarterly") return "quarterly";
  if (normalized === "yearly") return "yearly";
  return fallback;
}

interface BillData {
  estateId: string;
  name: string;
  description: string;
  yearlyAmount?: number;
  amount?: number;
  frequency: BillFrequency;
  isServiceCharge?: boolean;
  compulsory?: boolean;
  accrueInterest?: boolean;
  interestRatePercent?: number;
  interestStartsAt?: string;
}

export interface CreateBillForAddressPayload {
  addressId: string;
  estateId: string;
  name: string;
  description: string;
  amount: number;
  frequency: BillFrequency;
  isServiceCharge?: boolean;
  compulsory?: boolean;
  accrueInterest?: boolean;
  interestRatePercent?: number;
  interestStartsAt?: string;
}

export interface UpdateBillPayload {
  estateId: string;
  name: string;
  description: string;
  yearlyAmount?: number;
  amount?: number;
  frequency: BillFrequency;
  isServiceCharge?: boolean;
  compulsory?: boolean;
  accrueInterest?: boolean;
  interestRatePercent?: number;
  interestStartsAt?: string;
}

export interface UpdateBillForAddressPayload {
  name: string;
  description: string;
  amount: number;
  frequency?: BillFrequency;
  isServiceCharge?: boolean;
  compulsory?: boolean;
  accrueInterest?: boolean;
  interestRatePercent?: number;
  interestStartsAt?: string;
}

function billAmount(data: { amount?: number; yearlyAmount?: number }) {
  return data.amount ?? data.yearlyAmount ?? 0;
}

function billInterestFields(data: {
  accrueInterest?: boolean;
  interestRatePercent?: number;
  interestStartsAt?: string;
}) {
  if (typeof data.accrueInterest !== "boolean") return {};
  const accrueInterest = data.accrueInterest;
  const interestStartsAt = accrueInterest
    ? String(data.interestStartsAt ?? "").trim().slice(0, 10)
    : "";
  return {
    accrueInterest,
    interestRatePercent: accrueInterest ? Number(data.interestRatePercent) || 0 : 0,
    ...(accrueInterest && interestStartsAt ? { interestStartsAt } : {}),
  };
}

// Create estate bill
export const createBill = createAsyncThunk(
  "staff-bills/createBill",
  async (data: BillData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/v1/bills-mgt", {
        estateId: data.estateId,
        name: data.name,
        description: data.description,
        amount: billAmount(data),
        frequency: data.frequency,
        ...(data.isServiceCharge != null
          ? { isServiceCharge: data.isServiceCharge }
          : {}),
        compulsory: data.compulsory ?? false,
        ...billInterestFields(data),
      });
      return res.data;
    } catch (error: unknown) {
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") return rejectWithValue(data);
      return rejectWithValue({
        message: getApiErrorMessage(error) ?? "Failed to create bill",
      });
    }
  },
);

// Update estate bill
export const updateBill = createAsyncThunk(
  "staff-bills/updateBill",
  async (
    { billId, data }: { billId: string; data: UpdateBillPayload },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.put(`/api/v1/bills-mgt/${billId}`, {
        estateId: data.estateId,
        name: data.name,
        description: data.description,
        amount: billAmount(data),
        frequency: data.frequency,
        ...(data.isServiceCharge != null
          ? { isServiceCharge: data.isServiceCharge }
          : {}),
        compulsory: data.compulsory ?? false,
        ...billInterestFields(data),
      });
      return res.data;
    } catch (error: unknown) {
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") return rejectWithValue(data);
      return rejectWithValue({
        message: getApiErrorMessage(error) ?? "Failed to update bill",
      });
    }
  },
);

// Update address-specific (assigned) bill
export const updateBillForAddress = createAsyncThunk(
  "staff-bills/updateBillForAddress",
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
          ...(data.frequency ? { frequency: data.frequency } : {}),
          ...(data.isServiceCharge != null
            ? { isServiceCharge: data.isServiceCharge }
            : {}),
          compulsory: data.compulsory ?? false,
          ...billInterestFields(data),
        },
      );
      return res.data;
    } catch (error: unknown) {
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") return rejectWithValue(data);
      return rejectWithValue({
        message: getApiErrorMessage(error) ?? "Failed to update assigned bill",
      });
    }
  },
);

// Delete existing bill
export const deleteBill = createAsyncThunk(
  "staff-bills/deleteBill",
  async (billId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`/api/v1/bills-mgt/${billId}`);
      return res.data;
    } catch (error: unknown) {
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") return rejectWithValue(data);
      return rejectWithValue({
        message: getApiErrorMessage(error) ?? "Failed to delete bill",
      });
    }
  },
);

// Suspend an existing bill
export const suspendBill = createAsyncThunk(
  "staff-bills/suspendBill",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(
        `/api/v1/bills-mgt/${id}/suspend-bill`,
      );
      return res.data;
    } catch (error: unknown) {
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") return rejectWithValue(data);
      return rejectWithValue({
        message: getApiErrorMessage(error) ?? "Failed to suspend bill",
      });
    }
  },
);

// Activate an existing bill
export const activateBill = createAsyncThunk(
  "staff-bills/activateBill",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(
        `/api/v1/bills-mgt/${id}/activate-bill`,
      );
      return res.data;
    } catch (error: unknown) {
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") return rejectWithValue(data);
      return rejectWithValue({
        message: getApiErrorMessage(error) ?? "Failed to activate bill",
      });
    }
  },
);

// Get bill
export const getBill = createAsyncThunk(
  "staff-bills/getBill",
  async (billId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/api/v1/bills-mgt/${billId}`);
      return res.data;
    } catch (error: unknown) {
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") return rejectWithValue(data);
      return rejectWithValue({
        message: getApiErrorMessage(error) ?? "Failed to fetch bill",
      });
    }
  },
);

// Get bills by estate (with pagination)
export const getBillsByEstate = createAsyncThunk(
  "staff-bills/getBillsByEstate",
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
    } catch (error: unknown) {
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") return rejectWithValue(data);
      return rejectWithValue({
        message: getApiErrorMessage(error) ?? "Failed to fetch bills",
      });
    }
  },
);

// Get bills assigned to a specific address (with pagination)
export const getBillsForAddress = createAsyncThunk(
  "staff-bills/getBillsForAddress",
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
    } catch (error: unknown) {
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") return rejectWithValue(data);
      return rejectWithValue({
        message:
          getApiErrorMessage(error) ?? "Failed to fetch bills for address",
      });
    }
  },
);

// Create one-off bill for a specific address
export const createBillForAddress = createAsyncThunk(
  "staff-bills/createBillForAddress",
  async (data: CreateBillForAddressPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        "/api/v1/bills-mgt/for-address/create",
        {
          addressId: data.addressId,
          estateId: data.estateId,
          name: data.name,
          description: data.description,
          amount: data.amount,
          frequency: data.frequency,
          ...(data.isServiceCharge != null
            ? { isServiceCharge: data.isServiceCharge }
            : {}),
          compulsory: data.compulsory ?? false,
          ...billInterestFields(data),
        },
      );
      return res.data;
    } catch (error: unknown) {
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") return rejectWithValue(data);
      return rejectWithValue({
        message:
          getApiErrorMessage(error) ?? "Failed to create bill for address",
      });
    }
  },
);
