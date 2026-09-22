"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { WalletData } from "@/redux/slice/resident/wallet-mgt/wallet-mgt-slice";
import { cn } from "@/lib/utils";

const PRESS =
  "transition-transform duration-100 ease-out active:scale-[0.97] motion-reduce:active:scale-100";
const ACTION = cn("h-12 rounded-xl px-6", PRESS);
const TILE =
  "rounded-2xl border border-black/5 bg-linear-to-b from-slate-50/90 to-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]";

function MaskableBalance({
  show,
  className,
  children,
}: Readonly<{
  show: boolean;
  className?: string;
  children: React.ReactNode;
}>) {
  return (
    <span
      className={cn(
        "inline-block tabular-nums tracking-[-0.03em]",
        "transition-[filter,opacity] duration-200 ease-out",
        "motion-reduce:transition-none",
        !show && "select-none blur-[10px] opacity-80",
        className,
      )}
      {...(show ? {} : { "aria-hidden": "true" })}
    >
      {children}
    </span>
  );
}

function VisibilityToggle({
  show,
  onToggle,
}: Readonly<{
  show: boolean;
  onToggle: () => void;
}>) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "size-10 shrink-0 rounded-full text-muted-foreground",
        "hover:bg-muted/70 hover:text-foreground",
        PRESS,
      )}
      onClick={onToggle}
      aria-label={show ? "Hide wallet balance" : "Show wallet balance"}
      aria-pressed={show}
    >
      {show ? (
        <EyeOff className="size-5" aria-hidden="true" />
      ) : (
        <Eye className="size-5" aria-hidden="true" />
      )}
    </Button>
  );
}

function Hint({ text }: Readonly<{ text: string }>) {
  return (
    <span
      className="inline-flex size-4 items-center justify-center text-muted-foreground/80"
      title={text}
    >
      <Info className="size-3.5" aria-hidden="true" />
      <span className="sr-only">{text}</span>
    </span>
  );
}

function BalanceFigure({
  label,
  amount,
  show,
  hint,
  size = "hero",
}: Readonly<{
  label: string;
  amount: string;
  show: boolean;
  hint?: string;
  size?: "hero" | "support";
}>) {
  const hero = size === "hero";
  return (
    <div>
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {label}
        {hint ? <Hint text={hint} /> : null}
      </p>
      <p
        className={cn(
          "mt-2 font-semibold leading-none tracking-[-0.03em]",
          hero
            ? "text-[2.15rem] sm:text-4xl"
            : "text-xl tracking-[-0.02em] sm:text-2xl",
        )}
      >
        <MaskableBalance show={show}>{amount}</MaskableBalance>
      </p>
    </div>
  );
}

function CompactBalance({
  amount,
  show,
  onFund,
}: Readonly<{
  amount: string;
  show: boolean;
  onFund: () => void;
}>) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <BalanceFigure label="Balance" amount={amount} show={show} />
      <Button
        type="button"
        onClick={onFund}
        className={cn(ACTION, "w-full sm:w-auto sm:min-w-40")}
      >
        Fund Wallet
      </Button>
    </div>
  );
}

function OwnerBalances({
  available,
  total,
  withdrawable,
  show,
}: Readonly<{
  available: string;
  total: string;
  withdrawable: string;
  show: boolean;
}>) {
  const withdrawHint = "You can only withdraw from this balance.";
  return (
    <div className="space-y-3">
      <div className={cn(TILE, "px-5 py-5")}>
        <BalanceFigure
          label="Available"
          amount={available}
          show={show}
          hint={withdrawHint}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-muted/40 px-5 py-4">
          <BalanceFigure
            label="Total"
            amount={total}
            show={show}
            size="support"
          />
        </div>
        <div className="rounded-2xl bg-muted/40 px-5 py-4">
          <BalanceFigure
            label="Withdrawable"
            amount={withdrawable}
            show={show}
            hint={withdrawHint}
            size="support"
          />
        </div>
      </div>
    </div>
  );
}

function OwnerActions({
  hasWithdrawalAccount,
  withdrawable,
  onFund,
  onWithdraw,
  onTransfer,
  onSetAccount,
}: Readonly<{
  hasWithdrawalAccount: boolean;
  withdrawable: number;
  onFund: () => void;
  onWithdraw: () => void;
  onTransfer: () => void;
  onSetAccount?: () => void;
}>) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <Button
        type="button"
        onClick={onFund}
        className={cn(ACTION, "w-full sm:flex-1")}
      >
        Fund Wallet
      </Button>
      {hasWithdrawalAccount ? (
        <Button
          type="button"
          onClick={onWithdraw}
          variant="outline"
          className={cn(ACTION, "w-full sm:flex-1")}
        >
          Withdraw
        </Button>
      ) : (
        <Button
          type="button"
          onClick={onSetAccount}
          variant="outline"
          className={cn(ACTION, "w-full sm:flex-1")}
        >
          Set Withdrawal Account
        </Button>
      )}
      <Button
        type="button"
        onClick={onTransfer}
        variant="secondary"
        className={cn(ACTION, "w-full sm:flex-1")}
        title={
          withdrawable <= 0
            ? "No withdrawable balance to transfer"
            : "Move withdrawable balance to your main balance"
        }
      >
        Transfer to Balance
      </Button>
    </div>
  );
}

function WalletSkeleton() {
  return (
    <div className="space-y-3" aria-busy aria-label="Loading wallet">
      <div className="h-4 w-20 animate-pulse rounded-md bg-muted/70" />
      <div className="h-10 w-48 animate-pulse rounded-md bg-muted/60" />
      <div className="h-12 w-full animate-pulse rounded-xl bg-muted/50 sm:w-40" />
    </div>
  );
}

function EmptyWallet({
  creating,
  disabled,
  onCreate,
}: Readonly<{
  creating: boolean;
  disabled: boolean;
  onCreate: () => void;
}>) {
  return (
    <div className="space-y-4 py-1">
      <p className="max-w-sm text-[15px] leading-relaxed text-muted-foreground">
        Create a wallet to fund payments and keep your balance in one place.
      </p>
      <Button
        type="button"
        onClick={onCreate}
        disabled={disabled}
        className={cn(ACTION, "w-full sm:w-auto")}
      >
        {creating ? "Creating wallet…" : "Create Wallet"}
      </Button>
    </div>
  );
}

type Props = {
  wallet: WalletData | null;
  isOwner: boolean;
  formatNaira: (value: number) => string;
  /** Default "full". Use "fundOnly" to show only balance + fund button. */
  variant?: "full" | "fundOnly";
  /** True while wallet fetch has not finished — avoid flashing Create Wallet. */
  walletLoading?: boolean;
  createWalletState: string;
  createWalletModalOpen: boolean;
  onFundWalletClick: () => void;
  onWithdrawClick: () => void;
  onTransferToBalanceClick: () => void;
  onCreateWalletClick: () => void;
  onSetWithdrawalAccountClick?: () => void;
};

export function ResidentWalletCard({
  wallet,
  isOwner,
  formatNaira,
  variant = "full",
  walletLoading = false,
  createWalletState,
  createWalletModalOpen,
  onFundWalletClick,
  onWithdrawClick,
  onTransferToBalanceClick,
  onCreateWalletClick,
  onSetWithdrawalAccountClick,
}: Readonly<Props>) {
  const [showBalance, setShowBalance] = useState(true);
  const hasWallet = Boolean(wallet?.id);
  const hasWithdrawalAccount = Boolean(wallet?.accountNumber?.trim());
  const creating = createWalletState === "isLoading";
  const compact = variant === "fundOnly" || !isOwner;

  let body: React.ReactNode = (
    <EmptyWallet
      creating={creating}
      disabled={creating || (isOwner && createWalletModalOpen)}
      onCreate={onCreateWalletClick}
    />
  );

  if (hasWallet) {
    body = (
      <div className="space-y-6">
        {compact ? (
          <CompactBalance
            amount={formatNaira(wallet?.balance ?? 0)}
            show={showBalance}
            onFund={onFundWalletClick}
          />
        ) : (
          <>
            <OwnerBalances
              available={formatNaira(
                wallet?.availableBalance ?? wallet?.balance ?? 0,
              )}
              total={formatNaira(wallet?.balance ?? 0)}
              withdrawable={formatNaira(wallet?.withdrawableBalance ?? 0)}
              show={showBalance}
            />
            <OwnerActions
              hasWithdrawalAccount={hasWithdrawalAccount}
              withdrawable={wallet?.withdrawableBalance ?? 0}
              onFund={onFundWalletClick}
              onWithdraw={onWithdrawClick}
              onTransfer={onTransferToBalanceClick}
              onSetAccount={onSetWithdrawalAccountClick}
            />
          </>
        )}
      </div>
    );
  } else if (walletLoading) {
    body = <WalletSkeleton />;
  }

  return (
    <Card className="p-4 shadow-sm md:p-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-0 pb-0">
        <CardTitle className="text-[1.35rem] font-semibold tracking-[-0.02em]">
          Wallet
        </CardTitle>
        {hasWallet ? (
          <VisibilityToggle
            show={showBalance}
            onToggle={() => setShowBalance((v) => !v)}
          />
        ) : null}
      </CardHeader>

      <CardContent className="px-0 pt-5">{body}</CardContent>
    </Card>
  );
}
