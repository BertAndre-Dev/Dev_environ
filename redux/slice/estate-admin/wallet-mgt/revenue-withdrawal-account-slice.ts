import {
  createRevenueWithdrawalModule,
  extractAutoSettlementEnabled,
  type RevenueWithdrawalAccountState,
} from "@/redux/slice/wallet-mgt/create-revenue-withdrawal-module";
import { getWallet } from "@/redux/slice/estate-admin/wallet-mgt/wallet-mgt";

const estateAdminRevenueWithdrawal = createRevenueWithdrawalModule(
  "estateAdmin",
  {
    extraReducers: (builder) => {
      builder.addCase(getWallet.fulfilled, (state, action) => {
        const enabled = extractAutoSettlementEnabled(action.payload);
        if (enabled !== null) {
          state.autoSettlementEnabled = enabled;
        }
      });
    },
  },
);

export const setEstateAdminRevenueWithdrawalAccount =
  estateAdminRevenueWithdrawal.setRevenueWithdrawalAccount;
export const getEstateAdminRevenueWithdrawalAccounts =
  estateAdminRevenueWithdrawal.getRevenueWithdrawalAccounts;
export const getEstateAdminRevenueWithdrawalTypes =
  estateAdminRevenueWithdrawal.getRevenueWithdrawalTypes;
export const setEstateAdminAutoSettlement =
  estateAdminRevenueWithdrawal.setAutoSettlement;
export const {
  clearRevenueWithdrawalError,
  resetSetRevenueWithdrawalAccountState,
  resetRevenueWithdrawalAccountState,
} = estateAdminRevenueWithdrawal;

export type { RevenueWithdrawalAccountState };

type EstateAdminRevenueWithdrawalRoot = {
  estateAdminRevenueWithdrawalAccount: RevenueWithdrawalAccountState;
};

export const selectEstateAdminRevenueWithdrawalAccounts = (
  state: EstateAdminRevenueWithdrawalRoot,
) => state.estateAdminRevenueWithdrawalAccount.accounts;
export const selectEstateAdminRevenueWithdrawalTypes = (
  state: EstateAdminRevenueWithdrawalRoot,
) => state.estateAdminRevenueWithdrawalAccount.types;
export const selectEstateAdminAutoSettlementEnabled = (
  state: EstateAdminRevenueWithdrawalRoot,
) => state.estateAdminRevenueWithdrawalAccount.autoSettlementEnabled;
export const selectEstateAdminRevenueWithdrawalLoading = (
  state: EstateAdminRevenueWithdrawalRoot,
) =>
  state.estateAdminRevenueWithdrawalAccount.getAccountsState === "isLoading" ||
  state.estateAdminRevenueWithdrawalAccount.getTypesState === "isLoading";
export const selectEstateAdminSetRevenueWithdrawalAccountState = (
  state: EstateAdminRevenueWithdrawalRoot,
) => state.estateAdminRevenueWithdrawalAccount.setAccountState;
export const selectEstateAdminSetAutoSettlementState = (
  state: EstateAdminRevenueWithdrawalRoot,
) => state.estateAdminRevenueWithdrawalAccount.setAutoSettlementState;
export const selectEstateAdminGetRevenueWithdrawalAccountsState = (
  state: EstateAdminRevenueWithdrawalRoot,
) => state.estateAdminRevenueWithdrawalAccount.getAccountsState;

export default estateAdminRevenueWithdrawal.reducer;
