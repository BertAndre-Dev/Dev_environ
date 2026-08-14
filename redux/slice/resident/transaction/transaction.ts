import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";



interface TransactionData {
  walletId: string;
  type: string;
  amount: number;
  description: string;
  userId: string;
  serviceCharge?: number;
  role?: string;
  residentType?: string | null;
  balanceType?: string;
  isAuditOnly?: boolean;
}


interface VerifyTransactionPayload {
  tx_ref: string;
  paymentType: string;
}

interface PaymentCustomer {
  email: string;
}

interface PaymentCustomizations {
  title: string;
  description: string;
}

interface PaymentPayload {
  tx_ref: string;
  amount: number;
  country: string;
  currency: string;
  redirect_url: string;
  payment_options: string; // e.g., "card"
  gatewayType: string;
  customer: PaymentCustomer;
  customizations: PaymentCustomizations;
}


export const createTransaction = createAsyncThunk(
    "transaction/createTransaction",
    async (data: TransactionData, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post("/api/v1/transaction-mgt", data);
            return res.data; 
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data || {
                    message: "Failed to create transaction.",
                },
            );
        }
    }
);


export const initializePayment = createAsyncThunk(
    "transaction/initializePayment",
    async (data: PaymentPayload, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post("/api/v1/payment-mgt/initialize", data);
            return res.data; 
        } catch (error: any) {
            return rejectWithValue({
                message: error?.response?.data?.message
            })
        }
    }
);


// ✅ Get paginated transaction history
export const getTransactionHistory = createAsyncThunk(
  "transaction/getTransactionHistory",
  async (
    {
      userId,
      page = 1,
      limit = 10,
      startDate,
      endDate,
    }: { userId: string; page?: number; limit?: number; startDate?: string; endDate?: string },
    { rejectWithValue }
  ) => {
    try {
      // Corrected: userId is sent as a query param
      const res = await axiosInstance.get(
        `/api/v1/transaction-mgt/history`,
        {
          params: {
            userId,
            page,
            limit,
            startDate,
            endDate,
          },
        }
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Failed to fetch transactions",
      });
    }
  }
);



export const getTransaction = createAsyncThunk(
  'transaction/getTransaction',
  async (transId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/api/v1/transaction-mgt/history/${transId}?transId=${transId}`);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data || {
          message: "Failed to fetch transactions",
        },
      );
    }
  }
);


export const verifyTransaction = createAsyncThunk(
  'transaction/verifyTransaction',
  async ({ tx_ref }: VerifyTransactionPayload, { rejectWithValue }) => {
    try {
      if (!tx_ref ) {
        throw new Error("Missing required fields for verification");
      }

      console.log("📦 Verifying transaction:", { tx_ref });

      // ✅ POST request, but parameters go in the query string
      const response = await axiosInstance.post(
        `/api/v1/transaction-mgt/verify?tx_ref=${encodeURIComponent(tx_ref)}`,
        {} // empty request body
      );

      return response.data;
    } catch (error: any) {
      console.error("❌ Verify transaction error:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
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
  "resident-transaction/generateTxRef",
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
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Failed to generate transaction reference.",
      });
    }
  },
);

/** Resident (owner) wallet withdrawal. */
export interface ResidentTransferPayload {
  userId: string;
  estateId: string;
  amount: number;
  currency: string;
  bankCode: string;
  accountNumber: string;
  narration: string;
  tx_ref: string;
  gatewayType: string;
  otp?: string;
}

interface ResidentOwnerOtpPayload {
  userId: string;
  estateId: string;
  amount: number;
  currency: string;
  bankCode: string;
  accountNumber: string;
  narration: string;
  tx_ref: string;
  gatewayType: string;
}

export const requestResidentOwnerWithdrawalOtp = createAsyncThunk(
  "resident-transaction/requestResidentOwnerWithdrawalOtp",
  async (data: ResidentOwnerOtpPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        "/api/v1/payment-mgt/resident-owner/request-withdrawal-otp",
        data,
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Failed to request withdrawal OTP.",
      });
    }
  },
);

export const transferFundsResident = createAsyncThunk(
  "resident-transaction/transferFundsResident",
  async (data: ResidentTransferPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        "/api/v1/payment-mgt/resident-owner/withdraw",
        data,
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ?? "Failed to withdraw funds.",
      });
    }
  },
);
