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
import type {
  RechargeBehaviorBucket,
  RechargeBehaviorPoint,
} from "@/types/analytics";

export type { RechargeBehaviorPoint };

const BAR_COLOR = "#7C3AED";
const BAR_GRADIENT_ID = "rechargeBehaviorBarGradient";

function formatNaira(value: number): string {
  return `₦${Number(value ?? 0).toLocaleString()}`;
}

function formatNairaCompact(value: number): string {
  const n = Number(value ?? 0);
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  const fmt = (v: number) => {
    const s = v.toFixed(v >= 100 ? 0 : 1);
    return s.endsWith(".0") ? s.slice(0, -2) : s;
  };
  if (abs >= 1_000_000_000) return `₦${sign}${fmt(abs / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `₦${sign}${fmt(abs / 1_000_000)}M`;
  if (abs >= 1_000) return `₦${sign}${fmt(abs / 1_000)}K`;
  return `₦${sign}${abs.toLocaleString()}`;
}

function bucketCopy(bucket: RechargeBehaviorBucket): {
  title: string;
  pointWord: string;
  pointWordPlural: string;
} {
  if (bucket === "daily") {
    return { title: "Daily", pointWord: "hour", pointWordPlural: "hours" };
  }
  if (bucket === "weekly") {
    return { title: "Weekly", pointWord: "day", pointWordPlural: "days" };
  }
  return { title: "Monthly", pointWord: "week", pointWordPlural: "weeks" };
}

function densityForBucket(bucket: RechargeBehaviorBucket): {
  barSize: number;
  tickFontSize: number;
} {
  if (bucket === "daily") return { barSize: 10, tickFontSize: 10 };
  if (bucket === "weekly") return { barSize: 22, tickFontSize: 12 };
  return { barSize: 36, tickFontSize: 12 };
}

type TooltipProps = Readonly<{
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: RechargeBehaviorPoint }>;
  label?: string;
}>;

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  const count = Number(row.count ?? 0);

  return (
    <div className="min-w-[180px] rounded-xl border border-border/80 bg-white px-3.5 py-3 text-sm shadow-lg dark:bg-card">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 space-y-1.5">
        <div className="flex items-center justify-between gap-6">
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: BAR_COLOR }}
              aria-hidden
            />
            Amount
          </span>
          <span className="font-semibold tabular-nums text-foreground">
            {formatNaira(row.value)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">Recharges</span>
          <span className="font-semibold tabular-nums text-foreground">
            {count.toLocaleString()}{" "}
            {count === 1 ? "recharge" : "recharges"}
          </span>
        </div>
      </div>
    </div>
  );
}

type RechargeBehaviorChartProps = Readonly<{
  series: RechargeBehaviorPoint[];
  bucket: RechargeBehaviorBucket;
  loading?: boolean;
  error?: string | null;
  onBucketChange: (value: RechargeBehaviorBucket) => void;
  onRetry: () => void;
  className?: string;
}>;

export function RechargeBehaviorChart({
  series,
  bucket,
  loading = false,
  error = null,
  onBucketChange,
  onRetry,
  className,
}: RechargeBehaviorChartProps) {
  const rows = useMemo(
    () =>
      series.map((point) => ({
        ...point,
        value: Number(point.value ?? 0),
        count: Number(point.count ?? 0),
        label: String(point.label ?? point.key ?? "—"),
      })),
    [series],
  );

  const totals = useMemo(() => {
    const totalValue = rows.reduce((sum, row) => sum + row.value, 0);
    const totalCount = rows.reduce((sum, row) => sum + row.count, 0);
    return { totalValue, totalCount };
  }, [rows]);

  const copy = bucketCopy(bucket);
  const density = densityForBucket(bucket);
  const showError = Boolean(error) && rows.length === 0 && !loading;
  const showEmpty = !loading && !error && rows.length === 0;

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
            Customer recharge behavior
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {copy.title}
            {" · "}
            {loading && rows.length === 0
              ? "Loading…"
              : `${formatNairaCompact(totals.totalValue)} total · ${totals.totalCount.toLocaleString()} recharges across ${rows.length} ${rows.length === 1 ? copy.pointWord : copy.pointWordPlural}`}
          </p>
        </div>
        <SegmentedControl
          ariaLabel="Recharge bucket"
          value={bucket}
          options={[
            { value: "daily", label: "Daily" },
            { value: "weekly", label: "Weekly" },
            { value: "monthly", label: "Monthly" },
          ]}
          onChange={onBucketChange}
          disabled={loading}
        />
      </div>

      <div className="space-y-4 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
        {showError ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : showEmpty ? (
          <EmptyState />
        ) : loading && rows.length === 0 ? (
          <ChartSkeleton />
        ) : (
          <div
            className={cn("relative h-[300px] w-full", loading && "opacity-60")}
          >
            {loading ? (
              <ChartSkeleton className="absolute inset-0 z-10 bg-card/50" />
            ) : null}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rows}
                margin={{ top: 12, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id={BAR_GRADIENT_ID}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={BAR_COLOR} stopOpacity={1} />
                    <stop
                      offset="100%"
                      stopColor={BAR_COLOR}
                      stopOpacity={0.35}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{
                    fontSize: density.tickFontSize,
                    fill: "var(--muted-foreground)",
                  }}
                  tickLine={false}
                  axisLine={false}
                  interval={bucket === "daily" ? "preserveStartEnd" : 0}
                  minTickGap={bucket === "daily" ? 8 : 4}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  tickFormatter={(value: number) => formatNairaCompact(value)}
                  width={56}
                />
                <Tooltip
                  cursor={{ fill: "rgba(124, 58, 237, 0.06)" }}
                  content={<ChartTooltip />}
                />
                <Bar
                  dataKey="value"
                  fill={`url(#${BAR_GRADIENT_ID})`}
                  radius={[6, 6, 0, 0]}
                  barSize={density.barSize}
                  isAnimationActive={!loading}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Card>
  );
}

type SegmentedOption<T extends string> = { value: T; label: string };

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  disabled,
  ariaLabel,
}: Readonly<{
  value: T;
  options: ReadonlyArray<SegmentedOption<T>>;
  onChange: (value: T) => void;
  disabled?: boolean;
  ariaLabel: string;
}>) {
  return (
    <div
      aria-label={ariaLabel}
      className="inline-flex rounded-xl bg-muted/70 p-1"
    >
      {options.map((opt) => {
        const active = value === opt.value;
        if (active) {
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              aria-pressed="true"
              onClick={() => onChange(opt.value)}
              className={cn(
                "cursor-pointer rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
                "bg-card text-foreground shadow-sm",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              {opt.label}
            </button>
          );
        }
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            aria-pressed="false"
            onClick={() => onChange(opt.value)}
            className={cn(
              "cursor-pointer rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
              "text-muted-foreground hover:text-foreground",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            {opt.label}
          </button>
        );
      })}
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
        No recharges in this period
      </p>
      <p className="text-xs text-muted-foreground">
        Try switching between Daily, Weekly, and Monthly.
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
        Couldn’t load recharge behavior
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
        "flex h-[280px] w-full items-end gap-3 px-2 py-6",
        className,
      )}
      aria-hidden
    >
      {[45, 70, 55, 85, 60].map((h, i) => (
        <div
          key={`sk-recharge-${h}-${i}`}
          className="flex-1 animate-pulse rounded-t-lg bg-violet-200/50 dark:bg-violet-500/20"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

export default RechargeBehaviorChart;
