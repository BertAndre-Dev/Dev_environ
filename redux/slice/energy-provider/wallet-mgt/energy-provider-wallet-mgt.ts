import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export interface CreateEnergyProviderWalletData {
  bankCode: string;
  accountNumber: string;
  balance?: number;
}

export interface GetEnergyProviderCreditsParams {
  userId: string;
  estateId?: string;
  page?: number;
  limit?: number;
  sortBy?: "amount" | "date";
  sortOrder?: "asc" | "desc";
}

export interface EnergyProviderWithdrawOtpPayload {
  estateId: string;
  amount: number;
  currency: string;
  bankCode: string;
  accountNumber: string;
  narration: string;
  tx_ref: string;
  gatewayType: string;
}

export interface EnergyProviderTransferPayload
  extends EnergyProviderWithdrawOtpPayload {
  otp: string;
}

function getErrorMessage(error: unknown, fallback: string) {
  const err = error as { response?: { data?: { message?: string | string[] } } };
  const msg = err?.response?.data?.message;
  return Array.isArray(msg) ? msg[0] : msg ?? fallback;
}

/** POST /api/v1/wallet-mgt/energy-provider */
export const createEnergyProviderWallet = createAsyncThunk(
  "energy-provider-wallet-mgt/createWallet",
  async (data: CreateEnergyProviderWalletData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/v1/wallet-mgt/energy-provider", {
        bankCode: data.bankCode.trim(),
        accountNumber: data.accountNumber.trim(),
        balance: data.balance ?? 0,
      });
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue({
        message: getErrorMessage(error, "Wallet creation failed"),
      });
    }
  },
);

/** GET /api/v1/wallet-mgt/energy-provider/{userId} */
export const getEnergyProviderWallet = createAsyncThunk(
  "energy-provider-wallet-mgt/getWallet",
  async (userId: string, { rejectWithValue }) => {
    try {
      if (!userId) {
        return rejectWithValue({ message: "User ID is required to fetch wallet" });
      }
      const res = await axiosInstance.get(
        `/api/v1/wallet-mgt/energy-provider/${userId}`,
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to fetch wallet"),
      });
    }
  },
);

/** GET /api/v1/wallet-mgt/energy-provider-credits/{userId} */
export const getEnergyProviderCredits = createAsyncThunk(
  "energy-provider-wallet-mgt/getCredits",
  async (params: GetEnergyProviderCreditsParams, { rejectWithValue }) => {
    try {
      const { userId, estateId, page = 1, limit = 10, sortBy, sortOrder } = params;
      if (!userId) {
        return rejectWithValue({
          message: "User ID is required to fetch wallet history",
        });
      }
      const res = await axiosInstance.get(
        `/api/v1/wallet-mgt/energy-provider-credits/${userId}`,
        {
          params: {
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
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to fetch wallet history"),
      });
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
  "energy-provider-wallet-mgt/generateTxRef",
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
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to generate transaction reference."),
      });
    }
  },
);

/** POST /api/v1/payment-mgt/energy-provider/request-otp */
export const requestEnergyProviderWithdrawOtp = createAsyncThunk(
  "energy-provider-wallet-mgt/requestWithdrawOtp",
  async (data: EnergyProviderWithdrawOtpPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        "/api/v1/payment-mgt/energy-provider/request-otp",
        data,
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to request transfer OTP"),
      });
    }
  },
);

/** POST /api/v1/payment-mgt/energy-provider/transfer */
export const transferEnergyProviderFunds = createAsyncThunk(
  "energy-provider-wallet-mgt/transferFunds",
  async (data: EnergyProviderTransferPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        "/api/v1/payment-mgt/energy-provider/transfer",
        data,
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to transfer funds"),
      });
    }
  },
);
