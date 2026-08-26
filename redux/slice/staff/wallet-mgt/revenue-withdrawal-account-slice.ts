import {
  createRevenueWithdrawalModule,
  extractAutoSettlementEnabled,
  type RevenueWithdrawalAccountState,
} from "@/redux/slice/wallet-mgt/create-revenue-withdrawal-module";
import { getWallet } from "@/redux/slice/staff/wallet-mgt/wallet-mgt";

const staffRevenueWithdrawal = createRevenueWithdrawalModule("staff", {
  extraReducers: (builder) => {
    builder.addCase(getWallet.fulfilled, (state, action) => {
      const enabled = extractAutoSettlementEnabled(action.payload);
      if (enabled !== null) {
        state.autoSettlementEnabled = enabled;
      }
    });
  },
});

export const setStaffRevenueWithdrawalAccount =
  staffRevenueWithdrawal.setRevenueWithdrawalAccount;
export const getStaffRevenueWithdrawalAccounts =
  staffRevenueWithdrawal.getRevenueWithdrawalAccounts;
export const getStaffRevenueWithdrawalTypes =
  staffRevenueWithdrawal.getRevenueWithdrawalTypes;
export const setStaffAutoSettlement = staffRevenueWithdrawal.setAutoSettlement;
export const {
  clearRevenueWithdrawalError,
  resetSetRevenueWithdrawalAccountState,
  resetRevenueWithdrawalAccountState,
} = staffRevenueWithdrawal;

export type { RevenueWithdrawalAccountState };

type StaffRevenueWithdrawalRoot = {
  staffRevenueWithdrawalAccount: RevenueWithdrawalAccountState;
};

export const selectStaffRevenueWithdrawalAccounts = (
  state: StaffRevenueWithdrawalRoot,
) => state.staffRevenueWithdrawalAccount.accounts;
export const selectStaffRevenueWithdrawalTypes = (
  state: StaffRevenueWithdrawalRoot,
) => state.staffRevenueWithdrawalAccount.types;
export const selectStaffAutoSettlementEnabled = (
  state: StaffRevenueWithdrawalRoot,
) => state.staffRevenueWithdrawalAccount.autoSettlementEnabled;
export const selectStaffRevenueWithdrawalLoading = (
  state: StaffRevenueWithdrawalRoot,
) =>
  state.staffRevenueWithdrawalAccount.getAccountsState === "isLoading" ||
  state.staffRevenueWithdrawalAccount.getTypesState === "isLoading";
export const selectStaffSetRevenueWithdrawalAccountState = (
  state: StaffRevenueWithdrawalRoot,
) => state.staffRevenueWithdrawalAccount.setAccountState;
export const selectStaffSetAutoSettlementState = (
  state: StaffRevenueWithdrawalRoot,
) => state.staffRevenueWithdrawalAccount.setAutoSettlementState;
export const selectStaffGetRevenueWithdrawalAccountsState = (
  state: StaffRevenueWithdrawalRoot,
) => state.staffRevenueWithdrawalAccount.getAccountsState;

export default staffRevenueWithdrawal.reducer;
