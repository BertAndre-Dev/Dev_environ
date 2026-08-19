"use client";

import { AlertCircle, Gauge, Hash, RefreshCw, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatPeriodRange } from "@/lib/analytics/formatPeriodRange";
import type { VendingFrequencyData } from "@/types/analytics";

type VendingFrequencyCardProps = Readonly<{
  data: VendingFrequencyData | null;
  loading?: boolean;
  error?: string | null;
  onRetry: () => void;
  className?: string;
}>;

export function VendingFrequencyCard({
  data,
  loading = false,
  error = null,
  onRetry,
  className,
}: VendingFrequencyCardProps) {
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
            Vending frequency
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading && !data ? "Loading…" : "Commercial meter vending activity"}
          </p>
        </div>
        {periodLabel ? (
          <p className="shrink-0 text-sm font-medium text-muted-foreground">
            {periodLabel}
          </p>
        ) : null}
      </div>

      <div className="px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
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
  data: VendingFrequencyData | null;
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

  const stats = [
    {
      label: "Total vends",
      value: data.totalVends.toLocaleString(),
      icon: Hash,
      tone: "violet" as const,
    },
    {
      label: "Unique meters",
      value: data.uniqueMeters.toLocaleString(),
      icon: Gauge,
      tone: "teal" as const,
    },
    {
      label: "Vends per day",
      value: data.vendsPerDay.toFixed(1),
      icon: Zap,
      tone: "amber" as const,
    },
    {
      label: "Vends per meter",
      value: data.vendsPerMeter.toFixed(1),
      icon: Gauge,
      tone: "orange" as const,
    },
  ];

  return (
    <div
      className={cn(
        "grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3",
        loading && "opacity-60",
      )}
    >
      {stats.map((stat) => (
        <MetricTile
          key={stat.label}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          tone={stat.tone}
        />
      ))}
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
  tone: "violet" | "teal" | "amber" | "orange";
}>) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3.5 py-3 shadow-sm",
        tone === "violet" &&
          "border-violet-200/70 bg-gradient-to-br from-white to-violet-50 dark:border-violet-500/25 dark:from-violet-950/50 dark:to-violet-900/20",
        tone === "teal" &&
          "border-teal-200/70 bg-gradient-to-br from-white to-teal-50 dark:border-teal-500/25 dark:from-teal-950/50 dark:to-teal-900/20",
        tone === "amber" &&
          "border-amber-200/70 bg-gradient-to-br from-white to-amber-50 dark:border-amber-500/25 dark:from-amber-950/50 dark:to-amber-900/20",
        tone === "orange" &&
          "border-orange-200/70 bg-gradient-to-br from-white to-orange-50 dark:border-orange-500/25 dark:from-orange-950/50 dark:to-orange-900/20",
      )}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "grid size-7 place-items-center rounded-lg",
            tone === "violet" &&
              "bg-violet-500/15 text-violet-700 dark:text-violet-300",
            tone === "teal" &&
              "bg-teal-500/15 text-teal-700 dark:text-teal-300",
            tone === "amber" &&
              "bg-amber-500/15 text-amber-700 dark:text-amber-300",
            tone === "orange" &&
              "bg-orange-500/15 text-orange-700 dark:text-orange-300",
          )}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
      <p className="mt-2 font-heading text-2xl font-bold tabular-nums tracking-tight text-foreground">
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
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" aria-hidden />
      <p className="font-medium text-foreground">
        Couldn&apos;t load vending frequency
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
    <div
      className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3"
      aria-hidden
    >
      {[0, 1, 2, 3].map((i) => (
        <div
          key={`sk-vf-${i}`}
          className="h-24 animate-pulse rounded-xl bg-muted/70"
        />
      ))}
    </div>
  );
}

export default VendingFrequencyCard;
