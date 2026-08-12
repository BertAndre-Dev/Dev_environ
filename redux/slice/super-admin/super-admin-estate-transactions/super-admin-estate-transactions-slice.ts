import { createSlice } from "@reduxjs/toolkit";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  getSuperAdminEstateTransactionHistory,
  getSuperAdminEstateVends,
  getSuperAdminEstatePaidBills,
} from "./super-admin-estate-transactions";

interface TransactionData {
  walletId?: string;
  type: string;
  amount: number;
  description?: string;
  userId?: string;
  id?: string;
  paymentStatus?: string;
  tx_ref?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Pagination {
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

export interface TransactionResponse {
  success: boolean;
  message: string;
  data: TransactionData[];
  pagination: Pagination;
}

export interface SuperAdminEstateTransactionsState {
  getTransactionHistoryState: "idle" | "isLoading" | "succeeded" | "failed";
  getVendsState: "idle" | "isLoading" | "succeeded" | "failed";
  getPaidBillsState: "idle" | "isLoading" | "succeeded" | "failed";
  allTransactions: TransactionResponse | null;
  error: string | null;
}

const initialState: SuperAdminEstateTransactionsState = {
  getTransactionHistoryState: "idle",
  getVendsState: "idle",
  getPaidBillsState: "idle",
  allTransactions: null,
  error: null,
};

const superAdminEstateTransactionsSlice = createSlice({
  name: "superAdminEstateTransactions",
  initialState,
  reducers: {
    resetSuperAdminEstateTransactionsState: (state) => {
      state.error = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(getSuperAdminEstateTransactionHistory.pending, (state) => {
        state.getTransactionHistoryState = "isLoading";
      })
      .addCase(getSuperAdminEstateTransactionHistory.fulfilled, (state, action) => {
        state.getTransactionHistoryState = "succeeded";
        const apiPagination = action.payload?.pagination || {};
        state.allTransactions = {
          success: action.payload?.success ?? true,
          message:
            action.payload?.message ??
            "Estate transactions retrieved successfully.",
          data: action.payload?.data || [],
          pagination: {
            total: apiPagination.total ?? 0,
            currentPage: apiPagination.page ?? 1,
            totalPages: apiPagination.pages ?? 1,
            pageSize: apiPagination.limit ?? 10,
          },
        };
      })
      .addCase(getSuperAdminEstateTransactionHistory.rejected, (state, action) => {
        state.getTransactionHistoryState = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      })

      .addCase(getSuperAdminEstateVends.pending, (state) => {
        state.getVendsState = "isLoading";
      })
      .addCase(getSuperAdminEstateVends.fulfilled, (state) => {
        state.getVendsState = "succeeded";
      })
      .addCase(getSuperAdminEstateVends.rejected, (state, action) => {
        state.getVendsState = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      })

      .addCase(getSuperAdminEstatePaidBills.pending, (state) => {
        state.getPaidBillsState = "isLoading";
      })
      .addCase(getSuperAdminEstatePaidBills.fulfilled, (state) => {
        state.getPaidBillsState = "succeeded";
      })
      .addCase(getSuperAdminEstatePaidBills.rejected, (state, action) => {
        state.getPaidBillsState = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      });
  },
});

export const { resetSuperAdminEstateTransactionsState } =
  superAdminEstateTransactionsSlice.actions;
export default superAdminEstateTransactionsSlice.reducer;

export const selectSuperAdminEstateTransactions = (state: {
  superAdminEstateTransactions: SuperAdminEstateTransactionsState;
}) => state.superAdminEstateTransactions.allTransactions?.data ?? [];

export const selectSuperAdminEstateTransactionsPagination = (state: {
  superAdminEstateTransactions: SuperAdminEstateTransactionsState;
}) => state.superAdminEstateTransactions.allTransactions?.pagination ?? null;

export const selectSuperAdminEstateTransactionsLoading = (state: {
  superAdminEstateTransactions: SuperAdminEstateTransactionsState;
}) =>
  state.superAdminEstateTransactions.getTransactionHistoryState === "isLoading";
