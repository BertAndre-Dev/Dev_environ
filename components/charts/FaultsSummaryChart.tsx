"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertCircle, BarChart3, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  toFaultCategoryRows,
  type FaultCategoryRow,
} from "@/lib/analytics/toFaultCategoryRows";
import type { FaultsSummaryData } from "@/types/analytics";

const ROW_HEIGHT = 40;
const CHART_PADDING = 48;
const Y_AXIS_WIDTH = 160;

const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  resolved: "#10B981",
  closed: "#10B981",
  completed: "#10B981",
  "in-progress": "#3B82F6",
  in_progress: "#3B82F6",
  "in progress": "#3B82F6",
  open: "#3B82F6",
};

const FALLBACK_STATUS_COLOR = "#94A3B8";

function statusColor(status: string): string {
  const key = status.trim().toLowerCase();
  return STATUS_COLORS[key] ?? FALLBACK_STATUS_COLOR;
}

function formatStatusLabel(status: string): string {
  const raw = status.trim();
  if (!raw) return "Unknown";
  return raw
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
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

type TooltipProps = Readonly<{
  active?: boolean;
  payload?: ReadonlyArray<{
    name?: string;
    value?: number;
    payload?: FaultCategoryRow;
  }>;
}>;

function ChartTooltip({
  active,
  payload,
  statuses,
}: TooltipProps & { statuses: string[] }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  const hovered = payload.find(
    (entry) => typeof entry.value === "number" && entry.value > 0,
  );

  return (
    <div className="min-w-[180px] rounded-xl border border-border/80 bg-white px-3.5 py-3 text-sm shadow-lg dark:bg-card">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {row.category}
      </p>
      <div className="mt-2 space-y-1.5">
        {statuses.map((status) => {
          const count = Number(row[status] ?? 0);
          if (count <= 0) return null;
          const isHovered = hovered?.name === status;
          return (
            <div
              key={status}
              className={cn(
                "flex items-center justify-between gap-6",
                isHovered && "font-semibold",
              )}
            >
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: statusColor(status) }}
                  aria-hidden
                />
                {formatStatusLabel(status)}
              </span>
              <span className="tabular-nums text-foreground">
                {count.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type FaultsSummaryChartProps = Readonly<{
  data: FaultsSummaryData | null;
  loading?: boolean;
  error?: string | null;
  onRetry: () => void;
  className?: string;
}>;

export function FaultsSummaryChart({
  data,
  loading = false,
  error = null,
  onRetry,
  className,
}: FaultsSummaryChartProps) {
  const { statuses, rows } = useMemo(
    () => toFaultCategoryRows(data?.breakdown ?? []),
    [data?.breakdown],
  );

  const chartHeight = Math.max(220, rows.length * ROW_HEIGHT + CHART_PADDING);
  const totalComplaints = data?.totalComplaints ?? 0;
  const showError = Boolean(error) && !data && !loading;
  const showEmpty =
    !loading && !error && (totalComplaints === 0 || rows.length === 0);
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
      <div className="flex flex-col gap-3 px-5 pt-5 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:pt-6">
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-bold tracking-tight text-foreground sm:text-xl">
            Faults & exceptions
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading && !data
              ? "Loading…"
              : `${totalComplaints.toLocaleString()} complaint${totalComplaints === 1 ? "" : "s"}`}
            {periodLabel ? ` · ${periodLabel}` : null}
          </p>
        </div>
        {statuses.length > 0 && !showEmpty && !showError ? (
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {statuses.map((status) => (
              <span
                key={status}
                className="inline-flex items-center gap-1.5"
              >
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: statusColor(status) }}
                  aria-hidden
                />
                {formatStatusLabel(status)}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-3 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
        <ChartBody
          showError={showError}
          showEmpty={showEmpty}
          loading={loading}
          hasData={Boolean(data)}
          rows={rows}
          statuses={statuses}
          error={error}
          onRetry={onRetry}
          chartHeight={chartHeight}
        />
        {data?.note && !showError ? (
          <p className="text-xs text-muted-foreground">{data.note}</p>
        ) : null}
      </div>
    </Card>
  );
}

function ChartBody({
  showError,
  showEmpty,
  loading,
  hasData,
  rows,
  statuses,
  error,
  onRetry,
  chartHeight,
}: Readonly<{
  showError: boolean;
  showEmpty: boolean;
  loading: boolean;
  hasData: boolean;
  rows: FaultCategoryRow[];
  statuses: string[];
  error: string | null;
  onRetry: () => void;
  chartHeight: number;
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

  return (
    <div
      className={cn("relative w-full", loading && "opacity-60")}
      style={{ height: chartHeight }}
    >
      {loading ? (
        <ChartSkeleton className="absolute inset-0 z-10 bg-card/50" />
      ) : null}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 4, bottom: 8 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            className="stroke-border/60"
          />
          <XAxis
            type="number"
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          />
          <YAxis
            type="category"
            dataKey="category"
            width={Y_AXIS_WIDTH}
            reversed
            tickLine={false}
            axisLine={false}
            interval={0}
            tick={{ fontSize: 12, fill: "var(--foreground)" }}
          />
          <Tooltip
            cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
            content={<ChartTooltip statuses={statuses} />}
          />
          {statuses.map((status, index) => (
            <Bar
              key={status}
              dataKey={status}
              name={status}
              stackId="faults"
              fill={statusColor(status)}
              radius={
                index === statuses.length - 1 ? [0, 6, 6, 0] : [0, 0, 0, 0]
              }
              barSize={18}
              isAnimationActive={!loading}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-[280px] flex-col items-center justify-center gap-2 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-muted">
        <BarChart3 className="h-5 w-5 text-muted-foreground" aria-hidden />
      </div>
      <p className="text-sm font-medium text-foreground">
        No faults in this period
      </p>
      <p className="text-xs text-muted-foreground">
        Complaint categories will appear when residents report issues.
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
        Couldn’t load faults summary
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
        "flex h-[280px] w-full flex-col justify-center gap-3 px-2 py-6",
        className,
      )}
      aria-hidden
    >
      {[88, 64, 50, 36].map((w, i) => (
        <div key={`sk-fault-${w}-${i}`} className="flex items-center gap-3">
          <div className="h-3 w-28 shrink-0 animate-pulse rounded bg-muted" />
          <div
            className="flex h-5 overflow-hidden rounded-r-lg"
            style={{ width: `${w}%` }}
          >
            <div className="h-full w-2/3 animate-pulse bg-amber-200/60 dark:bg-amber-500/20" />
            <div className="h-full w-1/3 animate-pulse bg-emerald-200/60 dark:bg-emerald-500/20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default FaultsSummaryChart;
