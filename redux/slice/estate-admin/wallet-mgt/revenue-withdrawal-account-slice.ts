import { createRevenueWithdrawalModule } from "@/redux/slice/wallet-mgt/create-revenue-withdrawal-module";
import type { RevenueWithdrawalAccountState } from "@/redux/slice/wallet-mgt/create-revenue-withdrawal-module";
import type { RootState } from "@/redux/store";

const module = createRevenueWithdrawalModule("estateAdmin");

export const setEstateAdminRevenueWithdrawalAccount =
  module.setRevenueWithdrawalAccount;
export const getEstateAdminRevenueWithdrawalAccounts =
  module.getRevenueWithdrawalAccounts;
export const getEstateAdminRevenueWithdrawalTypes =
  module.getRevenueWithdrawalTypes;
export const setEstateAdminAutoSettlement = module.setAutoSettlement;
export const {
  clearRevenueWithdrawalError,
  resetSetRevenueWithdrawalAccountState,
  resetRevenueWithdrawalAccountState,
} = module;

export type { RevenueWithdrawalAccountState };

export const selectEstateAdminRevenueWithdrawalAccounts = (state: RootState) =>
  state.estateAdminRevenueWithdrawalAccount.accounts;
export const selectEstateAdminRevenueWithdrawalTypes = (state: RootState) =>
  state.estateAdminRevenueWithdrawalAccount.types;
export const selectEstateAdminAutoSettlementEnabled = (state: RootState) =>
  state.estateAdminRevenueWithdrawalAccount.autoSettlementEnabled;
export const selectEstateAdminRevenueWithdrawalLoading = (state: RootState) =>
  state.estateAdminRevenueWithdrawalAccount.getAccountsState === "isLoading" ||
  state.estateAdminRevenueWithdrawalAccount.getTypesState === "isLoading";
export const selectEstateAdminSetRevenueWithdrawalAccountState = (
  state: RootState,
) => state.estateAdminRevenueWithdrawalAccount.setAccountState;
export const selectEstateAdminSetAutoSettlementState = (state: RootState) =>
  state.estateAdminRevenueWithdrawalAccount.setAutoSettlementState;
export const selectEstateAdminGetRevenueWithdrawalAccountsState = (
  state: RootState,
) => state.estateAdminRevenueWithdrawalAccount.getAccountsState;

export default module.reducer;
