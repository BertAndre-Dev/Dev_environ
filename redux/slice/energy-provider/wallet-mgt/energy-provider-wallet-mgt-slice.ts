import { createSlice } from "@reduxjs/toolkit";
import {
  createEnergyProviderWallet,
  getEnergyProviderWallet,
  getEnergyProviderCredits,
} from "./energy-provider-wallet-mgt";

export interface EnergyProviderWalletData {
  id?: string;
  userId?: string;
  balance?: number;
  temporaryBalance?: number;
  withdrawableBalance?: number;
  availableBalance?: number;
  lockedBalance?: number;
  accountNumber?: string;
  bankCode?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EnergyProviderCreditItem {
  id?: string;
  _id?: string;
  amount?: number;
  walletId?: string;
  userId?: string;
  estateId?: string;
  description?: string;
  tx_ref?: string;
  source?: string;
  type?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface EnergyProviderCreditsResponse {
  success?: boolean;
  data?: EnergyProviderCreditItem[];
  summary?: Record<string, unknown>;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages?: number;
  };
}

export interface EnergyProviderWalletState {
  createWalletState: "idle" | "isLoading" | "succeeded" | "failed";
  getWalletState: "idle" | "isLoading" | "succeeded" | "failed";
  getCreditsState: "idle" | "isLoading" | "succeeded" | "failed";
  wallet: EnergyProviderWalletData | null;
  credits: EnergyProviderCreditsResponse | null;
  error: string | null;
}

const initialState: EnergyProviderWalletState = {
  createWalletState: "idle",
  getWalletState: "idle",
  getCreditsState: "idle",
  wallet: null,
  credits: null,
  error: null,
};

const energyProviderWalletSlice = createSlice({
  name: "energyProviderWallet",
  initialState,
  reducers: {
    resetEnergyProviderWalletState: (state) => {
      state.error = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(createEnergyProviderWallet.pending, (state) => {
        state.createWalletState = "isLoading";
      })
      .addCase(createEnergyProviderWallet.fulfilled, (state, action) => {
        state.createWalletState = "succeeded";
        const newWallet = action.payload?.data;
        if (newWallet) state.wallet = newWallet;
      })
      .addCase(createEnergyProviderWallet.rejected, (state, action) => {
        state.createWalletState = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to create wallet";
      })

      .addCase(getEnergyProviderWallet.pending, (state) => {
        state.getWalletState = "isLoading";
      })
      .addCase(getEnergyProviderWallet.fulfilled, (state, action) => {
        state.getWalletState = "succeeded";
        state.wallet = action.payload?.data ?? null;
      })
      .addCase(getEnergyProviderWallet.rejected, (state, action) => {
        state.getWalletState = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch wallet";
      })

      .addCase(getEnergyProviderCredits.pending, (state) => {
        state.getCreditsState = "isLoading";
      })
      .addCase(getEnergyProviderCredits.fulfilled, (state, action) => {
        state.getCreditsState = "succeeded";
        const rawCredits: EnergyProviderCreditItem[] = action.payload?.data ?? [];
        state.credits = {
          success: action.payload?.success,
          data: rawCredits.map((item) => ({
            ...item,
            id: item.id ?? item._id,
          })),
          summary: action.payload?.summary,
          pagination: action.payload?.pagination,
        };
      })
      .addCase(getEnergyProviderCredits.rejected, (state, action) => {
        state.getCreditsState = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch wallet history";
      });
  },
});

export const { resetEnergyProviderWalletState } =
  energyProviderWalletSlice.actions;
export default energyProviderWalletSlice.reducer;

export const selectEnergyProviderWallet = (state: {
  energyProviderWallet: EnergyProviderWalletState;
}) => state.energyProviderWallet.wallet;

export const selectEnergyProviderCredits = (state: {
  energyProviderWallet: EnergyProviderWalletState;
}) => state.energyProviderWallet.credits?.data ?? [];

export const selectEnergyProviderCreditsLoading = (state: {
  energyProviderWallet: EnergyProviderWalletState;
}) => state.energyProviderWallet.getCreditsState === "isLoading";

export const selectEnergyProviderCreditsPagination = (state: {
  energyProviderWallet: EnergyProviderWalletState;
}) => state.energyProviderWallet.credits?.pagination ?? null;
