"use client";

import { AlertCircle, Gauge, RefreshCw, Sparkles, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CustomerActivationsData } from "@/types/analytics";

const RESIDENTS_COLOR = "#14B8A6";
const METERS_COLOR = "#F59E0B";

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

type CustomerActivationsCardProps = Readonly<{
  data: CustomerActivationsData | null;
  loading?: boolean;
  error?: string | null;
  onRetry: () => void;
  className?: string;
}>;

export function CustomerActivationsCard({
  data,
  loading = false,
  error = null,
  onRetry,
  className,
}: CustomerActivationsCardProps) {
  const total = Number(data?.totalActivations ?? 0);
  const showError = Boolean(error) && !data && !loading;
  const showEmpty = !loading && !error && Boolean(data) && total === 0;

  const periodLabel =
    data?.period?.startDate && data?.period?.endDate
      ? formatPeriodRange(data.period.startDate, data.period.endDate)
      : null;

  let subtitle = "New residents and newly assigned meters";
  if (loading && !data) {
    subtitle = "Loading…";
  } else if (periodLabel) {
    subtitle = periodLabel;
  }

  return (
    <Card
      className={cn(
        "mt-0 gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-sm",
        className,
      )}
    >
      <div className="px-5 pt-5 sm:px-6 sm:pt-6">
        <h2 className="font-heading text-lg font-bold tracking-tight text-foreground sm:text-xl">
          New activations
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="space-y-3 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
        <CardBody
          showError={showError}
          showEmpty={showEmpty}
          loading={loading}
          hasData={Boolean(data)}
          data={data}
          error={error}
          onRetry={onRetry}
        />
      </div>
    </Card>
  );
}

function CardBody({
  showError,
  showEmpty,
  loading,
  hasData,
  data,
  error,
  onRetry,
}: Readonly<{
  showError: boolean;
  showEmpty: boolean;
  loading: boolean;
  hasData: boolean;
  data: CustomerActivationsData | null;
  error: string | null;
  onRetry: () => void;
}>) {
  if (showError) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }
  if (showEmpty) {
    return <EmptyState />;
  }
  if (loading && !hasData) {
    return <CardSkeleton />;
  }
  if (!data) {
    return <EmptyState />;
  }

  const totalActivations = Number(data.totalActivations ?? 0);
  const newResidents = Number(data.newResidents ?? 0);
  const newlyAssignedMeters = Number(data.newlyAssignedMeters ?? 0);

  // Percentages against API totalActivations only — never recompute total client-side.
  const residentsPct =
    totalActivations > 0 ? (newResidents / totalActivations) * 100 : 0;
  const metersPct =
    totalActivations > 0 ? (newlyAssignedMeters / totalActivations) * 100 : 0;

  return (
    <div className={cn("space-y-4", loading && "opacity-60")}>
      <div className="rounded-2xl border border-violet-200/70 bg-gradient-to-br from-white to-violet-50 px-4 py-4 shadow-sm dark:border-violet-500/25 dark:from-violet-950/50 dark:to-violet-900/20">
        <p className="text-sm font-medium text-violet-700/80 dark:text-violet-300">
          Total activations
        </p>
        <p className="mt-1 bg-gradient-to-r from-violet-700 via-fuchsia-600 to-orange-500 bg-clip-text font-heading text-3xl font-bold tabular-nums tracking-tight text-transparent sm:text-4xl">
          {totalActivations.toLocaleString()}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SupportTile
          label="New residents"
          value={newResidents}
          icon={Users}
          tone="teal"
        />
        <SupportTile
          label="Newly assigned meters"
          value={newlyAssignedMeters}
          icon={Gauge}
          tone="amber"
        />
      </div>

      {totalActivations > 0 ? (
        <div className="space-y-2">
          <div
            className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label={`Activations split: ${residentsPct.toFixed(1)}% new residents, ${metersPct.toFixed(1)}% newly assigned meters`}
          >
            <div
              className="h-full transition-[width]"
              style={{
                width: `${residentsPct}%`,
                backgroundColor: RESIDENTS_COLOR,
              }}
            />
            <div
              className="h-full transition-[width]"
              style={{
                width: `${metersPct}%`,
                backgroundColor: METERS_COLOR,
              }}
            />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <LegendItem
              color={RESIDENTS_COLOR}
              label="New residents"
              percent={residentsPct}
            />
            <LegendItem
              color={METERS_COLOR}
              label="Newly assigned meters"
              percent={metersPct}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SupportTile({
  label,
  value,
  icon: Icon,
  tone,
}: Readonly<{
  label: string;
  value: number;
  icon: typeof Users;
  tone: "teal" | "amber";
}>) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3.5 shadow-sm",
        tone === "teal" &&
          "border-teal-200/70 bg-gradient-to-br from-white to-teal-50 dark:border-teal-500/25 dark:from-teal-950/50 dark:to-teal-900/20",
        tone === "amber" &&
          "border-amber-200/70 bg-gradient-to-br from-white to-amber-50 dark:border-amber-500/25 dark:from-amber-950/50 dark:to-amber-900/20",
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-xl",
            tone === "teal" &&
              "bg-teal-500/15 text-teal-700 dark:text-teal-300",
            tone === "amber" &&
              "bg-amber-500/15 text-amber-700 dark:text-amber-300",
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <p
          className={cn(
            "text-sm font-medium",
            tone === "teal" && "text-teal-700/80 dark:text-teal-300",
            tone === "amber" && "text-amber-700/80 dark:text-amber-300",
          )}
        >
          {label}
        </p>
      </div>
      <p
        className={cn(
          "mt-2 font-heading text-2xl font-bold tabular-nums tracking-tight sm:text-3xl",
          tone === "teal" && "text-teal-900 dark:text-teal-100",
          tone === "amber" && "text-amber-900 dark:text-amber-100",
        )}
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function LegendItem({
  color,
  label,
  percent,
}: Readonly<{ color: string; label: string; percent: number }>) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span>
        {label} · {percent.toFixed(1)}%
      </span>
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex h-[220px] flex-col items-center justify-center gap-2 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-muted">
        <Sparkles className="h-5 w-5 text-muted-foreground" aria-hidden />
      </div>
      <p className="text-sm font-medium text-foreground">No activations yet</p>
      <p className="text-xs text-muted-foreground">
        New residents and assigned meters will appear for this period.
      </p>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: Readonly<{ message: string | null; onRetry: () => void }>) {
  return (
    <div className="flex h-[220px] flex-col items-center justify-center gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" aria-hidden />
      <p className="font-medium text-foreground">
        Couldn’t load new activations
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

function CardSkeleton({ className }: Readonly<{ className?: string }>) {
  return (
    <div className={cn("space-y-4", className)} aria-hidden>
      <div className="h-24 animate-pulse rounded-2xl bg-violet-200/40 dark:bg-violet-500/15" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="h-20 animate-pulse rounded-2xl bg-teal-200/40 dark:bg-teal-500/15" />
        <div className="h-20 animate-pulse rounded-2xl bg-amber-200/40 dark:bg-amber-500/15" />
      </div>
      <div className="h-2.5 animate-pulse rounded-full bg-muted/70" />
    </div>
  );
}

export default CustomerActivationsCard;
