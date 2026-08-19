"use client";

import { AlertCircle, AlertTriangle, RefreshCw, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DonutBreakdown } from "@/components/analytics/DonutBreakdown";
import { formatPeriodRange } from "@/lib/analytics/formatPeriodRange";
import { formatTransactionAmount } from "@/lib/transaction-summary-chart";
import type { RevenueSummaryData } from "@/types/analytics";

const BILL_COLOR = "#0150AC";
const VENDING_COLOR = "#7C3AED";
const UNRECONCILED_COLOR = "#94A3B8";

type RevenueSummaryCardProps = Readonly<{
  data: RevenueSummaryData | null;
  loading?: boolean;
  error?: string | null;
  onRetry: () => void;
  className?: string;
}>;

export function RevenueSummaryCard({
  data,
  loading = false,
  error = null,
  onRetry,
  className,
}: RevenueSummaryCardProps) {
  const showError = Boolean(error) && !data && !loading;
  const periodLabel =
    data?.period?.startDate && data?.period?.endDate
      ? formatPeriodRange(data.period.startDate, data.period.endDate)
      : null;

  return (
    <Card
      className={cn(
        "mt-0 gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-sm",
        className,
      )}
    >
      <div className="flex flex-col gap-2 px-5 pt-5 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:pt-6">
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-bold tracking-tight text-foreground sm:text-xl">
            Revenue summary
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading && !data ? "Loading…" : "Finance revenue breakdown"}
          </p>
        </div>
        {periodLabel ? (
          <p className="shrink-0 text-sm font-medium text-muted-foreground">
            {periodLabel}
          </p>
        ) : null}
      </div>

      <div className="space-y-4 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
        <CardBody
          data={data}
          loading={loading}
          showError={showError}
          error={error}
          onRetry={onRetry}
        />
      </div>
    </Card>
  );
}

function CardBody({
  data,
  loading,
  showError,
  error,
  onRetry,
}: Readonly<{
  data: RevenueSummaryData | null;
  loading: boolean;
  showError: boolean;
  error: string | null;
  onRetry: () => void;
}>) {
  if (showError) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }
  if (loading && !data) {
    return <CardSkeleton />;
  }
  if (!data) {
    return <CardSkeleton />;
  }

  const totalRevenue = Number(data.totalRevenue ?? 0);
  const billRevenue = Number(data.billRevenue ?? 0);
  const vendingRevenue = Number(data.vendingRevenue ?? 0);
  const manualEntries = Number(data.manualRevenueEntries ?? 0);

  const showEmpty = totalRevenue === 0;

  // Known reconciliation issue — billRevenue + vendingRevenue may not equal totalRevenue; pending backend confirmation.
  const rawGap = totalRevenue - billRevenue - vendingRevenue;
  const gap = Math.max(0, rawGap);
  // const hasMismatch = rawGap !== 0;

  const chartSlices = [
    { name: "Bills", value: billRevenue, fill: BILL_COLOR },
    { name: "Vending", value: vendingRevenue, fill: VENDING_COLOR },
    ...(gap > 0
      ? [{ name: "Unreconciled", value: gap, fill: UNRECONCILED_COLOR }]
      : []),
  ];

  if (showEmpty) {
    return (
      <div className="flex h-[280px] flex-col items-center justify-center gap-2 text-center">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-muted">
          <Wallet className="h-5 w-5 text-muted-foreground" aria-hidden />
        </div>
        <p className="text-sm font-medium text-foreground">No revenue this period</p>
        <p className="text-xs text-muted-foreground">
          Revenue breakdown will appear when transactions are recorded.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", loading && "opacity-60")}>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
        <StatTile
          label="Total revenue"
          value={formatTransactionAmount(totalRevenue)}
        />
        <StatTile
          label="Bill revenue"
          value={formatTransactionAmount(billRevenue)}
        />
        <StatTile
          label="Vending revenue"
          value={formatTransactionAmount(vendingRevenue)}
        />
        <StatTile
          label="Manual entries"
          value={manualEntries.toLocaleString()}
        />
      </div>

      <DonutBreakdown
        title="Revenue breakdown"
        slices={chartSlices}
        centerLabel={formatTransactionAmount(totalRevenue)}
        centerSubLabel="Total revenue"
        formatValue={formatTransactionAmount}
        chartHeight={300}
      />

      {/* {hasMismatch ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3.5 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
            aria-hidden
          />
          <p className="text-sm text-amber-900 dark:text-amber-100">
            Bills and vending sum to{" "}
            {formatTransactionAmount(billRevenue + vendingRevenue)}, but total
            revenue is {formatTransactionAmount(totalRevenue)} — a mismatch of{" "}
            {formatTransactionAmount(Math.abs(rawGap))}. Confirm with the API
            team whether manual entries or another source explains the gap.
          </p>
        </div>
      ) : null} */}
    </div>
  );
}

function StatTile({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 px-3.5 py-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1.5 font-heading text-xl font-bold tabular-nums tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: Readonly<{ message: string | null; onRetry: () => void }>) {
  return (
    <div className="flex h-[280px] flex-col items-center justify-center gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" aria-hidden />
      <p className="font-medium text-foreground">
        Couldn&apos;t load revenue summary
      </p>
      <p className="max-w-md text-sm text-muted-foreground">
        {message ?? "Something went wrong. Please try again."}
      </p>
      <Button variant="outline" size="sm" className="gap-2" onClick={onRetry}>
        <RefreshCw className="h-4 w-4" aria-hidden />
        Retry
      </Button>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={`sk-rs-${i}`}
            className="h-20 animate-pulse rounded-xl bg-muted/70"
          />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-xl bg-muted/70" />
    </div>
  );
}

export default RevenueSummaryCard;
