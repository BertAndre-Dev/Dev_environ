import { createRevenueWithdrawalModule } from "@/redux/slice/wallet-mgt/create-revenue-withdrawal-module";
import type { RevenueWithdrawalAccountState } from "@/redux/slice/wallet-mgt/create-revenue-withdrawal-module";
import type { RootState } from "@/redux/store";

const module = createRevenueWithdrawalModule("energyProvider");

export const setEnergyProviderRevenueWithdrawalAccount =
  module.setRevenueWithdrawalAccount;
export const getEnergyProviderRevenueWithdrawalAccounts =
  module.getRevenueWithdrawalAccounts;
export const getEnergyProviderRevenueWithdrawalTypes =
  module.getRevenueWithdrawalTypes;
export const setEnergyProviderAutoSettlement = module.setAutoSettlement;
export const {
  clearRevenueWithdrawalError,
  resetSetRevenueWithdrawalAccountState,
  resetRevenueWithdrawalAccountState,
} = module;

export type { RevenueWithdrawalAccountState };

export const selectEnergyProviderRevenueWithdrawalAccounts = (
  state: RootState,
) => state.energyProviderRevenueWithdrawalAccount.accounts;
export const selectEnergyProviderRevenueWithdrawalTypes = (state: RootState) =>
  state.energyProviderRevenueWithdrawalAccount.types;
export const selectEnergyProviderAutoSettlementEnabled = (state: RootState) =>
  state.energyProviderRevenueWithdrawalAccount.autoSettlementEnabled;
export const selectEnergyProviderRevenueWithdrawalLoading = (
  state: RootState,
) =>
  state.energyProviderRevenueWithdrawalAccount.getAccountsState ===
    "isLoading" ||
  state.energyProviderRevenueWithdrawalAccount.getTypesState === "isLoading";
export const selectEnergyProviderSetRevenueWithdrawalAccountState = (
  state: RootState,
) => state.energyProviderRevenueWithdrawalAccount.setAccountState;
export const selectEnergyProviderSetAutoSettlementState = (state: RootState) =>
  state.energyProviderRevenueWithdrawalAccount.setAutoSettlementState;
export const selectEnergyProviderGetRevenueWithdrawalAccountsState = (
  state: RootState,
) => state.energyProviderRevenueWithdrawalAccount.getAccountsState;

export default module.reducer;
