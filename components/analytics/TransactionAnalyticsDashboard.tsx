"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isPending } from "@/lib/async-status";
import { getTransactionAnalyticsDashboard } from "@/redux/slice/estate-admin/transaction-analytics/transaction-analytics";
import {
  selectTransactionAnalyticsDashboard,
  selectTransactionAnalyticsError,
  selectTransactionAnalyticsStatus,
} from "@/redux/slice/estate-admin/transaction-analytics/transaction-analytics-slice";
import type { AppDispatch } from "@/redux/store";
import { TransactionTrendChart } from "@/components/analytics/TransactionTrendChart";
import { TopUsersChart } from "@/components/analytics/TopUsersChart";
import { ChargeBreakdownChart } from "@/components/analytics/ChargeBreakdownChart";

type TransactionAnalyticsDashboardProps = Readonly<{
  estateId: string | null;
  className?: string;
}>;

function hasStatusData(paid: number, pending: number, failed: number): boolean {
  return paid > 0 || pending > 0 || failed > 0;
}

export function TransactionAnalyticsDashboard({
  estateId,
  className,
}: TransactionAnalyticsDashboardProps) {
  const dispatch = useDispatch<AppDispatch>();
  const dashboard = useSelector(selectTransactionAnalyticsDashboard);
  const status = useSelector(selectTransactionAnalyticsStatus);
  const error = useSelector(selectTransactionAnalyticsError);
  const loading = Boolean(estateId) && isPending(status);

  useEffect(() => {
    if (!estateId) return;
    void dispatch(getTransactionAnalyticsDashboard({ estateId }));
  }, [dispatch, estateId]);

  const handleRetry = () => {
    if (!estateId) return;
    void dispatch(getTransactionAnalyticsDashboard({ estateId }));
  };

  if (!estateId) {
    return (
      <div
        className={cn(
          "flex min-h-[140px] items-center justify-center rounded-xl border border-border bg-card p-6 text-center shadow-sm",
          className,
        )}
      >
        <p className="text-sm text-muted-foreground">
          No estate linked to your account.
        </p>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div
        className={cn(
          "flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-6 text-center shadow-sm",
          className,
        )}
      >
        <AlertCircle className="h-8 w-8 text-destructive" aria-hidden />
        <p className="font-medium text-foreground">
          Couldn’t load transaction analytics
        </p>
        <p className="max-w-md text-sm text-muted-foreground">
          {error ?? "Something went wrong. Please try again."}
        </p>
        <Button variant="outline" size="sm" className="gap-2" onClick={handleRetry}>
          <RefreshCw className="h-4 w-4" aria-hidden />
          Retry
        </Button>
      </div>
    );
  }

  if (loading || !dashboard) {
    return <SectionSkeleton className={className} />;
  }

  const statusBreakdown = dashboard.statusBreakdown;
  const showStatusNote =
    statusBreakdown != null &&
    !hasStatusData(
      Number(statusBreakdown.paid ?? 0),
      Number(statusBreakdown.pending ?? 0),
      Number(statusBreakdown.failed ?? 0),
    );

  return (
    <div className={cn("space-y-6", className)}>
      <TransactionTrendChart series={dashboard.trend ?? []} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopUsersChart users={dashboard.topUsers ?? []} />
        <ChargeBreakdownChart
          breakdown={dashboard.chargeAnalytics?.summary?.breakdown ?? []}
        />
      </div>
      {showStatusNote ? (
        <p className="text-sm text-muted-foreground">
          No paid/pending/failed status data yet
        </p>
      ) : null}
    </div>
  );
}

function SectionSkeleton({ className }: Readonly<{ className?: string }>) {
  return (
    <div className={cn("space-y-6", className)} aria-hidden>
      <div className="h-[300px] animate-pulse rounded-xl border border-border bg-muted/50" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-60 animate-pulse rounded-xl border border-border bg-muted/50" />
        <div className="h-60 animate-pulse rounded-xl border border-border bg-muted/50" />
      </div>
    </div>
  );
}

export default TransactionAnalyticsDashboard;
