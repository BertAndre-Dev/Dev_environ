import { createSlice } from "@reduxjs/toolkit";
import {
  getBanks,
  getPaymentGateways,
  verifyBankAccount,
} from "./payment-mgt";
import type { BankItem, PaymentGatewayItem } from "./payment-mgt";

export interface ResidentPaymentMgtState {
  getBanksState: "idle" | "isLoading" | "succeeded" | "failed";
  getPaymentGatewaysState: "idle" | "isLoading" | "succeeded" | "failed";
  verifyBankAccountState: "idle" | "isLoading" | "succeeded" | "failed";
  banks: BankItem[];
  gateways: PaymentGatewayItem[];
  defaultGateway: string | null;
  verifiedAccountName: string | null;
  error: string | null;
}

const initialState: ResidentPaymentMgtState = {
  getBanksState: "idle",
  getPaymentGatewaysState: "idle",
  verifyBankAccountState: "idle",
  banks: [],
  gateways: [],
  defaultGateway: null,
  verifiedAccountName: null,
  error: null,
};

const residentPaymentMgtSlice = createSlice({
  name: "residentPaymentMgt",
  initialState,
  reducers: {
    clearResidentBanks: (state) => {
      state.banks = [];
      state.getBanksState = "idle";
    },
    clearResidentVerifiedAccount: (state) => {
      state.verifiedAccountName = null;
      state.verifyBankAccountState = "idle";
    },
    resetResidentPaymentMgt: (state) => {
      state.getBanksState = "idle";
      state.getPaymentGatewaysState = "idle";
      state.verifyBankAccountState = "idle";
      state.banks = [];
      state.gateways = [];
      state.defaultGateway = null;
      state.verifiedAccountName = null;
      state.error = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(getPaymentGateways.pending, (state) => {
        state.getPaymentGatewaysState = "isLoading";
        state.error = null;
      })
      .addCase(getPaymentGateways.fulfilled, (state, action) => {
        state.getPaymentGatewaysState = "succeeded";
        state.gateways = action.payload.gateways ?? [];
        state.defaultGateway = action.payload.defaultGateway ?? null;
      })
      .addCase(getPaymentGateways.rejected, (state, action) => {
        state.getPaymentGatewaysState = "failed";
        state.gateways = [];
        state.defaultGateway = null;
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          null;
      })
      .addCase(getBanks.pending, (state) => {
        state.getBanksState = "isLoading";
        state.error = null;
      })
      .addCase(getBanks.fulfilled, (state, action) => {
        state.getBanksState = "succeeded";
        state.banks = action.payload ?? [];
      })
      .addCase(getBanks.rejected, (state, action) => {
        state.getBanksState = "failed";
        state.banks = [];
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          null;
      })
      .addCase(verifyBankAccount.pending, (state) => {
        state.verifyBankAccountState = "isLoading";
        state.verifiedAccountName = null;
        state.error = null;
      })
      .addCase(verifyBankAccount.fulfilled, (state, action) => {
        state.verifyBankAccountState = "succeeded";
        state.verifiedAccountName = action.payload?.accountName ?? null;
      })
      .addCase(verifyBankAccount.rejected, (state, action) => {
        state.verifyBankAccountState = "failed";
        state.verifiedAccountName = null;
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          null;
      });
  },
});

export const {
  clearResidentBanks,
  clearResidentVerifiedAccount,
  resetResidentPaymentMgt,
} = residentPaymentMgtSlice.actions;
export default residentPaymentMgtSlice.reducer;
