import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export interface SetWithdrawalAccountPayload {
  bankCode: string;
  accountNumber: string;
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

/** POST /api/v1/wallet-mgt/withdrawal-account — one-time set for caller's payout wallet */
export const setWithdrawalAccount = createAsyncThunk(
  "wallet-mgt/setWithdrawalAccount",
  async (data: SetWithdrawalAccountPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        "/api/v1/wallet-mgt/withdrawal-account",
        {
          bankCode: data.bankCode.trim(),
          accountNumber: data.accountNumber.trim(),
        },
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue({
        message: getApiErrorMessage(error),
      });
    }
  },
);
