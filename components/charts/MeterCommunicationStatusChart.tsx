"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { AlertCircle, Radio, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MeterCommunicationStatusData } from "@/types/analytics";

type SegmentKey = "online" | "offline" | "unknownStatus";

type ChartSlice = {
  key: SegmentKey;
  name: string;
  value: number;
  fill: string;
};

const SEGMENT_CONFIG: ReadonlyArray<{
  key: SegmentKey;
  label: string;
  fill: string;
  dotClassName: string;
}> = [
  {
    key: "online",
    label: "Online",
    fill: "#10B981",
    dotClassName: "bg-[#10B981]",
  },
  {
    key: "offline",
    label: "Offline",
    fill: "#EF4444",
    dotClassName: "bg-[#EF4444]",
  },
  {
    key: "unknownStatus",
    label: "Unknown",
    fill: "#94A3B8",
    dotClassName: "bg-[#94A3B8]",
  },
];

function buildChartSlices(data: MeterCommunicationStatusData): ChartSlice[] {
  return SEGMENT_CONFIG.map(({ key, label, fill }) => ({
    key,
    name: label,
    value: Math.max(0, Number(data[key] ?? 0)),
    fill,
  })).filter((slice) => slice.value > 0);
}

function segmentSum(data: MeterCommunicationStatusData): number {
  return (
    Math.max(0, Number(data.online ?? 0)) +
    Math.max(0, Number(data.offline ?? 0)) +
    Math.max(0, Number(data.unknownStatus ?? 0))
  );
}

type TooltipProps = Readonly<{
  active?: boolean;
  payload?: ReadonlyArray<{
    name?: string;
    value?: number;
    payload?: ChartSlice;
  }>;
  segmentTotal: number;
}>;

function ChartTooltip({ active, payload, segmentTotal }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;
  const pct =
    segmentTotal > 0 ? ((item.value / segmentTotal) * 100).toFixed(1) : "0.0";

  return (
    <div className="min-w-[140px] rounded-xl border border-border/80 bg-white px-3.5 py-3 text-sm shadow-lg dark:bg-card">
      <p className="inline-flex items-center gap-2 font-medium text-foreground">
        <span
          className="size-2 rounded-full"
          style={{ backgroundColor: item.fill }}
          aria-hidden
        />
        {item.name}
      </p>
      <p className="mt-1.5 tabular-nums text-muted-foreground">
        {item.value.toLocaleString()}{" "}
        <span className="text-foreground">({pct}%)</span>
      </p>
    </div>
  );
}

type MeterCommunicationStatusChartProps = Readonly<{
  data: MeterCommunicationStatusData | null;
  loading?: boolean;
  error?: string | null;
  onRetry: () => void;
  className?: string;
}>;

export function MeterCommunicationStatusChart({
  data,
  loading = false,
  error = null,
  onRetry,
  className,
}: MeterCommunicationStatusChartProps) {
  const slices = useMemo(
    () => (data ? buildChartSlices(data) : []),
    [data],
  );
  const sum = data ? segmentSum(data) : 0;
  const totalAssigned = data?.totalAssignedMeters ?? 0;

  const showError = Boolean(error) && !data && !loading;
  const showEmpty = !loading && !error && totalAssigned === 0;

  return (
    <Card
      className={cn(
        "mt-0 gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-sm",
        className,
      )}
    >
      <div className="px-5 pt-5 sm:px-6 sm:pt-6">
        <h2 className="font-heading text-lg font-bold tracking-tight text-foreground sm:text-xl">
          Meter communication status
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {loading && !data
            ? "Loading…"
            : `${totalAssigned.toLocaleString()} assigned meter${totalAssigned === 1 ? "" : "s"}`}
        </p>
      </div>

      <div className="space-y-4 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
        <ChartBody
          showError={showError}
          showEmpty={showEmpty}
          loading={loading}
          hasData={Boolean(data)}
          data={data}
          slices={slices}
          segmentTotal={sum}
          error={error}
          onRetry={onRetry}
        />
      </div>
    </Card>
  );
}

function ChartBody({
  showError,
  showEmpty,
  loading,
  hasData,
  data,
  slices,
  segmentTotal,
  error,
  onRetry,
}: Readonly<{
  showError: boolean;
  showEmpty: boolean;
  loading: boolean;
  hasData: boolean;
  data: MeterCommunicationStatusData | null;
  slices: ChartSlice[];
  segmentTotal: number;
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
    return <ChartSkeleton />;
  }
  if (!data) {
    return <EmptyState />;
  }

  const totalAssigned = data.totalAssignedMeters ?? 0;
  const staleCount = Math.max(0, Number(data.staleLastSeenCount ?? 0));
  const thresholdHours = Number(data.staleThresholdHours ?? 0);
  const staleRatio = totalAssigned > 0 ? staleCount / totalAssigned : 0;
  const staleHigh = staleRatio > 0.5;

  return (
    <div className={cn("space-y-4", loading && "opacity-60")}>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <div className="relative h-[220px] w-full max-w-[220px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                cx="50%"
                cy="50%"
                dataKey="value"
                nameKey="name"
                innerRadius="58%"
                outerRadius="88%"
                paddingAngle={slices.length > 1 ? 3 : 0}
                stroke="#ffffff"
                strokeWidth={2}
                isAnimationActive={!loading}
              >
                {slices.map((entry) => (
                  <Cell key={entry.key} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                content={<ChartTooltip segmentTotal={segmentTotal} />}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="font-heading text-2xl font-bold tabular-nums text-foreground">
              {totalAssigned.toLocaleString()}
            </p>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              total
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-1">
          {SEGMENT_CONFIG.map(({ key, label, dotClassName }) => (
            <div
              key={key}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={cn("size-2.5 shrink-0 rounded-full", dotClassName)}
                  aria-hidden
                />
                <span className="truncate text-sm text-muted-foreground">
                  {label}
                </span>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                {Number(data[key] ?? 0).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3.5 py-3",
          staleHigh
            ? "border-amber-300/80 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-100"
            : "border-border bg-muted/30 text-muted-foreground",
        )}
      >
        <div className="min-w-0">
          <p
            className={cn(
              "text-sm font-semibold",
              staleHigh ? "text-amber-900 dark:text-amber-100" : "text-foreground",
            )}
          >
            Stale (&gt;{thresholdHours || "—"}h since last seen)
          </p>
          <p className="mt-0.5 text-xs">
            {staleHigh
              ? "High share of meters have not reported recently."
              : "Meters with last-seen older than the threshold."}
          </p>
        </div>
        <p
          className={cn(
            "shrink-0 text-sm font-bold tabular-nums",
            staleHigh
              ? "text-destructive dark:text-red-300"
              : "text-foreground",
          )}
        >
          {staleCount.toLocaleString()} / {totalAssigned.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-[280px] flex-col items-center justify-center gap-2 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-muted">
        <Radio className="h-5 w-5 text-muted-foreground" aria-hidden />
      </div>
      <p className="text-sm font-medium text-foreground">
        No assigned meters
      </p>
      <p className="text-xs text-muted-foreground">
        Communication status will appear when meters are assigned.
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
        Couldn’t load meter communication status
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

function ChartSkeleton({ className }: Readonly<{ className?: string }>) {
  return (
    <div
      className={cn(
        "flex h-[280px] w-full flex-col items-center gap-6 sm:flex-row",
        className,
      )}
      aria-hidden
    >
      <div className="relative h-[180px] w-[180px] shrink-0">
        <div className="absolute inset-0 animate-pulse rounded-full border-[18px] border-muted" />
        <div className="absolute inset-[36%] animate-pulse rounded-full bg-muted/50" />
      </div>
      <div className="flex w-full flex-1 flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div
            key={`sk-meter-leg-${i}`}
            className="h-10 animate-pulse rounded-lg bg-muted/70"
          />
        ))}
      </div>
    </div>
  );
}

export default MeterCommunicationStatusChart;
