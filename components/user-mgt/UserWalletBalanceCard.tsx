"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Eye, EyeOff, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import axiosInstance from "@/utils/axiosInstance";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatTransactionAmount } from "@/lib/transaction-summary-chart";
import {
  computeWalletTotalBalance,
  type WalletBalanceFields,
} from "@/lib/wallet-balance";
import { cn } from "@/lib/utils";

type UserWalletBalanceCardProps = {
  userId: string;
};

function toWallet(raw: unknown): WalletBalanceFields | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const nested =
    data.data && typeof data.data === "object" && !Array.isArray(data.data)
      ? (data.data as Record<string, unknown>)
      : data;
  const hasWalletId = Boolean(nested.id || nested._id || nested.userId);
  const hasBalanceField =
    nested.balance != null ||
    nested.availableBalance != null ||
    nested.withdrawableBalance != null;
  if (!hasWalletId && !hasBalanceField) return null;
  return {
    balance: Number(nested.balance ?? 0),
    availableBalance: Number(nested.availableBalance ?? 0),
    withdrawableBalance: Number(nested.withdrawableBalance ?? 0),
    lockedBalance: Number(nested.lockedBalance ?? 0),
    temporaryBalance: Number(nested.temporaryBalance ?? 0),
  };
}

function MaskedAmount({
  show,
  value,
}: Readonly<{ show: boolean; value: number }>) {
  return (
    <span
      className={cn(
        "inline-block tabular-nums tracking-tight transition-[filter] duration-200 ease-out",
        "motion-reduce:transition-none",
        !show && "select-none blur-[10px]",
      )}
      {...(show ? {} : { "aria-hidden": true })}
    >
      {formatTransactionAmount(value)}
    </span>
  );
}

export function UserWalletBalanceCard({
  userId,
}: Readonly<UserWalletBalanceCardProps>) {
  const [wallet, setWallet] = useState<WalletBalanceFields | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setWallet(null);

    (async () => {
      try {
        const res = await axiosInstance.get(
          `/api/v1/wallet-mgt/${userId}?userId=${userId}`,
        );
        if (cancelled) return;
        setWallet(toWallet(res.data));
      } catch (err: unknown) {
        if (cancelled) return;
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        if (status === 404) {
          setWallet(null);
          setError(null);
          return;
        }
        setWallet(null);
        setError(getApiErrorMessage(err) ?? "Could not load wallet.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const total = computeWalletTotalBalance(wallet);
  const available = Number(wallet?.availableBalance ?? wallet?.balance ?? 0);
  const withdrawable = Number(wallet?.withdrawableBalance ?? 0);

  let body: ReactNode;
  if (loading) {
    body = (
      <p className="mt-5 text-sm text-muted-foreground">Loading wallet…</p>
    );
  } else if (error) {
    body = <p className="mt-5 text-sm text-destructive">{error}</p>;
  } else if (!wallet) {
    body = (
      <p className="mt-5 text-sm text-muted-foreground">
        No wallet has been set up for this user yet.
      </p>
    );
  } else {
    body = (
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-black/5 px-4 py-3 dark:bg-white/10">
          <p className="text-xs font-medium tracking-wide text-muted-foreground">
            Available
          </p>
          <p className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
            <MaskedAmount show={showBalance} value={available} />
          </p>
        </div>
        <div className="rounded-xl bg-black/5 px-4 py-3 dark:bg-white/10">
          <p className="text-xs font-medium tracking-wide text-muted-foreground">
            Withdrawable
          </p>
          <p className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
            <MaskedAmount show={showBalance} value={withdrawable} />
          </p>
        </div>
        <div className="rounded-xl bg-black/5 px-4 py-3 dark:bg-white/10">
          <p className="text-xs font-medium tracking-wide text-muted-foreground">
            Total
          </p>
          <p className="mt-1 text-xl font-bold tracking-tight text-primary sm:text-2xl">
            <MaskedAmount show={showBalance} value={total} />
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-2xl border border-white/40 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.08)]",
        "bg-white/70 backdrop-blur-[20px] backdrop-saturate-150",
        "dark:border-white/10 dark:bg-zinc-900/70",
        "[@media(prefers-reduced-transparency:reduce)]:bg-card [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <Wallet className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="font-heading text-base font-semibold tracking-tight">
              Wallet
            </h2>
            <p className="text-sm text-muted-foreground">
              Current balance for this user
            </p>
          </div>
        </div>
        {wallet ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground transition-transform duration-100 ease-out active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
            onClick={() => setShowBalance((open) => !open)}
            aria-label={showBalance ? "Hide wallet balance" : "Show wallet balance"}
            aria-pressed={showBalance}
          >
            {showBalance ? (
              <EyeOff className="h-5 w-5" aria-hidden />
            ) : (
              <Eye className="h-5 w-5" aria-hidden />
            )}
          </Button>
        ) : null}
      </div>

      {body}
    </Card>
  );
}
