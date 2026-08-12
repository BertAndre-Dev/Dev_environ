"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AlertBanner } from "@/components/ui/alert-banner";
import type { AppDispatch, RootState } from "@/redux/store";
import { selectUserRole } from "@/redux/slice/auth-mgt/auth-mgt-slice";
import { getWallet as getResidentWallet } from "@/redux/slice/resident/wallet-mgt/wallet-mgt";
import { getWallet as getEstateWallet } from "@/redux/slice/estate-admin/wallet-mgt/wallet-mgt";
import { getCompanyWallet } from "@/redux/slice/company/wallet-mgt/company-wallet-mgt";
import { parseCompanyFromUser } from "@/app/dashboard/company/lib/company";
import { extractEstateIdFromUser, extractUserId } from "@/lib/user-id";
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

  const residentWallet = useSelector((state: RootState) => state.wallet.wallet);
  const residentWalletState = useSelector(
    (state: RootState) => state.wallet.getWalletState,
  );
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
  const residentType =
    (user?.residentType as string | null | undefined) ??
    (user?.resident_type as string | null | undefined) ??
    null;
  const userId = extractUserId(user);
  const estateId = extractEstateIdFromUser(user);
  const companyId = user ? (parseCompanyFromUser(user)?.id ?? null) : null;

  const isResidentOwner =
    normalizedRole === "resident" &&
    (residentType ?? "").toString().toLowerCase().trim() === "owner";
  const isEstateAdmin =
    normalizedRole === "estate admin" || normalizedRole === "estate-admin";
  const isCompany = normalizedRole === "company";
  const isEligibleRole = isResidentOwner || isEstateAdmin || isCompany;

  useEffect(() => {
    if (!isEligibleRole) return;

    if (isResidentOwner && userId && residentWalletState === "idle") {
      dispatch(getResidentWallet(userId));
      return;
    }
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
    isResidentOwner,
    isEstateAdmin,
    isCompany,
    userId,
    estateId,
    companyId,
    residentWalletState,
    estateWalletState,
    companyWalletState,
  ]);

  const activeWallet = isResidentOwner
    ? residentWallet
    : isEstateAdmin
      ? estateWallet
      : isCompany
        ? companyWallet
        : null;

  const walletFetchState = isResidentOwner
    ? residentWalletState
    : isEstateAdmin
      ? estateWalletState
      : isCompany
        ? companyWalletState
        : "idle";

  const hasBank = hasWithdrawalBankAccount(activeWallet?.accountNumber);
  const walletSettled =
    walletFetchState === "succeeded" || walletFetchState === "failed";

  if (!isEligibleRole || !walletSettled) return null;

  if (
    !shouldShowWithdrawalAccountAlert(role, residentType, hasBank, pathname)
  ) {
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
