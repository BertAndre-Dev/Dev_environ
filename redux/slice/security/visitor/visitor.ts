import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import { getApiErrorMessage } from "@/lib/api-error";

export type VisitingType = "SHORT_VISIT" | "LONG_VISIT";

/** Response `action` from POST /visitor-mgt/gate */
export type GateAction =
  | "VIEWED"
  | "CHECKED_IN"
  | "VERIFIED"
  | "CHECKED_OUT";

/** Suggested following step from the gate API */
export type GateNextAction =
  | "VIEW"
  | "VERIFY"
  | "CHECK_IN"
  | "CHECK_OUT"
  | "NONE"
  | null;

export type GateVisitorParams = {
  /** Visitor code, verification code, or offline token */
  code: string;
};

export type ScanVisitorParams = {
  barcode: string;
  visitingType?: VisitingType;
  visitEndDate?: string;
};

export type VerifyVisitorParams = {
  visitorCode: string;
  visitingType: VisitingType;
  visitEndDate?: string;
};

function rejectApiError(error: unknown, rejectWithValue: (v: unknown) => unknown) {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (data) return rejectWithValue(data);
  const message = getApiErrorMessage(error);
  if (message) return rejectWithValue({ message });
  return rejectWithValue(error);
}

export const getAllVisitors = createAsyncThunk(
  "securityVisitor/getAllVisitors",
  async (
    {
      estateId,
      page = 1,
      limit = 10,
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

      const res = await axiosInstance.get(
        `/api/v1/visitor-mgt/all-visitors/${estateId}?${params.toString()}`,
      );
      return res.data;
    } catch (error: unknown) {
      return rejectApiError(error, rejectWithValue);
    }
  },
);

/**
 * POST /api/v1/visitor-mgt/gate
 * One call for typed code or scanned QR / barcode.
 * Estate verification mode decides the step: VIEWED → VERIFIED/CHECKED_IN → CHECKED_OUT.
 */
export const gateVisitor = createAsyncThunk(
  "securityVisitor/gateVisitor",
  async ({ code }: GateVisitorParams, { rejectWithValue }) => {
    const trimmed = code.trim();
    if (!trimmed) {
      return rejectWithValue({ message: "Visitor code is required" });
    }

    try {
      const res = await axiosInstance.post("/api/v1/visitor-mgt/gate", {
        code: trimmed,
      });
      return res.data;
    } catch (error: unknown) {
      return rejectApiError(error, rejectWithValue);
    }
  },
);

/** Legacy lookup — prefer gateVisitor for gate operations. */
export const getVisitorDetailsByCode = createAsyncThunk(
  "securityVisitor/getVisitorDetailsByCode",
  async ({ code }: { code: string }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/api/v1/visitor-mgt/view-details`, {
        params: { code },
      });
      return res.data;
    } catch (error: unknown) {
      return rejectApiError(error, rejectWithValue);
    }
  },
);

/** Legacy scan — prefer gateVisitor for gate operations. */
export const scanVisitor = createAsyncThunk(
  "securityVisitor/scanVisitor",
  async (params: ScanVisitorParams, { rejectWithValue }) => {
    const barcode = params.barcode.trim();
    if (!barcode) {
      return rejectWithValue({ message: "Barcode is required" });
    }

    try {
      const body: Record<string, string> = { barcode };
      if (params.visitingType) body.visitingType = params.visitingType;
      if (params.visitEndDate) body.visitEndDate = params.visitEndDate;

      const res = await axiosInstance.post("/api/v1/visitor-mgt/scan", body);
      return res.data;
    } catch (error: unknown) {
      return rejectApiError(error, rejectWithValue);
    }
  },
);

/** Legacy verify — prefer gateVisitor for gate operations. */
export const verifyVisitor = createAsyncThunk(
  "securityVisitor/verifyVisitor",
  async (params: VerifyVisitorParams, { rejectWithValue }) => {
    const visitorCode = params.visitorCode.trim();
    if (!visitorCode) {
      return rejectWithValue({ message: "Visitor code is required" });
    }

    try {
      const body: Record<string, string> = {
        visitorCode,
        visitingType: params.visitingType,
      };
      if (params.visitEndDate) body.visitEndDate = params.visitEndDate;

      const res = await axiosInstance.put(
        "/api/v1/visitor-mgt/verify-code",
        body,
      );
      return res.data;
    } catch (error: unknown) {
      return rejectApiError(error, rejectWithValue);
    }
  },
);

/** Legacy checkout — prefer gateVisitor for gate operations. */
export const checkoutVisitor = createAsyncThunk(
  "securityVisitor/checkoutVisitor",
  async ({ visitorCode }: { visitorCode: string }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/v1/visitor-mgt/checkout", {
        visitorCode,
      });
      return res.data;
    } catch (error: unknown) {
      return rejectApiError(error, rejectWithValue);
    }
  },
);
