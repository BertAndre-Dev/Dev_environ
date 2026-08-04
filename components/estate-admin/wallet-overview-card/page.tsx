"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

export interface WalletOverviewWallet {
  balance?: number;
  availableBalance?: number;
  temporaryBalance?: number;
  withdrawableBalance?: number;
  accountNumber?: string;
}

export interface WalletOverviewBillStats {
  totalBills: number;
  paidBills: number;
  pendingBills: number;
  serviceFee: number;
}

interface EstateWalletOverviewCardProps {
  wallet: WalletOverviewWallet | null;
  billStats?: WalletOverviewBillStats | null;
  onWithdraw: () => void;
  onCreateWallet?: () => void;
  onSetWithdrawalAccount?: () => void;
  /** True while wallet fetch has not finished — avoid flashing Create Wallet. */
  walletLoading?: boolean;
  createWalletLoading?: boolean;
  filterExportSlot?: React.ReactNode;
}

const formatNaira = (value: number) => `₦${(value ?? 0).toLocaleString()}`;

export default function EstateWalletOverviewCard({
  wallet,
  onWithdraw,
  onCreateWallet,
  onSetWithdrawalAccount,
  walletLoading = false,
  createWalletLoading = false,
  filterExportSlot,
}: EstateWalletOverviewCardProps) {
  const hasWithdrawalAccount = Boolean(wallet?.accountNumber?.trim());

  return (
    <div className="space-y-4">
      <Card className="p-4 md:p-6 shadow-md">
        <div className="p-0 space-y-6">
          {wallet ? (
            <>
              {/* Top: Available balance | Withdrawable balance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:gap-6">
                <div className="flex flex-col justify-center items-center w-full h-[150px] border border-[#CCCCCC] rounded-lg lg:px-4 lg:py-4">
                  <p className="text-sm text-muted-foreground">
                    Available Balance
                  </p>
                  <p className="text-3xl md:text-4xl font-bold mt-1">
                    {formatNaira(wallet.availableBalance ?? 0)}
                  </p>
                </div>
                <div className="flex flex-col justify-center items-center w-full h-[150px] border border-[#CCCCCC] rounded-lg lg:px-4 lg:py-4">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    Withdrawable Balance
                    <span
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs cursor-help"
                      title="You can only withdraw from this balance."
                    >
                      i
                    </span>
                  </p>
                  <p className="text-3xl md:text-4xl font-bold mt-1 text-primary">
                    {formatNaira(wallet.withdrawableBalance ?? 0)}
                  </p>
                </div>
              </div>

              <div className="bg-[#D0DFF233] rounded-lg p-4 flex justify-center items-center">
                {hasWithdrawalAccount ? (
                  <Button
                    onClick={onWithdraw}
                    size="lg"
                    className="px-8 w-full max-w-md"
                  >
                    Withdraw Funds
                  </Button>
                ) : (
                  <Button
                    onClick={onSetWithdrawalAccount}
                    size="lg"
                    className="px-8 w-full max-w-md"
                  >
                    Set Withdrawal Account
                  </Button>
                )}
              </div>
            </>
          ) : walletLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Loading wallet...
            </p>
          ) : (
            <div className="flex justify-center py-4">
              <Button
                onClick={onCreateWallet}
                disabled={createWalletLoading}
                size="lg"
                className="px-8"
              >
                {createWalletLoading ? "Creating wallet..." : "Create Wallet"}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Filter / Export bar (Figma: Filter by Ref, Filter by Status, Export) */}
      {filterExportSlot && (
        <div className="flex flex-wrap items-center gap-2">
          {filterExportSlot}
        </div>
      )}
    </div>
  );
}

/** Presentational buttons for Filter by Ref / Filter by Status / Export. Use with filterExportSlot. */
export function WalletFilterExportBar({
  filterByRefLabel = "Filter by Ref",
  filterByStatusLabel = "Filter by Status",
  exportLabel = "Export",
  onFilterByRef,
  onFilterByStatus,
  onExport,
}: {
  filterByRefLabel?: string;
  filterByStatusLabel?: string;
  exportLabel?: string;
  onFilterByRef?: () => void;
  onFilterByStatus?: () => void;
  onExport?: () => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onFilterByRef}
        className="inline-flex items-center gap-1 px-4 py-2 rounded-md border border-border bg-background text-sm font-medium text-foreground hover:bg-muted/50"
      >
        {filterByRefLabel}
        <ChevronDown className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={onFilterByStatus}
        className="inline-flex items-center gap-1 px-4 py-2 rounded-md border border-border bg-background text-sm font-medium text-foreground hover:bg-muted/50"
      >
        {filterByStatusLabel}
        <ChevronDown className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={onExport}
        className="inline-flex items-center px-4 py-2 rounded-md border border-border bg-background text-sm font-medium text-foreground hover:bg-muted/50"
      >
        {exportLabel}
      </button>
    </>
  );
}
