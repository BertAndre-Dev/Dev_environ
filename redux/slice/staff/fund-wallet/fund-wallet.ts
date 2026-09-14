import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export interface BankItem {
  id: number;
  code: string;
  name: string;
}

export interface GetBanksResponse {
  success?: boolean;
  message?: string;
  data?: BankItem[];
}

export type PaymentGatewayType = "flutterwave" | "monnify";

export interface GetBanksParams {
  country?: string;
  gatewayType?: PaymentGatewayType;
}

export interface VerifyBankAccountPayload {
  accountNumber: string;
  bankCode: string;
  gatewayType?: PaymentGatewayType;
}

export interface VerifyBankAccountResponse {
  account_name?: string;
  message?: string;
  data?: { account_name?: string; message?: string };
}

function getApiErrorMessage(error: unknown): string | undefined {
  const err = error as {
    response?: { data?: { message?: string | string[] } };
    message?: string;
  };
  const msg = err?.response?.data?.message;
  if (Array.isArray(msg) && msg[0]) return msg[0];
  if (typeof msg === "string" && msg.trim()) return msg;
  if (typeof err?.message === "string" && err.message.trim()) return err.message;
  return undefined;
}

export const getBanks = createAsyncThunk(
  "staff-fund-wallet/getBanks",
  async (
    { country = "NG", gatewayType }: GetBanksParams = {},
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.get<GetBanksResponse>(
        "/api/v1/payment-mgt/banks",
        {
          params: {
            country,
            ...(gatewayType ? { gatewayType } : {}),
          },
        }
      );
      if (res.data?.success && res.data?.data) {
        return res.data.data;
      }
      return rejectWithValue({
        message: res.data?.message,
      });
    } catch (error: unknown) {
      return rejectWithValue({
        message: getApiErrorMessage(error),
      });
    }
  }
);

export const verifyBankAccount = createAsyncThunk(
  "staff-fund-wallet/verifyBankAccount",
  async (
    { accountNumber, bankCode, gatewayType }: VerifyBankAccountPayload,
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.get(
        "/api/v1/payment-mgt/verify-bank-account",
        {
          params: {
            accountNumber: accountNumber.trim(),
            bankCode,
            ...(gatewayType ? { gatewayType } : {}),
          },
        }
      );
      const data = res.data as VerifyBankAccountResponse;
      const accountName = data?.account_name ?? data?.data?.account_name;
      if (accountName) {
        return { accountName };
      }
      return rejectWithValue({
        message: data?.message ?? data?.data?.message,
      });
    } catch (error: unknown) {
      return rejectWithValue({
        message: getApiErrorMessage(error),
      });
    }
  }
);
