"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
// import { TransactionSummaryCard } from "@/components/charts/transaction-summary-card";
import { UserSummaryCard } from "@/components/charts/UserSummaryCard";
import { RoleBreakdownChart } from "@/components/charts/RoleBreakdownChart";
import { MeterSummaryCard } from "@/components/charts/MeterSummaryCard";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  extractEstateIdFromUser,
  extractEstateNameFromUser,
} from "@/lib/user-id";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getAdminTransactionSummary } from "@/redux/slice/admin/transaction-summary/admin-transaction-summary";
import {
  getUserRoleBreakdown,
  getUserSummary,
} from "@/redux/slice/admin/user-analytics/user-analytics";
import {
  selectRoleBreakdownData,
  selectRoleBreakdownError,
  selectRoleBreakdownLoading,
  selectUserSummaryData,
  selectUserSummaryError,
  selectUserSummaryLoading,
} from "@/redux/slice/admin/user-analytics/user-analytics-slice";
import { getMeterSummary } from "@/redux/slice/admin/meter-summary/meter-summary";
import {
  selectMeterSummaryData,
  selectMeterSummaryError,
  selectMeterSummaryLoading,
} from "@/redux/slice/admin/meter-summary/meter-summary-slice";
import type { AppDispatch, RootState } from "@/redux/store";

export default function AdminOverview() {
  const dispatch = useDispatch<AppDispatch>();
  const [estateId, setEstateId] = useState<string | null>(null);
  const [estateName, setEstateName] = useState("Estate");

  const userSummary = useSelector(selectUserSummaryData);
  const userSummaryLoading = useSelector(selectUserSummaryLoading);
  const userSummaryError = useSelector(selectUserSummaryError);

  const roleBreakdown = useSelector(selectRoleBreakdownData);
  const roleBreakdownLoading = useSelector(selectRoleBreakdownLoading);
  const roleBreakdownError = useSelector(selectRoleBreakdownError);

  const meterSummary = useSelector(selectMeterSummaryData);
  const meterSummaryLoading = useSelector(selectMeterSummaryLoading);
  const meterSummaryError = useSelector(selectMeterSummaryError);

  const { transactionSummary, transactionSummaryLoading } = useSelector(
    (state: RootState) => ({
      transactionSummary: state.adminTransactionSummary.summary,
      transactionSummaryLoading:
        state.adminTransactionSummary.status === "isLoading",
    }),
  );

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const user = userRes?.data as Record<string, unknown> | undefined;
        const id = extractEstateIdFromUser(user);
        const name = extractEstateNameFromUser(user) ?? "Estate";
        if (id) {
          setEstateId(id);
          setEstateName(name);
        }
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (!estateId) return;
    void dispatch(getUserSummary({ estateId }));
    void dispatch(getUserRoleBreakdown({ estateId }));
    void dispatch(getMeterSummary({ estateId }));
    dispatch(getAdminTransactionSummary({ estateId }))
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [dispatch, estateId]);

  const handleUserSummaryRetry = () => {
    if (!estateId) return;
    void dispatch(getUserSummary({ estateId }));
  };

  const handleRoleBreakdownRetry = () => {
    if (!estateId) return;
    void dispatch(getUserRoleBreakdown({ estateId }));
  };

  const handleMeterSummaryRetry = () => {
    if (!estateId) return;
    void dispatch(getMeterSummary({ estateId }));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s an overview of{" "}
          <span className="font-bold uppercase">{estateName}</span>
        </p>
      </div>

      <UserSummaryCard
        data={userSummary}
        loading={userSummaryLoading}
        error={userSummaryError}
        onRetry={handleUserSummaryRetry}
      />

      <MeterSummaryCard
        data={meterSummary}
        loading={meterSummaryLoading}
        error={meterSummaryError}
        onRetry={handleMeterSummaryRetry}
        estateName={estateName}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <RoleBreakdownChart
          data={roleBreakdown}
          loading={roleBreakdownLoading}
          error={roleBreakdownError}
          onRetry={handleRoleBreakdownRetry}
        />
        {/* <TransactionSummaryCard
          data={transactionSummary}
          loading={transactionSummaryLoading}
          emptyMessage={
            !estateId
              ? "No estate linked to your account."
              : "No transaction data to display."
          }
        /> */}
      </div>
    </div>
  );
}
