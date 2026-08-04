"use client";

import React, { useEffect, useState } from "react";
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

type Props = {
  /** When false, skip fetching (e.g. user not loaded yet). */
  enabled?: boolean;
  /** Wallet and VA are independent; used only for helper copy. */
  hasWallet?: boolean;
};

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
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Bank name</p>
          <p className="font-medium mt-0.5">
            {virtualAccount.bankName || "—"}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Account number</p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="font-medium tabular-nums tracking-wide">
              {virtualAccount.accountNumber}
            </p>
            {virtualAccount.accountNumber ? (
              <CopyButton
                value={virtualAccount.accountNumber}
                title="Copy account number"
                copiedMessage="Account number copied"
              />
            ) : null}
          </div>
        </div>
        <div className="md:col-span-2">
          <p className="text-sm text-muted-foreground">Account name</p>
          <p className="font-medium mt-0.5">
            {virtualAccount.accountName || "—"}
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Use this account for wallet funding only. Transfers reflect after bank
        confirmation.
        {bvnVerified ? " BVN verified." : null}
        {!hasWallet
          ? " Create a wallet if you have not already, so transfers can credit your balance."
          : null}
      </p>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing…" : "Refresh status"}
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
    <div className="flex flex-col items-center text-center py-6 space-y-3">
      <p className="text-sm text-muted-foreground max-w-md">
        Permanent NGN account for wallet funding. Works alongside your wallet —
        checkout funding is unchanged.
      </p>
      {!hasWallet ? (
        <p className="text-xs text-muted-foreground max-w-md">
          Create a wallet if you have not already, so transfers can credit your
          balance.
        </p>
      ) : null}
      <Button type="button" onClick={onSetup}>
        Set up virtual account
      </Button>
    </div>
  );
}

export function ResidentVirtualAccountCard(
  _props: Readonly<Props>,
) {
  // Temporarily disabled — payment virtual account UI
  // To re-enable: return <ResidentVirtualAccountCardImpl {..._props} /> and restore API thunks.
  return null;
}

/** Preserved implementation — re-wire via ResidentVirtualAccountCard when re-enabling. */
export function ResidentVirtualAccountCardImpl({
  enabled = true,
  hasWallet = false,
}: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();
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

  let body: React.ReactNode = (
    <EmptyVirtualAccountState
      hasWallet={hasWallet}
      onSetup={() => setSetupOpen(true)}
    />
  );
  if (loading && !hasAccount) {
    body = (
      <p className="text-sm text-muted-foreground py-6 text-center">
        Loading virtual account…
      </p>
    );
  } else if (hasAccount && virtualAccount) {
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
      <Card className="p-4 md:p-6 shadow-md">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg font-semibold">
              Fund via bank transfer
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Permanent NGN virtual account for wallet funding. Independent of
              checkout funding.
            </p>
          </div>
          {hasAccount ? (
            <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
              Active
            </span>
          ) : null}
        </CardHeader>

        <CardContent>{body}</CardContent>
      </Card>

      <SetupVirtualAccountModal
        visible={setupOpen}
        onClose={() => setSetupOpen(false)}
      />
    </>
  );
}
