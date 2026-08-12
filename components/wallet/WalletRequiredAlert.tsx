"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AlertBanner } from "@/components/ui/alert-banner";
import type { AppDispatch, RootState } from "@/redux/store";
import { selectUserRole } from "@/redux/slice/auth-mgt/auth-mgt-slice";
import { getWallet as getEstateWallet } from "@/redux/slice/estate-admin/wallet-mgt/wallet-mgt";
import { getCompanyWallet } from "@/redux/slice/company/wallet-mgt/company-wallet-mgt";
import { parseCompanyFromUser } from "@/app/dashboard/company/lib/company";
import { extractEstateIdFromUser } from "@/lib/user-id";
import {
  getWalletRouteForRole,
  hasWithdrawalBankAccount,
  normalizeUserRole,
  shouldShowWithdrawalAccountAlert,
} from "@/utils/wallet-route";

export function WalletRequiredAlert() {
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const userRole = useSelector(selectUserRole);
  const user = useSelector((state: RootState) => state.auth.user) as
    | Record<string, unknown>
    | null;

  const estateWallet = useSelector(
    (state: RootState) => state.estateAdminWallet.wallet,
  );
  const estateWalletState = useSelector(
    (state: RootState) => state.estateAdminWallet.getWalletState,
  );
  const companyWallet = useSelector(
    (state: RootState) => state.companyWallet.wallet,
  );
  const companyWalletState = useSelector(
    (state: RootState) => state.companyWallet.getWalletState,
  );

  const role = userRole || (user?.role as string | undefined);
  const normalizedRole = normalizeUserRole(role);
  const estateId = extractEstateIdFromUser(user);
  const companyId = user ? (parseCompanyFromUser(user)?.id ?? null) : null;

  const isEstateAdmin =
    normalizedRole === "estate admin" || normalizedRole === "estate-admin";
  const isCompany = normalizedRole === "company";
  const isEligibleRole = isEstateAdmin || isCompany;

  useEffect(() => {
    if (!isEligibleRole) return;

    if (isEstateAdmin && estateId && estateWalletState === "idle") {
      dispatch(getEstateWallet(estateId));
      return;
    }
    if (isCompany && companyId && companyWalletState === "idle") {
      dispatch(getCompanyWallet(companyId));
    }
  }, [
    dispatch,
    isEligibleRole,
    isEstateAdmin,
    isCompany,
    estateId,
    companyId,
    estateWalletState,
    companyWalletState,
  ]);

  const activeWallet = isEstateAdmin
    ? estateWallet
    : isCompany
      ? companyWallet
      : null;

  const walletFetchState = isEstateAdmin
    ? estateWalletState
    : isCompany
      ? companyWalletState
      : "idle";

  const hasBank = hasWithdrawalBankAccount(activeWallet?.accountNumber);
  const walletSettled =
    walletFetchState === "succeeded" || walletFetchState === "failed";

  if (!isEligibleRole || !walletSettled) return null;

  if (!shouldShowWithdrawalAccountAlert(role, null, hasBank, pathname)) {
    return null;
  }

  const walletRoute = getWalletRouteForRole(role);
  if (!walletRoute) return null;

  return (
    <AlertBanner
      title="Withdrawal account required"
      message="Set a bank account so you can withdraw funds from your wallet."
      actionLabel="Set withdrawal account"
      actionHref={walletRoute}
      variant="warning"
    />
  );
}
