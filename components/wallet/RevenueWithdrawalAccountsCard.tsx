"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Banknote,
  ChevronRight,
  Landmark,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/redux/store";
import type { RevenueWithdrawalRole } from "@/redux/slice/wallet-mgt/create-revenue-withdrawal-module";
import {
  getCompanyRevenueWithdrawalAccounts,
  getCompanyRevenueWithdrawalTypes,
  setCompanyAutoSettlement,
  selectCompanyAutoSettlementEnabled,
  selectCompanyGetRevenueWithdrawalAccountsState,
  selectCompanyRevenueWithdrawalAccounts,
  selectCompanyRevenueWithdrawalLoading,
  selectCompanyRevenueWithdrawalTypes,
  selectCompanySetAutoSettlementState,
} from "@/redux/slice/company/wallet-mgt/revenue-withdrawal-account-slice";
import {
  getEstateAdminRevenueWithdrawalAccounts,
  getEstateAdminRevenueWithdrawalTypes,
  setEstateAdminAutoSettlement,
  selectEstateAdminAutoSettlementEnabled,
  selectEstateAdminGetRevenueWithdrawalAccountsState,
  selectEstateAdminRevenueWithdrawalAccounts,
  selectEstateAdminRevenueWithdrawalLoading,
  selectEstateAdminRevenueWithdrawalTypes,
  selectEstateAdminSetAutoSettlementState,
} from "@/redux/slice/estate-admin/wallet-mgt/revenue-withdrawal-account-slice";
import {
  getEnergyProviderRevenueWithdrawalAccounts,
  getEnergyProviderRevenueWithdrawalTypes,
  setEnergyProviderAutoSettlement,
  selectEnergyProviderAutoSettlementEnabled,
  selectEnergyProviderGetRevenueWithdrawalAccountsState,
  selectEnergyProviderRevenueWithdrawalAccounts,
  selectEnergyProviderRevenueWithdrawalLoading,
  selectEnergyProviderRevenueWithdrawalTypes,
  selectEnergyProviderSetAutoSettlementState,
} from "@/redux/slice/energy-provider/wallet-mgt/revenue-withdrawal-account-slice";
import SetRevenueWithdrawalAccountModal from "@/components/wallet/SetRevenueWithdrawalAccountModal";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";

const ROLE_API = {
  company: {
    getAccounts: getCompanyRevenueWithdrawalAccounts,
    getTypes: getCompanyRevenueWithdrawalTypes,
    setAutoSettlement: setCompanyAutoSettlement,
    selectAccounts: selectCompanyRevenueWithdrawalAccounts,
    selectTypes: selectCompanyRevenueWithdrawalTypes,
    selectAutoSettlement: selectCompanyAutoSettlementEnabled,
    selectLoading: selectCompanyRevenueWithdrawalLoading,
    selectSetAutoSettlementState: selectCompanySetAutoSettlementState,
    selectGetAccountsState: selectCompanyGetRevenueWithdrawalAccountsState,
  },
  estateAdmin: {
    getAccounts: getEstateAdminRevenueWithdrawalAccounts,
    getTypes: getEstateAdminRevenueWithdrawalTypes,
    setAutoSettlement: setEstateAdminAutoSettlement,
    selectAccounts: selectEstateAdminRevenueWithdrawalAccounts,
    selectTypes: selectEstateAdminRevenueWithdrawalTypes,
    selectAutoSettlement: selectEstateAdminAutoSettlementEnabled,
    selectLoading: selectEstateAdminRevenueWithdrawalLoading,
    selectSetAutoSettlementState: selectEstateAdminSetAutoSettlementState,
    selectGetAccountsState: selectEstateAdminGetRevenueWithdrawalAccountsState,
  },
  energyProvider: {
    getAccounts: getEnergyProviderRevenueWithdrawalAccounts,
    getTypes: getEnergyProviderRevenueWithdrawalTypes,
    setAutoSettlement: setEnergyProviderAutoSettlement,
    selectAccounts: selectEnergyProviderRevenueWithdrawalAccounts,
    selectTypes: selectEnergyProviderRevenueWithdrawalTypes,
    selectAutoSettlement: selectEnergyProviderAutoSettlementEnabled,
    selectLoading: selectEnergyProviderRevenueWithdrawalLoading,
    selectSetAutoSettlementState: selectEnergyProviderSetAutoSettlementState,
    selectGetAccountsState:
      selectEnergyProviderGetRevenueWithdrawalAccountsState,
  },
} as const;

function formatAccountNumber(value: string) {
  return value.replace(/\s/g, "").replace(/(\d{4})(?=\d)/g, "$1 ");
}

function AutoSettlementToggle({
  enabled,
  pending,
  onChange,
}: Readonly<{
  enabled: boolean;
  pending: boolean;
  onChange: (next: boolean) => void;
}>) {
  const reduceMotion = useReducedMotion();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-busy={pending}
      disabled={pending}
      onClick={() => onChange(!enabled)}
      className={cn(
        "relative inline-flex h-8 w-[52px] shrink-0 items-center rounded-full p-0.5",
        "transition-[background-color,transform] duration-100 ease-out active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-wait disabled:opacity-70",
        enabled ? "bg-emerald-600" : "bg-muted-foreground/25",
      )}
    >
      <motion.span
        layout
        className="block size-7 rounded-full bg-white shadow-sm"
        animate={{ x: enabled ? 20 : 0 }}
        transition={
          reduceMotion
            ? { duration: 0.15 }
            : { type: "spring", bounce: 0, duration: 0.35 }
        }
      />
      <span className="sr-only">
        {enabled ? "Disable auto-settlement" : "Enable auto-settlement"}
      </span>
    </button>
  );
}

export type RevenueWithdrawalAccountsCardProps = {
  role: RevenueWithdrawalRole;
};

export default function RevenueWithdrawalAccountsCard({
  role,
}: Readonly<RevenueWithdrawalAccountsCardProps>) {
  const dispatch = useDispatch<AppDispatch>();
  const reduceMotion = useReducedMotion();
  const api = ROLE_API[role];

  const accounts = useSelector(api.selectAccounts);
  const types = useSelector(api.selectTypes);
  const autoSettlementEnabled = useSelector(api.selectAutoSettlement);
  const loading = useSelector(api.selectLoading);
  const setAutoSettlementState = useSelector(api.selectSetAutoSettlementState);
  const getAccountsState = useSelector(api.selectGetAccountsState);

  const [refreshing, setRefreshing] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [selectedType, setSelectedType] = useState<{
    value: string;
    label: string;
  } | null>(null);

  const accountByType = useMemo(() => {
    const map = new Map<string, (typeof accounts)[number]>();
    for (const account of accounts) {
      map.set(account.revenueType, account);
    }
    return map;
  }, [accounts]);

  const rows = useMemo(() => {
    const typeList =
      types.length > 0
        ? types
        : [
            { value: "service_charge", label: "Service Charge" },
            { value: "vending", label: "Vending" },
            { value: "bills", label: "Bills" },
            { value: "other", label: "Other" },
            { value: "default", label: "Default" },
          ];

    return typeList.map((type) => ({
      ...type,
      account: accountByType.get(type.value) ?? null,
    }));
  }, [types, accountByType]);

  const configuredCount = rows.filter((row) => row.account).length;
  const autoEnabled = autoSettlementEnabled === true;
  const toggling = setAutoSettlementState === "isLoading";

  const loadData = async () => {
    await Promise.all([
      dispatch(api.getTypes()),
      dispatch(api.getAccounts()),
    ]);
  };

  useEffect(() => {
    let cancelled = false;
    setInitialLoadDone(false);
    (async () => {
      try {
        await loadData();
      } finally {
        if (!cancelled) setInitialLoadDone(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, role]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
      toast.success("Settlement settings refreshed.");
    } catch {
      toast.error("Failed to refresh settlement settings.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleAutoSettlement = async (next: boolean) => {
    try {
      await dispatch(api.setAutoSettlement(next)).unwrap();
      toast.success(
        next
          ? "Auto-settlement enabled. Funds settle after T+1."
          : "Auto-settlement disabled.",
      );
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ||
          "Failed to update auto-settlement.",
      );
    }
  };

  const showLoading = !initialLoadDone && getAccountsState === "isLoading";

  return (
    <>
      <Card className="overflow-hidden p-4 shadow-md md:p-6">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
          <div className="min-w-0 pr-3">
            <div className="flex items-center gap-2">
              <Landmark
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <CardTitle className="text-lg font-semibold tracking-tight">
                Revenue settlement
              </CardTitle>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Bank accounts for service charge, vending, bills, and other
              revenue. Auto-settlement pays out after T+1.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className={cn(
              "shrink-0 text-muted-foreground",
              "transition-transform duration-100 ease-out active:scale-[0.97]",
            )}
          >
            <RefreshCw
              className={cn("size-3.5", (refreshing || loading) && "animate-spin")}
              aria-hidden
            />
            {refreshing ? "Refreshing…" : "Refresh"}
          </Button>
        </CardHeader>

        <CardContent className="space-y-5 pt-1">
          <div
            className={cn(
              "relative overflow-hidden rounded-2xl border border-black/5",
              "bg-linear-to-b from-slate-50/90 to-white",
              "px-4 py-4 sm:px-5",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
            )}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Sparkles
                    className="size-3.5 shrink-0 text-emerald-700"
                    aria-hidden
                  />
                  <p className="text-[15px] font-semibold tracking-tight text-foreground">
                    Auto-settlement
                  </p>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {autoEnabled
                    ? "On — configured revenue settles to the matching bank account after T+1."
                    : "Off — revenue stays in your wallet until you withdraw."}
                </p>
              </div>
              <AutoSettlementToggle
                enabled={autoEnabled}
                pending={toggling}
                onChange={handleToggleAutoSettlement}
              />
            </div>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {showLoading ? (
              <motion.div
                key="loading"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={
                  reduceMotion
                    ? { duration: 0.15 }
                    : { type: "spring", bounce: 0, duration: 0.35 }
                }
                className="space-y-3"
                aria-busy
                aria-label="Loading settlement accounts"
              >
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-xl bg-muted/60"
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={
                  reduceMotion
                    ? { duration: 0.15 }
                    : { type: "spring", bounce: 0, duration: 0.35 }
                }
                className="space-y-2"
              >
                <div className="flex items-center justify-between gap-2 px-0.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Revenue accounts
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {configuredCount}/{rows.length} configured
                  </p>
                </div>

                <ul className="divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/5 bg-white/70">
                  {rows.map((row) => {
                    const configured = Boolean(row.account);
                    return (
                      <li key={row.value}>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedType({
                              value: row.value,
                              label: row.label,
                            })
                          }
                          className={cn(
                            "flex w-full items-center gap-3 px-4 py-3.5 text-left",
                            "transition-[background-color,transform] duration-100 ease-out",
                            "hover:bg-slate-50/80 active:scale-[0.995] active:bg-slate-50",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-9 shrink-0 items-center justify-center rounded-xl",
                              configured
                                ? "bg-emerald-500/10 text-emerald-700"
                                : "bg-muted text-muted-foreground",
                            )}
                            aria-hidden
                          >
                            <Banknote className="size-4" strokeWidth={1.75} />
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="truncate text-sm font-medium tracking-tight text-foreground">
                                {row.label}
                              </span>
                              {configured ? (
                                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-500/15">
                                  Set
                                </span>
                              ) : (
                                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                  Not set
                                </span>
                              )}
                            </span>
                            {row.account ? (
                              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                {row.account.accountName || "Account"} ·{" "}
                                <span className="tabular-nums tracking-wide">
                                  {formatAccountNumber(row.account.accountNumber)}
                                </span>
                              </span>
                            ) : (
                              <span className="mt-0.5 block text-xs text-muted-foreground">
                                Tap to add a settlement bank account
                              </span>
                            )}
                          </span>

                          <ChevronRight
                            className="size-4 shrink-0 text-muted-foreground/70"
                            aria-hidden
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      <SetRevenueWithdrawalAccountModal
        role={role}
        visible={Boolean(selectedType)}
        revenueType={selectedType?.value ?? ""}
        revenueTypeLabel={selectedType?.label ?? "Revenue"}
        onClose={() => setSelectedType(null)}
        onSuccess={() => {
          dispatch(api.getAccounts());
        }}
      />
    </>
  );
}
