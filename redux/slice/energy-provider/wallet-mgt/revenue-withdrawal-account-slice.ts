import { createRevenueWithdrawalModule } from "@/redux/slice/wallet-mgt/create-revenue-withdrawal-module";
import type { RevenueWithdrawalAccountState } from "@/redux/slice/wallet-mgt/create-revenue-withdrawal-module";

const energyProviderRevenueWithdrawal =
  createRevenueWithdrawalModule("energyProvider");

export const setEnergyProviderRevenueWithdrawalAccount =
  energyProviderRevenueWithdrawal.setRevenueWithdrawalAccount;
export const getEnergyProviderRevenueWithdrawalAccounts =
  energyProviderRevenueWithdrawal.getRevenueWithdrawalAccounts;
export const getEnergyProviderRevenueWithdrawalTypes =
  energyProviderRevenueWithdrawal.getRevenueWithdrawalTypes;
export const setEnergyProviderAutoSettlement =
  energyProviderRevenueWithdrawal.setAutoSettlement;
export const {
  clearRevenueWithdrawalError,
  resetSetRevenueWithdrawalAccountState,
  resetRevenueWithdrawalAccountState,
} = energyProviderRevenueWithdrawal;

export type { RevenueWithdrawalAccountState };

type EnergyProviderRevenueWithdrawalRoot = {
  energyProviderRevenueWithdrawalAccount: RevenueWithdrawalAccountState;
};

export const selectEnergyProviderRevenueWithdrawalAccounts = (
  state: EnergyProviderRevenueWithdrawalRoot,
) => state.energyProviderRevenueWithdrawalAccount.accounts;
export const selectEnergyProviderRevenueWithdrawalTypes = (
  state: EnergyProviderRevenueWithdrawalRoot,
) => state.energyProviderRevenueWithdrawalAccount.types;
export const selectEnergyProviderAutoSettlementEnabled = (
  state: EnergyProviderRevenueWithdrawalRoot,
) => state.energyProviderRevenueWithdrawalAccount.autoSettlementEnabled;
export const selectEnergyProviderRevenueWithdrawalLoading = (
  state: EnergyProviderRevenueWithdrawalRoot,
) =>
  state.energyProviderRevenueWithdrawalAccount.getAccountsState ===
    "isLoading" ||
  state.energyProviderRevenueWithdrawalAccount.getTypesState === "isLoading";
export const selectEnergyProviderSetRevenueWithdrawalAccountState = (
  state: EnergyProviderRevenueWithdrawalRoot,
) => state.energyProviderRevenueWithdrawalAccount.setAccountState;
export const selectEnergyProviderSetAutoSettlementState = (
  state: EnergyProviderRevenueWithdrawalRoot,
) => state.energyProviderRevenueWithdrawalAccount.setAutoSettlementState;
export const selectEnergyProviderGetRevenueWithdrawalAccountsState = (
  state: EnergyProviderRevenueWithdrawalRoot,
) => state.energyProviderRevenueWithdrawalAccount.getAccountsState;

export default energyProviderRevenueWithdrawal.reducer;
