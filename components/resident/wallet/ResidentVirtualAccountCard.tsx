"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Building2,
  Landmark,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import {
  getFlutterwaveBvnStatus,
  getFlutterwaveVirtualAccount,
  type FlutterwaveVirtualAccount,
} from "@/redux/slice/resident/virtual-accounts/flutterwave-va";
import SetupVirtualAccountModal from "@/components/resident/wallet/SetupVirtualAccountModal";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";

type Props = {
  /** When false, skip fetching (e.g. user not loaded yet). */
  enabled?: boolean;
  /** Wallet and VA are independent; used only for helper copy. */
  hasWallet?: boolean;
};

function formatAccountNumber(value: string) {
  return value.replace(/\s/g, "").replace(/(\d{4})(?=\d)/g, "$1 ");
}

function ActiveVirtualAccountDetails({
  virtualAccount,
  bvnVerified,
  hasWallet,
  refreshing,
  onRefresh,
}: Readonly<{
  virtualAccount: FlutterwaveVirtualAccount;
  bvnVerified: boolean;
  hasWallet: boolean;
  refreshing: boolean;
  onRefresh: () => void;
}>) {
  const accountNumber = virtualAccount.accountNumber ?? "";

  return (
    <div className="space-y-5">
      {/* Hero: account number is the only job of this surface */}
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-black/5",
          "bg-gradient-to-b from-slate-50/90 to-white",
          "px-5 py-6 sm:px-6",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Account number
          </p>
          {bvnVerified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              <ShieldCheck className="size-3" aria-hidden />
              BVN verified
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <p
            className={cn(
              "font-semibold tabular-nums tracking-[0.12em] text-foreground",
              "text-[1.65rem] leading-none sm:text-[1.85rem]",
              "select-all",
            )}
          >
            {accountNumber ? formatAccountNumber(accountNumber) : "—"}
          </p>
          {accountNumber ? (
            <CopyButton
              value={accountNumber}
              title="Copy account number"
              copiedMessage="Account number copied"
              className={cn(
                "h-8 rounded-full border border-black/8 bg-white/80 px-3",
                "text-foreground/80 shadow-xs backdrop-blur-sm",
                "transition-transform duration-100 ease-out active:scale-[0.97]",
                "hover:bg-white hover:text-foreground",
              )}
            />
          ) : null}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Bank</p>
            <p className="mt-0.5 truncate text-sm font-medium text-foreground">
              {virtualAccount.bankName || "—"}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Account name</p>
            <p className="mt-0.5 truncate text-sm font-medium text-foreground">
              {virtualAccount.accountName || "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
          Transfer here to fund your wallet. Credits appear after bank
          confirmation.
          {!hasWallet
            ? " Create a wallet if you haven’t already, so transfers can credit your balance."
            : null}
        </p>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={refreshing}
          className={cn(
            "shrink-0 self-end text-muted-foreground",
            "transition-transform duration-100 ease-out active:scale-[0.97]",
          )}
        >
          <RefreshCw
            className={cn("size-3.5", refreshing && "animate-spin")}
            aria-hidden
          />
          {refreshing ? "Refreshing…" : "Refresh"}
        </Button>
      </div>
    </div>
  );
}

function EmptyVirtualAccountState({
  hasWallet,
  onSetup,
}: Readonly<{
  hasWallet: boolean;
  onSetup: () => void;
}>) {
  return (
    <div className="flex flex-col items-center px-2 py-8 text-center sm:py-10">
      <div
        className={cn(
          "mb-5 flex size-14 items-center justify-center rounded-2xl",
          "bg-primary/8 text-primary",
          "ring-1 ring-inset ring-primary/10",
        )}
        aria-hidden
      >
        <Landmark className="size-6" strokeWidth={1.75} />
      </div>

      <h3 className="text-[17px] font-semibold tracking-tight text-foreground">
        Get a permanent funding account
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        Receive NGN bank transfers into your wallet anytime—checkout funding
        stays the same.
      </p>

      {!hasWallet ? (
        <p className="mt-3 max-w-sm text-xs leading-relaxed text-muted-foreground/90">
          You’ll need a wallet so transfers can credit your balance.
        </p>
      ) : null}

      <Button
        type="button"
        onClick={onSetup}
        className={cn(
          "mt-6 h-10 rounded-full px-6",
          "transition-transform duration-100 ease-out active:scale-[0.97]",
        )}
      >
        Set up virtual account
      </Button>
    </div>
  );
}

function LoadingVirtualAccountState() {
  return (
    <div className="space-y-4 py-2" aria-busy aria-label="Loading virtual account">
      <div className="h-36 animate-pulse rounded-2xl bg-muted/60" />
      <div className="h-3 w-2/3 animate-pulse rounded-full bg-muted/50" />
    </div>
  );
}

export function ResidentVirtualAccountCard({
  enabled = true,
  hasWallet = false,
}: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();
  const reduceMotion = useReducedMotion();
  const { virtualAccount, getVirtualAccountState, bvnStatus } = useSelector(
    (state: RootState) => state.residentFlutterwaveVa,
  );

  const [setupOpen, setSetupOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const loading = !initialLoadDone && getVirtualAccountState !== "failed";
  const hasAccount = Boolean(virtualAccount?.accountNumber);
  const bvnVerified = Boolean(bvnStatus?.verified);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      try {
        await Promise.all([
          dispatch(getFlutterwaveVirtualAccount()),
          dispatch(getFlutterwaveBvnStatus()),
        ]);
      } finally {
        if (!cancelled) setInitialLoadDone(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch, enabled]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(getFlutterwaveVirtualAccount()).unwrap(),
        dispatch(getFlutterwaveBvnStatus()).unwrap().catch(() => null),
      ]);
      toast.success("Status refreshed.");
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message || "Failed to refresh.",
      );
    } finally {
      setRefreshing(false);
    }
  };

  let bodyKey = "empty";
  let body: React.ReactNode = (
    <EmptyVirtualAccountState
      hasWallet={hasWallet}
      onSetup={() => setSetupOpen(true)}
    />
  );
  if (loading && !hasAccount) {
    bodyKey = "loading";
    body = <LoadingVirtualAccountState />;
  } else if (hasAccount && virtualAccount) {
    bodyKey = "active";
    body = (
      <ActiveVirtualAccountDetails
        virtualAccount={virtualAccount}
        bvnVerified={bvnVerified}
        hasWallet={hasWallet}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
    );
  }

  return (
    <>
      <Card className="overflow-hidden p-4 shadow-md md:p-6">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
          <div className="min-w-0 pr-3">
            <div className="flex items-center gap-2">
              <Building2
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <CardTitle className="text-lg font-semibold tracking-tight">
                Bank transfer
              </CardTitle>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Permanent NGN account for wallet funding.
            </p>
          </div>
          {hasAccount ? (
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium",
                "bg-emerald-500/10 text-emerald-700",
                "ring-1 ring-inset ring-emerald-500/15",
              )}
            >
              Active
            </span>
          ) : null}
        </CardHeader>

        <CardContent className="pt-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={bodyKey}
              initial={
                reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }
              }
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={
                reduceMotion
                  ? { duration: 0.15 }
                  : { type: "spring", bounce: 0, duration: 0.35 }
              }
            >
              {body}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      <SetupVirtualAccountModal
        visible={setupOpen}
        onClose={() => setSetupOpen(false)}
      />
    </>
  );
}
