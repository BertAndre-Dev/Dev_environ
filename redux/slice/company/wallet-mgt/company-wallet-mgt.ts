import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import { apiErrorRejectValue } from "@/lib/api-error";

export interface CreateCompanyWalletData {
  companyId: string;
  balance?: number;
  lockedBalance?: number;
  accountNumber: string;
  bankCode: string;
}

export interface GetCompanyCreditsParams {
  companyId: string;
  estateId?: string;
  page?: number;
  limit?: number;
  sortBy?: "amount" | "date";
  sortOrder?: "asc" | "desc";
}

export interface GetCompanyT1BreakdownParams {
  companyId: string;
  estateId?: string;
}

export interface GetCompanyT1PendingParams {
  companyId: string;
  estateId?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export interface CompanyWithdrawOtpPayload {
  companyId: string;
  amount: number;
  currency: string;
  bankCode: string;
  accountNumber: string;
  narration: string;
  tx_ref: string;
  gatewayType: string;
}

export interface CompanyTransferPayload extends CompanyWithdrawOtpPayload {
  otp: string;
}

/** POST /api/v1/wallet-mgt */
export const createCompanyWallet = createAsyncThunk(
  "company-wallet-mgt/createCompanyWallet",
  async (data: CreateCompanyWalletData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/v1/wallet-mgt", {
        companyId: data.companyId,
        balance: data.balance ?? 0,
        lockedBalance: data.lockedBalance ?? 0,
        accountNumber: data.accountNumber,
        bankCode: data.bankCode,
      });
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

/** GET /api/v1/wallet-mgt/company/{companyId} */
export const getCompanyWallet = createAsyncThunk(
  "company-wallet-mgt/getCompanyWallet",
  async (companyId: string, { rejectWithValue }) => {
    try {
      if (!companyId) {
        return rejectWithValue({ message: "Company ID is required to fetch wallet" });
      }
      const res = await axiosInstance.get(
        `/api/v1/wallet-mgt/company/${companyId}`,
        { params: { companyId } },
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

/** GET /api/v1/wallet-mgt/company-credits/{companyId} */
export const getCompanyCredits = createAsyncThunk(
  "company-wallet-mgt/getCompanyCredits",
  async (params: GetCompanyCreditsParams, { rejectWithValue }) => {
    try {
      const { companyId, estateId, page = 1, limit = 10, sortBy, sortOrder } =
        params;
      if (!companyId) {
        return rejectWithValue({
          message: "Company ID is required to fetch company credits",
        });
      }
      const res = await axiosInstance.get(
        `/api/v1/wallet-mgt/company-credits/${companyId}`,
        {
          params: {
            companyId,
            estateId,
            page,
            limit,
            sortBy,
            sortOrder,
          },
        },
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

/** GET /api/v1/wallet-mgt/company/t1/breakdown/{companyId} */
export const getCompanyT1Breakdown = createAsyncThunk(
  "company-wallet-mgt/getCompanyT1Breakdown",
  async (params: GetCompanyT1BreakdownParams, { rejectWithValue }) => {
    try {
      const { companyId, estateId } = params;
      if (!companyId) {
        return rejectWithValue({ message: "Company ID is required" });
      }
      const res = await axiosInstance.get(
        `/api/v1/wallet-mgt/company/t1/breakdown/${companyId}`,
        { params: { companyId, estateId } },
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

/** GET /api/v1/wallet-mgt/company/t1/pending/{companyId} */
export const getCompanyT1Pending = createAsyncThunk(
  "company-wallet-mgt/getCompanyT1Pending",
  async (params: GetCompanyT1PendingParams, { rejectWithValue }) => {
    try {
      const { companyId, estateId, page = 1, limit = 10, startDate, endDate } =
        params;
      if (!companyId) {
        return rejectWithValue({ message: "Company ID is required" });
      }
      const res = await axiosInstance.get(
        `/api/v1/wallet-mgt/company/t1/pending/${companyId}`,
        {
          params: { companyId, estateId, page, limit, startDate, endDate },
        },
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

function extractTxRef(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const body = payload as Record<string, unknown>;
  const nested = body.data;
  const fromData =
    nested && typeof nested === "object"
      ? (nested as Record<string, unknown>).tx_ref
      : undefined;
  const value = fromData ?? body.tx_ref;
  return typeof value === "string" ? value : "";
}

/** GET /api/v1/payment-mgt/generate-tx-ref?prefix=tx */
export const generateTxRef = createAsyncThunk(
  "company-wallet-mgt/generateTxRef",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        "/api/v1/payment-mgt/generate-tx-ref",
        { params: { prefix: "tx" } },
      );
      const tx_ref = extractTxRef(res.data);
      if (!tx_ref) {
        return rejectWithValue({
          message: "Failed to generate transaction reference.",
        });
      }
      return { tx_ref };
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

/** POST /api/v1/payment-mgt/company/request-otp */
export const requestCompanyWithdrawOtp = createAsyncThunk(
  "company-wallet-mgt/requestCompanyWithdrawOtp",
  async (data: CompanyWithdrawOtpPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        "/api/v1/payment-mgt/company/request-otp",
        data,
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

/** POST /api/v1/payment-mgt/company/transfer */
export const transferCompanyFunds = createAsyncThunk(
  "company-wallet-mgt/transferCompanyFunds",
  async (data: CompanyTransferPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        "/api/v1/payment-mgt/company/transfer",
        data,
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);
