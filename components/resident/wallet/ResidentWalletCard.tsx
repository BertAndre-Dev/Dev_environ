import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { WalletData } from "@/redux/slice/resident/wallet-mgt/wallet-mgt-slice";

type Props = {
  wallet: WalletData | null;
  isOwner: boolean;
  formatNaira: (value: number) => string;
  /** Default "full". Use "fundOnly" to show only balance + fund button. */
  variant?: "full" | "fundOnly";
  createWalletState: string;
  createWalletModalOpen: boolean;
  onFundWalletClick: () => void;
  onWithdrawClick: () => void;
  onTransferToBalanceClick: () => void;
  onCreateWalletClick: () => void;
};

export function ResidentWalletCard({
  wallet,
  isOwner,
  formatNaira,
  variant = "full",
  createWalletState,
  createWalletModalOpen,
  onFundWalletClick,
  onWithdrawClick,
  onTransferToBalanceClick,
  onCreateWalletClick,
}: Readonly<Props>) {
  return (
    <Card className="p-4 md:p-6 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">My Wallet</CardTitle>
      </CardHeader>

      <CardContent>
        {wallet ? (
          <div className="space-y-4">
            {variant === "fundOnly" ? (
              <div className="flex flex-col md:flex-row gap-5 md:gap-0 items-start md:items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Wallet Balance</p>
                  <p className="text-4xl font-bold mt-1">
                    {formatNaira(wallet?.balance ?? 0)}
                  </p>
                </div>
              </div>
            ) : isOwner ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col justify-center items-center w-full min-h-[120px] border border-[#CCCCCC] rounded-lg p-4">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    {"Total Wallet Balance"}
                    <span
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs cursor-help"
                      title="You can only withdraw from this balance."
                    >
                      i
                    </span>
                  </p>
                  <p className="text-2xl md:text-3xl font-bold mt-1 text-primary">
                    {formatNaira(wallet?.balance ?? 0)}
                  </p>
                </div>

                <div className="flex flex-col justify-center items-center w-full min-h-[120px] border border-[#CCCCCC] rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    Available Wallet Balance
                  </p>
                  <p className="text-2xl md:text-3xl font-bold mt-1">
                    {formatNaira(wallet?.availableBalance ?? wallet?.balance ?? 0)}
                  </p>
                </div>

                <div className="flex flex-col justify-center items-center w-full min-h-[120px] border border-[#CCCCCC] rounded-lg p-4">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    {"Withdrawable Wallet Balance"}
                    <span
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs cursor-help"
                      title="You can only withdraw from this balance."
                    >
                      i
                    </span>
                  </p>
                  <p className="text-2xl md:text-3xl font-bold mt-1 text-primary">
                    {formatNaira(wallet?.withdrawableBalance ?? 0)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-5 md:gap-0 items-start md:items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Wallet Balance</p>
                  <p className="text-4xl font-bold mt-1">
                    {formatNaira(wallet?.balance ?? 0)}
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              <Button
                onClick={onFundWalletClick}
                size="lg"
                className="px-6 w-full md:w-1/3"
              >
                Fund Wallet
              </Button>
              {variant === "full" && isOwner && (
                <>
                  <Button
                    onClick={onWithdrawClick}
                    size="lg"
                    variant="outline"
                    className="px-6 w-full md:w-1/3"
                  >
                    Withdraw
                  </Button>
                  <Button
                    onClick={onTransferToBalanceClick}
                    size="lg"
                    variant="secondary"
                    className="px-6 w-full md:w-1/3"
                    title={
                      (wallet?.withdrawableBalance ?? 0) <= 0
                        ? "No withdrawable balance to transfer"
                        : "Move withdrawable balance to your main balance"
                    }
                  >
                    Transfer to Balance
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <Button
            onClick={onCreateWalletClick}
            disabled={
              createWalletState === "isLoading" || (isOwner && createWalletModalOpen)
            }
          >
            {createWalletState === "isLoading" ? "Creating wallet..." : "Create Wallet"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

