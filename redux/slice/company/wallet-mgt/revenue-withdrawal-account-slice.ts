import { createRevenueWithdrawalModule } from "@/redux/slice/wallet-mgt/create-revenue-withdrawal-module";
import type { RevenueWithdrawalAccountState } from "@/redux/slice/wallet-mgt/create-revenue-withdrawal-module";
import type { RootState } from "@/redux/store";

const module = createRevenueWithdrawalModule("company");

export const setCompanyRevenueWithdrawalAccount =
  module.setRevenueWithdrawalAccount;
export const getCompanyRevenueWithdrawalAccounts =
  module.getRevenueWithdrawalAccounts;
export const getCompanyRevenueWithdrawalTypes =
  module.getRevenueWithdrawalTypes;
export const setCompanyAutoSettlement = module.setAutoSettlement;
export const {
  clearRevenueWithdrawalError,
  resetSetRevenueWithdrawalAccountState,
  resetRevenueWithdrawalAccountState,
} = module;

export type { RevenueWithdrawalAccountState };

export const selectCompanyRevenueWithdrawalAccounts = (state: RootState) =>
  state.companyRevenueWithdrawalAccount.accounts;
export const selectCompanyRevenueWithdrawalTypes = (state: RootState) =>
  state.companyRevenueWithdrawalAccount.types;
export const selectCompanyAutoSettlementEnabled = (state: RootState) =>
  state.companyRevenueWithdrawalAccount.autoSettlementEnabled;
export const selectCompanyRevenueWithdrawalLoading = (state: RootState) =>
  state.companyRevenueWithdrawalAccount.getAccountsState === "isLoading" ||
  state.companyRevenueWithdrawalAccount.getTypesState === "isLoading";
export const selectCompanySetRevenueWithdrawalAccountState = (
  state: RootState,
) => state.companyRevenueWithdrawalAccount.setAccountState;
export const selectCompanySetAutoSettlementState = (state: RootState) =>
  state.companyRevenueWithdrawalAccount.setAutoSettlementState;
export const selectCompanyGetRevenueWithdrawalAccountsState = (
  state: RootState,
) => state.companyRevenueWithdrawalAccount.getAccountsState;

export default module.reducer;
