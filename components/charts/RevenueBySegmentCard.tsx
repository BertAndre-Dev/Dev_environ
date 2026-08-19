"use client";

import { AlertCircle, RefreshCw, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DonutBreakdown } from "@/components/analytics/DonutBreakdown";
import { formatPeriodRange } from "@/lib/analytics/formatPeriodRange";
import { formatTransactionAmount } from "@/lib/transaction-summary-chart";
import type { RevenueBySegmentData } from "@/types/analytics";

const BILL_COLOR = "#0150AC";
const VENDING_COLOR = "#7C3AED";
const TENANT_COLOR = "#14B8A6";
const OWNER_COLOR = "#F59E0B";

type RevenueBySegmentCardProps = Readonly<{
  data: RevenueBySegmentData | null;
  loading?: boolean;
  error?: string | null;
  onRetry: () => void;
  className?: string;
}>;

export function RevenueBySegmentCard({
  data,
  loading = false,
  error = null,
  onRetry,
  className,
}: RevenueBySegmentCardProps) {
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
            Revenue by segment
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading && !data ? "Loading…" : "Revenue type and customer headcount"}
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
  data: RevenueBySegmentData | null;
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
  const tenantCount = Number(data.bySegment.tenants.customerCount ?? 0);
  const ownerCount = Number(data.bySegment.owners.customerCount ?? 0);
  const totalCustomers = tenantCount + ownerCount;

  const revenueChartData = [
    { name: "Bills", value: billRevenue, fill: BILL_COLOR },
    { name: "Vending", value: vendingRevenue, fill: VENDING_COLOR },
  ];

  const segmentChartData = [
    { name: "Tenants", value: tenantCount, fill: TENANT_COLOR },
    { name: "Owners", value: ownerCount, fill: OWNER_COLOR },
  ];

  return (
    <div className={cn("space-y-4", loading && "opacity-60")}>
      <div className="rounded-xl border border-violet-200/70 bg-gradient-to-br from-white to-violet-50 px-4 py-3.5 shadow-sm dark:border-violet-500/25 dark:from-violet-950/50 dark:to-violet-900/20">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-violet-500/15 text-violet-700 dark:text-violet-300">
            <Wallet className="h-4 w-4" aria-hidden />
          </span>
          <p className="text-sm font-medium text-violet-700/80 dark:text-violet-300">
            Total revenue
          </p>
        </div>
        <p className="mt-2 font-heading text-3xl font-bold tabular-nums tracking-tight text-foreground sm:text-4xl">
          {formatTransactionAmount(totalRevenue)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <DonutBreakdown
          title="Revenue by type"
          slices={revenueChartData}
          centerLabel={formatTransactionAmount(totalRevenue)}
          centerSubLabel="Total revenue"
          formatValue={formatTransactionAmount}
          emptyMessage="No revenue this period"
          emptyDescription="Bill and vending revenue will appear here."
          chartHeight={300}
        />
        <DonutBreakdown
          title="Customers by segment"
          slices={segmentChartData}
          centerLabel={totalCustomers.toLocaleString()}
          centerSubLabel="Total customers"
          emptyMessage="No customers this period"
          emptyDescription="Tenant and owner counts will appear here."
          chartHeight={300}
        />
      </div>
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
        Couldn&apos;t load revenue by segment
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
      <div className="h-24 animate-pulse rounded-xl bg-violet-200/40 dark:bg-violet-500/15" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-xl bg-muted/70" />
        <div className="h-72 animate-pulse rounded-xl bg-muted/70" />
      </div>
    </div>
  );
}

export default RevenueBySegmentCard;
