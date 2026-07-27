"use client";

import { useMemo } from "react";
import { AlertCircle, RefreshCw, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PowerAvailabilityData } from "@/types/analytics";

type StatusKey =
  | "connected"
  | "disconnected"
  | "unknown"
  | "pending_disconnect";

type StatusTone = "green" | "red" | "amber";

type StatusMeta = {
  key: StatusKey;
  label: string;
  tone: StatusTone;
};

/** Fixed priority for stable tie-breaks when choosing the dominant status. */
const STATUS_ORDER: ReadonlyArray<StatusMeta> = [
  { key: "connected", label: "Connected", tone: "green" },
  { key: "disconnected", label: "Disconnected", tone: "red" },
  { key: "unknown", label: "Unknown", tone: "amber" },
  {
    key: "pending_disconnect",
    label: "Pending disconnect",
    tone: "amber",
  },
];

function statusCount(data: PowerAvailabilityData, key: StatusKey): number {
  return Math.max(0, Number(data[key] ?? 0));
}

function computeTotal(data: PowerAvailabilityData): number {
  return STATUS_ORDER.reduce((sum, { key }) => sum + statusCount(data, key), 0);
}

function findDominant(
  data: PowerAvailabilityData,
): StatusMeta & { count: number } {
  let best = STATUS_ORDER[0];
  let bestCount = statusCount(data, best.key);
  for (let i = 1; i < STATUS_ORDER.length; i++) {
    const meta = STATUS_ORDER[i];
    const count = statusCount(data, meta.key);
    if (count > bestCount) {
      best = meta;
      bestCount = count;
    }
  }
  return { ...best, count: bestCount };
}

const TONE_STYLES: Record<
  StatusTone,
  {
    panel: string;
    badge: string;
    value: string;
    swatch: string;
  }
> = {
  green: {
    panel:
      "border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-teal-50 dark:border-emerald-500/30 dark:from-emerald-950/40 dark:to-teal-950/30",
    badge:
      "bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200",
    value: "text-emerald-900 dark:text-emerald-100",
    swatch: "bg-[#10B981]",
  },
  red: {
    panel:
      "border-red-200/80 bg-gradient-to-br from-red-50 to-rose-50 dark:border-red-500/30 dark:from-red-950/40 dark:to-rose-950/30",
    badge: "bg-red-500/15 text-red-800 dark:bg-red-500/20 dark:text-red-200",
    value: "text-red-900 dark:text-red-100",
    swatch: "bg-[#EF4444]",
  },
  amber: {
    panel:
      "border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50 dark:border-amber-500/30 dark:from-amber-950/40 dark:to-orange-950/30",
    badge:
      "bg-amber-500/15 text-amber-900 dark:bg-amber-500/20 dark:text-amber-100",
    value: "text-amber-950 dark:text-amber-100",
    swatch: "bg-[#F59E0B]",
  },
};

type PowerAvailabilityCardProps = Readonly<{
  data: PowerAvailabilityData | null;
  loading?: boolean;
  error?: string | null;
  onRetry: () => void;
  className?: string;
}>;

export function PowerAvailabilityCard({
  data,
  loading = false,
  error = null,
  onRetry,
  className,
}: PowerAvailabilityCardProps) {
  const total = data ? computeTotal(data) : 0;
  const dominant = useMemo(
    () => (data ? findDominant(data) : null),
    [data],
  );

  const showError = Boolean(error) && !data && !loading;
  const showEmpty = !loading && !error && total === 0;

  return (
    <Card
      className={cn(
        "mt-0 gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-sm",
        className,
      )}
    >
      <div className="px-5 pt-5 sm:px-6 sm:pt-6">
        <h2 className="font-heading text-lg font-bold tracking-tight text-foreground sm:text-xl">
          Power availability
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {loading && !data
            ? "Loading…"
            : `${total.toLocaleString()} meter${total === 1 ? "" : "s"} by relay supply state`}
        </p>
      </div>

      <div className="space-y-3 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
        <CardBody
          showError={showError}
          showEmpty={showEmpty}
          loading={loading}
          hasData={Boolean(data)}
          data={data}
          total={total}
          dominant={dominant}
          error={error}
          onRetry={onRetry}
        />
        {data?.note && !showError ? (
          <p className="text-xs text-muted-foreground">{data.note}</p>
        ) : null}
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
  total,
  dominant,
  error,
  onRetry,
}: Readonly<{
  showError: boolean;
  showEmpty: boolean;
  loading: boolean;
  hasData: boolean;
  data: PowerAvailabilityData | null;
  total: number;
  dominant: (StatusMeta & { count: number }) | null;
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
  if (!data || !dominant) {
    return <EmptyState />;
  }

  const tone = TONE_STYLES[dominant.tone];
  const pct = total > 0 ? Math.round((dominant.count / total) * 100) : 0;
  const supporting = STATUS_ORDER.filter((s) => s.key !== dominant.key);

  return (
    <div className={cn("space-y-4", loading && "opacity-60")}>
      <div className={cn("rounded-2xl border px-4 py-4 shadow-sm", tone.panel)}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-sm font-medium text-muted-foreground">
            Mostly {dominant.label.toLowerCase()}
          </p>
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums",
              tone.badge,
            )}
          >
            {pct}%
          </span>
        </div>
        <p
          className={cn(
            "mt-2 font-heading text-3xl font-bold tabular-nums tracking-tight sm:text-4xl",
            tone.value,
          )}
        >
          {dominant.count.toLocaleString()}
          <span className="ml-1.5 text-lg font-semibold text-muted-foreground sm:text-xl">
            / {total.toLocaleString()}
          </span>
        </p>
        <p className="mt-1 text-xs font-medium text-muted-foreground">
          {dominant.label}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {supporting.map((meta) => {
          const count = statusCount(data, meta.key);
          const tileTone = TONE_STYLES[meta.tone];
          return (
            <div
              key={meta.key}
              className="rounded-xl border border-border bg-muted/20 px-3 py-2.5"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    tileTone.swatch,
                  )}
                  aria-hidden
                />
                <p className="truncate text-xs text-muted-foreground">
                  {meta.label}
                </p>
              </div>
              <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                {count.toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-[220px] flex-col items-center justify-center gap-2 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-muted">
        <Zap className="h-5 w-5 text-muted-foreground" aria-hidden />
      </div>
      <p className="text-sm font-medium text-foreground">
        No power availability data
      </p>
      <p className="text-xs text-muted-foreground">
        Relay supply status will appear when meters are assigned.
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
        Couldn’t load power availability
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
      <div className="h-28 animate-pulse rounded-2xl bg-amber-200/40 dark:bg-amber-500/15" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={`sk-power-${i}`}
            className="h-16 animate-pulse rounded-xl bg-muted/70"
          />
        ))}
      </div>
    </div>
  );
}

export default PowerAvailabilityCard;
