"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isPending } from "@/lib/async-status";
import { EMPTY_TRANSACTION_SUMMARY } from "@/lib/transaction-summary-chart";
import { getEstateAdminTransactionSummary } from "@/redux/slice/estate-admin/transaction-summary/estate-admin-transaction-summary";
import {
  selectTransactionSummaryData,
  selectTransactionSummaryError,
  selectTransactionSummaryStatus,
} from "@/redux/slice/estate-admin/transaction-summary/estate-admin-transaction-summary-slice";
import type { AppDispatch } from "@/redux/store";
import { TransactionStatCards } from "@/components/analytics/TransactionStatCards";
import { DebitsCreditsBar } from "@/components/analytics/DebitsCreditsBar";
import { TransactionCountDonut } from "@/components/analytics/TransactionCountDonut";

type TransactionSummarySectionProps = Readonly<{
  estateId: string | null;
  className?: string;
}>;

export function TransactionSummarySection({
  estateId,
  className,
}: TransactionSummarySectionProps) {
  const dispatch = useDispatch<AppDispatch>();
  const summary = useSelector(selectTransactionSummaryData);
  const status = useSelector(selectTransactionSummaryStatus);
  const error = useSelector(selectTransactionSummaryError);
  const loading = Boolean(estateId) && isPending(status);

  useEffect(() => {
    if (!estateId) return;
    void dispatch(getEstateAdminTransactionSummary({ estateId }));
  }, [dispatch, estateId]);

  const handleRetry = () => {
    if (!estateId) return;
    void dispatch(getEstateAdminTransactionSummary({ estateId }));
  };

  if (!estateId) {
    return (
      <EmptyEstateState className={className} />
    );
  }

  if (error && !loading) {
    return (
      <ErrorState message={error} onRetry={handleRetry} className={className} />
    );
  }

  if (loading) {
    return <SectionSkeleton className={className} />;
  }

  const data = summary ?? EMPTY_TRANSACTION_SUMMARY;

  return (
    <div className={cn("space-y-6", className)}>
      <TransactionStatCards data={data} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DebitsCreditsBar data={data} />
        <TransactionCountDonut data={data} />
      </div>
    </div>
  );
}

function SectionSkeleton({ className }: Readonly<{ className?: string }>) {
  return (
    <div className={cn("space-y-6", className)} aria-hidden>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={`tx-stat-sk-${i}`}
            className="min-h-[140px] animate-pulse rounded-xl border border-border bg-muted/50 p-4 sm:p-5 md:p-6"
          >
            <div className="h-10 w-10 rounded-full bg-muted" />
            <div className="mt-4 h-4 w-24 rounded bg-muted" />
            <div className="mt-2 h-8 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-60 animate-pulse rounded-xl border border-border bg-muted/50" />
        <div className="h-60 animate-pulse rounded-xl border border-border bg-muted/50" />
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
  className,
}: Readonly<{
  message: string | null;
  onRetry: () => void;
  className?: string;
}>) {
  return (
    <div
      className={cn(
        "flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-6 text-center shadow-sm",
        className,
      )}
    >
      <AlertCircle className="h-8 w-8 text-destructive" aria-hidden />
      <p className="font-medium text-foreground">
        Couldn’t load transaction summary
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

function EmptyEstateState({ className }: Readonly<{ className?: string }>) {
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

export default TransactionSummarySection;
