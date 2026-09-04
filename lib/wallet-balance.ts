/** Numeric wallet fields returned by GET /api/v1/wallet-mgt/estate/:id */
export type WalletBalanceFields = {
  balance?: number | null;
  availableBalance?: number | null;
  withdrawableBalance?: number | null;
  lockedBalance?: number | null;
  temporaryBalance?: number | null;
};

function toAmount(value: number | null | undefined): number {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

/**
 * The wallet API has no `totalBalance`. Sum the live buckets so the UI
 * does not treat the unused `balance` field (often 0) as the total.
 */
export function computeWalletTotalBalance(
  wallet: WalletBalanceFields | null | undefined,
): number {
  if (!wallet) return 0;
  const available = toAmount(wallet.availableBalance);
  const withdrawable = toAmount(wallet.withdrawableBalance);
  const locked = toAmount(wallet.lockedBalance);
  const buckets = available + withdrawable + locked;
  if (buckets > 0) return buckets;
  const balance = toAmount(wallet.balance);
  if (balance > 0) return balance;
  return toAmount(wallet.temporaryBalance);
}
