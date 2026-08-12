"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Building2, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import {
  getFlutterwaveVirtualAccount,
  type FlutterwaveVirtualAccount,
} from "@/redux/slice/resident/virtual-accounts/flutterwave-va";
import SetupVirtualAccountModal from "@/components/resident/wallet/SetupVirtualAccountModal";
import { cn } from "@/lib/utils";

type VaContextValue = {
  loading: boolean;
  hasAccount: boolean;
  virtualAccount: FlutterwaveVirtualAccount | null;
  openSetup: () => void;
};

const VaContext = createContext<VaContextValue | null>(null);

function useVaContext() {
  const ctx = useContext(VaContext);
  if (!ctx) {
    throw new Error(
      "Resident virtual account controls must be used within ResidentVirtualAccountProvider",
    );
  }
  return ctx;
}

function formatAccountNumber(value: string) {
  return value.replace(/\s/g, "").replace(/(\d{4})(?=\d)/g, "$1 ");
}

type ProviderProps = {
  enabled?: boolean;
  children: React.ReactNode;
};

export function ResidentVirtualAccountProvider({
  enabled = true,
  children,
}: Readonly<ProviderProps>) {
  const dispatch = useDispatch<AppDispatch>();
  const { virtualAccount, getVirtualAccountState } = useSelector(
    (state: RootState) => state.residentFlutterwaveVa,
  );

  const [setupOpen, setSetupOpen] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const loading = !initialLoadDone && getVirtualAccountState !== "failed";
  const hasAccount = Boolean(virtualAccount?.accountNumber);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      try {
        await dispatch(getFlutterwaveVirtualAccount());
      } finally {
        if (!cancelled) setInitialLoadDone(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch, enabled]);

  const openSetup = useCallback(() => setSetupOpen(true), []);
  const handleSetupClose = useCallback(() => setSetupOpen(false), []);
  const handleSetupSuccess = useCallback(() => setSetupOpen(false), []);

  const value = useMemo<VaContextValue>(
    () => ({
      loading,
      hasAccount,
      virtualAccount,
      openSetup,
    }),
    [loading, hasAccount, virtualAccount, openSetup],
  );

  return (
    <VaContext.Provider value={value}>
      {children}
      <SetupVirtualAccountModal
        visible={setupOpen}
        onClose={handleSetupClose}
        onSuccess={handleSetupSuccess}
      />
    </VaContext.Provider>
  );
}

/** Header action: set up VA when the user does not have one yet. */
export function ResidentVirtualAccountSetupButton() {
  const { loading, hasAccount, openSetup } = useVaContext();

  if (hasAccount) return null;

  return (
    <Button
      type="button"
      onClick={openSetup}
      disabled={loading}
      className={cn(
        "h-10 shrink-0 rounded-full px-4",
        "transition-transform duration-100 ease-out active:scale-[0.97]",
      )}
    >
      <Building2 className="size-4" aria-hidden />
      {loading ? "Checking…" : "Set up virtual account"}
    </Button>
  );
}

/** Card under My Wallet: account number + account name when VA exists. */
export function ResidentVirtualAccountCard() {
  const { loading, hasAccount, virtualAccount } = useVaContext();

  if (loading && !hasAccount) {
    return (
      <Card className="p-4 shadow-md md:p-6" aria-busy aria-label="Loading virtual account">
        <CardHeader className="pb-3">
          <div className="h-5 w-40 animate-pulse rounded-md bg-muted/60" />
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="h-8 w-56 animate-pulse rounded-md bg-muted/60" />
          <div className="h-4 w-44 animate-pulse rounded-md bg-muted/50" />
        </CardContent>
      </Card>
    );
  }

  if (!hasAccount || !virtualAccount) return null;

  const accountNumber = virtualAccount.accountNumber ?? "";

  return (
    <Card className="overflow-hidden p-4 shadow-md md:p-6">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Building2
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <CardTitle className="text-lg font-semibold tracking-tight">
              Virtual account
            </CardTitle>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Bank transfer details for wallet funding.
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-500/15">
          <ShieldCheck className="size-3" aria-hidden />
          Active
        </span>
      </CardHeader>

      <CardContent className="pt-1">
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border border-black/5",
            "bg-linear-to-b from-slate-50/90 to-white",
            "px-5 py-5 sm:px-6",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
          )}
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Account number
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
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
              <p className="text-xs text-muted-foreground">Account name</p>
              <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                {virtualAccount.accountName || "—"}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Bank</p>
              <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                {virtualAccount.bankName || "—"}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
