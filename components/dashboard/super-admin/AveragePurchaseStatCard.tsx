"use client";

import {
  AlertCircle,
  Hash,
  RefreshCw,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AveragePurchaseValueData } from "@/types/analytics";

function formatNaira(value: number): string {
  return `₦${Number(value ?? 0).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`;
}

function formatPeriodRange(startDate: string, endDate: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  };
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "—";
  }
  return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
}

type AveragePurchaseStatCardProps = Readonly<{
  data: AveragePurchaseValueData | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}>;

export function AveragePurchaseStatCard({
  data,
  loading = false,
  error = null,
  onRetry,
  className,
}: AveragePurchaseStatCardProps) {
  const showError = Boolean(error) && !data && !loading;

  return (
    <Card
      className={cn(
        "mt-0 gap-0 overflow-hidden rounded-2xl border border-violet-200/80 bg-card p-0 shadow-sm dark:border-violet-500/30",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-violet-200/70 px-5 py-4 dark:border-violet-500/25 sm:px-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0150AC]">
            Commercial
          </p>
          <h2 className="mt-1 font-heading text-lg font-bold tracking-tight text-foreground">
            Average purchase value
          </h2>
        </div>
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-500/15 text-violet-600 dark:text-violet-400">
          <ShoppingBag className="h-5 w-5" aria-hidden />
        </div>
      </div>

      <div className="bg-gradient-to-b from-violet-50/80 to-card px-5 py-5 dark:from-violet-950/40 dark:to-card sm:px-6">
        <AveragePurchaseBody
          data={data}
          loading={loading}
          error={error}
          showError={showError}
          onRetry={onRetry}
        />
      </div>
    </Card>
  );
}

function AveragePurchaseBody({
  data,
  loading,
  error,
  showError,
  onRetry,
}: Readonly<{
  data: AveragePurchaseValueData | null;
  loading: boolean;
  error: string | null;
  showError: boolean;
  onRetry?: () => void;
}>) {
  if (showError) {
    return (
      <div className="flex flex-col items-start gap-3">
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          <span>{error ?? "Failed to load."}</span>
        </div>
        {onRetry ? (
          <Button variant="outline" size="sm" className="gap-2" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" aria-hidden />
            Retry
          </Button>
        ) : null}
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="space-y-4" aria-hidden>
        <div className="h-9 w-40 animate-pulse rounded-md bg-violet-200/60 dark:bg-violet-500/20" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-16 animate-pulse rounded-xl bg-teal-200/50 dark:bg-teal-500/15" />
          <div className="h-16 animate-pulse rounded-xl bg-amber-200/50 dark:bg-amber-500/15" />
        </div>
        <div className="h-3 w-48 animate-pulse rounded bg-fuchsia-200/50 dark:bg-fuchsia-500/15" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">No purchase data yet.</p>;
  }

  return (
    <div className={cn("space-y-4", loading && "opacity-60")}>
      <div className="rounded-2xl border border-violet-200/70 bg-gradient-to-br from-white to-violet-50 px-4 py-3.5 shadow-sm dark:border-violet-500/25 dark:from-violet-950/50 dark:to-violet-900/20">
        <p className="text-sm font-medium text-violet-700/80 dark:text-violet-300">
          Avg per vend
        </p>
        <p className="mt-1 bg-gradient-to-r from-violet-700 via-fuchsia-600 to-orange-500 bg-clip-text font-heading text-3xl font-bold tabular-nums tracking-tight text-transparent sm:text-4xl">
          {formatNaira(data.averagePurchaseValue)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricTile
          label="Total vends"
          value={data.totalVends.toLocaleString()}
          icon={Hash}
          tone="teal"
        />
        <MetricTile
          label="Total amount"
          value={formatNaira(data.totalAmount)}
          icon={Wallet}
          tone="amber"
        />
      </div>

      <p className="inline-flex rounded-full bg-fuchsia-100/80 px-2.5 py-1 text-xs font-medium text-fuchsia-800 dark:bg-fuchsia-500/15 dark:text-fuchsia-300">
        {formatPeriodRange(data.period.startDate, data.period.endDate)}
      </p>
    </div>
  );
}

function MetricTile({
  label,
  value,
  icon: Icon,
  tone,
}: Readonly<{
  label: string;
  value: string;
  icon: typeof Hash;
  tone: "teal" | "amber";
}>) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2.5 shadow-sm",
        tone === "teal" &&
          "border-teal-200/80 bg-gradient-to-br from-teal-50 to-emerald-50 dark:border-teal-500/30 dark:from-teal-950/40 dark:to-emerald-950/30",
        tone === "amber" &&
          "border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50 dark:border-amber-500/30 dark:from-amber-950/40 dark:to-orange-950/30",
      )}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "grid h-6 w-6 place-items-center rounded-lg",
            tone === "teal" &&
              "bg-teal-500/15 text-teal-700 dark:text-teal-300",
            tone === "amber" &&
              "bg-amber-500/15 text-amber-700 dark:text-amber-300",
          )}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        <p
          className={cn(
            "text-xs font-medium",
            tone === "teal" && "text-teal-800/70 dark:text-teal-300/80",
            tone === "amber" && "text-amber-800/70 dark:text-amber-300/80",
          )}
        >
          {label}
        </p>
      </div>
      <p
        className={cn(
          "mt-1.5 text-lg font-semibold tabular-nums",
          tone === "teal" && "text-teal-900 dark:text-teal-100",
          tone === "amber" && "text-amber-900 dark:text-amber-100",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export default AveragePurchaseStatCard;
