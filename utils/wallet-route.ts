const WALLET_ROUTES: Record<string, string> = {
  company: "/dashboard/company/wallet",
  resident: "/dashboard/resident/transaction",
  "estate admin": "/dashboard/estate-admin/wallet",
  "estate-admin": "/dashboard/estate-admin/wallet",
  staff: "/dashboard/staff/wallet",
};

/** Roles that need a payout bank (withdrawal account) on their wallet. */
const WITHDRAWAL_ACCOUNT_ROLES = new Set([
  "company",
  "estate admin",
  "estate-admin",
  "staff",
]);

export function normalizeUserRole(role: string | null | undefined): string {
  return (role ?? "").toString().toLowerCase().trim();
}

export function getWalletRouteForRole(
  role: string | null | undefined,
): string | null {
  return WALLET_ROUTES[normalizeUserRole(role)] ?? null;
}

export function hasWithdrawalBankAccount(
  accountNumber: string | null | undefined,
): boolean {
  return Boolean(accountNumber?.trim());
}

/**
 * Show the “set withdrawal account” banner when company / estate admin
 * have no bank on their payout wallet.
 * Hidden on the role’s wallet page itself. Never shown for residents.
 */
export function shouldShowWithdrawalAccountAlert(
  role: string | null | undefined,
  _residentType: string | null | undefined,
  hasBankAccount: boolean,
  pathname: string,
): boolean {
  const normalizedRole = normalizeUserRole(role);
  if (!WITHDRAWAL_ACCOUNT_ROLES.has(normalizedRole)) return false;

  if (hasBankAccount) return false;

  const walletRoute = getWalletRouteForRole(normalizedRole);
  if (!walletRoute) return false;

  return pathname !== walletRoute && !pathname.startsWith(`${walletRoute}/`);
}
