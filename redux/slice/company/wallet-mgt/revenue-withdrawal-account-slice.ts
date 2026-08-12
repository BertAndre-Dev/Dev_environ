import { createRevenueWithdrawalModule } from "@/redux/slice/wallet-mgt/create-revenue-withdrawal-module";
import type { RevenueWithdrawalAccountState } from "@/redux/slice/wallet-mgt/create-revenue-withdrawal-module";

const companyRevenueWithdrawal = createRevenueWithdrawalModule("company");

export const setCompanyRevenueWithdrawalAccount =
  companyRevenueWithdrawal.setRevenueWithdrawalAccount;
export const getCompanyRevenueWithdrawalAccounts =
  companyRevenueWithdrawal.getRevenueWithdrawalAccounts;
export const getCompanyRevenueWithdrawalTypes =
  companyRevenueWithdrawal.getRevenueWithdrawalTypes;
export const setCompanyAutoSettlement =
  companyRevenueWithdrawal.setAutoSettlement;
export const {
  clearRevenueWithdrawalError,
  resetSetRevenueWithdrawalAccountState,
  resetRevenueWithdrawalAccountState,
} = companyRevenueWithdrawal;

export type { RevenueWithdrawalAccountState };

type CompanyRevenueWithdrawalRoot = {
  companyRevenueWithdrawalAccount: RevenueWithdrawalAccountState;
};

export const selectCompanyRevenueWithdrawalAccounts = (
  state: CompanyRevenueWithdrawalRoot,
) => state.companyRevenueWithdrawalAccount.accounts;
export const selectCompanyRevenueWithdrawalTypes = (
  state: CompanyRevenueWithdrawalRoot,
) => state.companyRevenueWithdrawalAccount.types;
export const selectCompanyAutoSettlementEnabled = (
  state: CompanyRevenueWithdrawalRoot,
) => state.companyRevenueWithdrawalAccount.autoSettlementEnabled;
export const selectCompanyRevenueWithdrawalLoading = (
  state: CompanyRevenueWithdrawalRoot,
) =>
  state.companyRevenueWithdrawalAccount.getAccountsState === "isLoading" ||
  state.companyRevenueWithdrawalAccount.getTypesState === "isLoading";
export const selectCompanySetRevenueWithdrawalAccountState = (
  state: CompanyRevenueWithdrawalRoot,
) => state.companyRevenueWithdrawalAccount.setAccountState;
export const selectCompanySetAutoSettlementState = (
  state: CompanyRevenueWithdrawalRoot,
) => state.companyRevenueWithdrawalAccount.setAutoSettlementState;
export const selectCompanyGetRevenueWithdrawalAccountsState = (
  state: CompanyRevenueWithdrawalRoot,
) => state.companyRevenueWithdrawalAccount.getAccountsState;

export default companyRevenueWithdrawal.reducer;
