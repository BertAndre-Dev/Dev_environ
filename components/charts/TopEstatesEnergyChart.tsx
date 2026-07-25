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
import type { TopEstateEnergyEntry } from "@/types/analytics";

export type { TopEstateEnergyEntry };

type ChartRow = {
  rank: number;
  name: string;
  totalAmount: number;
  vendCount: number;
  city: string;
  state: string;
};

const AMOUNT_COLOR = "#7C3AED";
const VENDS_COLOR = "#F59E0B";
const AMOUNT_GRADIENT_ID = "topEstatesAmountBarGradient";
const VENDS_GRADIENT_ID = "topEstatesVendsBarGradient";
const ROW_HEIGHT = 56;
const CHART_PADDING = 64;
const Y_AXIS_WIDTH = 148;

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

function buildChartRows(series: TopEstateEnergyEntry[]): ChartRow[] {
  return [...series]
    .sort((a, b) => a.rank - b.rank)
    .map((entry) => ({
      rank: entry.rank,
      name: entry.estate?.name?.trim() || "Unknown estate",
      totalAmount: entry.totalAmount ?? 0,
      vendCount: entry.vendCount ?? 0,
      city: entry.estate?.city ?? "",
      state: entry.estate?.state ?? "",
    }));
}

type TooltipProps = Readonly<{
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: ChartRow }>;
}>;

function ChartTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  const location = [row.city, row.state].filter(Boolean).join(", ");
  return (
    <div className="min-w-[180px] rounded-xl border border-border/80 bg-white px-3.5 py-3 text-sm shadow-lg dark:bg-card">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        #{row.rank} · {row.name}
      </p>
      {location ? (
        <p className="mt-0.5 text-xs text-muted-foreground">{location}</p>
      ) : null}
      <div className="mt-2 space-y-1.5">
        <div className="flex items-center justify-between gap-6">
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: AMOUNT_COLOR }}
              aria-hidden
            />
            Amount
          </span>
          <span className="font-semibold tabular-nums text-foreground">
            {formatNaira(row.totalAmount)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: VENDS_COLOR }}
              aria-hidden
            />
            Vends
          </span>
          <span className="font-semibold tabular-nums text-foreground">
            {row.vendCount.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

type TopEstatesEnergyChartProps = Readonly<{
  series: TopEstateEnergyEntry[];
  loading?: boolean;
  error?: string | null;
  periodLabel?: string | null;
  estateCount?: number | null;
  onRetry: () => void;
  className?: string;
}>;

export function TopEstatesEnergyChart({
  series,
  loading = false,
  error = null,
  periodLabel = null,
  estateCount = null,
  onRetry,
  className,
}: TopEstatesEnergyChartProps) {
  const rows = useMemo(() => buildChartRows(series), [series]);

  const chartHeight = Math.max(
    240,
    rows.length * ROW_HEIGHT + CHART_PADDING,
  );

  const totalAmount = useMemo(
    () => rows.reduce((sum, row) => sum + row.totalAmount, 0),
    [rows],
  );

  const showError = Boolean(error) && rows.length === 0 && !loading;
  const showEmpty = !loading && !error && rows.length === 0;
  const scopeLabel =
    estateCount != null && estateCount > 0
      ? `${rows.length} of ${estateCount} estates`
      : `${rows.length} estates`;

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
            Top estates by energy purchased
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading && rows.length === 0
              ? "Loading…"
              : `${formatNairaCompact(totalAmount)} across ${scopeLabel}`}
            {periodLabel ? ` · ${periodLabel}` : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: AMOUNT_COLOR }}
              aria-hidden
            />
            Amount
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: VENDS_COLOR }}
              aria-hidden
            />
            Vends
          </span>
        </div>
      </div>

      <div className="space-y-4 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
        <ChartBody
          showError={showError}
          showEmpty={showEmpty}
          loading={loading}
          rows={rows}
          error={error}
          onRetry={onRetry}
          chartHeight={chartHeight}
        />
      </div>
    </Card>
  );
}

function ChartBody({
  showError,
  showEmpty,
  loading,
  rows,
  error,
  onRetry,
  chartHeight,
}: Readonly<{
  showError: boolean;
  showEmpty: boolean;
  loading: boolean;
  rows: ChartRow[];
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
  if (loading && rows.length === 0) {
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
          margin={{ top: 20, right: 16, left: 4, bottom: 20 }}
          barGap={4}
          barCategoryGap="28%"
        >
          <defs>
            <linearGradient
              id={AMOUNT_GRADIENT_ID}
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="0%" stopColor={AMOUNT_COLOR} stopOpacity={0.75} />
              <stop offset="100%" stopColor={AMOUNT_COLOR} stopOpacity={1} />
            </linearGradient>
            <linearGradient
              id={VENDS_GRADIENT_ID}
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="0%" stopColor={VENDS_COLOR} stopOpacity={0.75} />
              <stop offset="100%" stopColor={VENDS_COLOR} stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            className="stroke-border/60"
          />
          <XAxis
            xAxisId="amount"
            type="number"
            orientation="top"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: AMOUNT_COLOR }}
            tickFormatter={(value: number) => formatNairaCompact(value)}
          />
          <XAxis
            xAxisId="vends"
            type="number"
            orientation="bottom"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: VENDS_COLOR }}
            tickFormatter={(value: number) => Number(value).toLocaleString()}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={Y_AXIS_WIDTH}
            reversed
            tickLine={false}
            axisLine={false}
            interval={0}
            tick={{ fontSize: 12, fill: "var(--foreground)" }}
          />
          <Tooltip
            cursor={{ fill: "rgba(124, 58, 237, 0.06)" }}
            content={<ChartTooltip />}
          />
          <Bar
            xAxisId="amount"
            dataKey="totalAmount"
            name="Amount"
            fill={`url(#${AMOUNT_GRADIENT_ID})`}
            radius={[0, 6, 6, 0]}
            barSize={12}
            isAnimationActive={!loading}
          />
          <Bar
            xAxisId="vends"
            dataKey="vendCount"
            name="Vends"
            fill={`url(#${VENDS_GRADIENT_ID})`}
            radius={[0, 6, 6, 0]}
            barSize={12}
            isAnimationActive={!loading}
          />
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
        No estate energy purchases in this period
      </p>
      <p className="text-xs text-muted-foreground">
        Rankings will appear when vending activity is recorded.
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
        Couldn’t load top estates
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
      {[92, 68, 54, 40, 28].map((w, i) => (
        <div key={`sk-hbar-${w}-${i}`} className="flex items-center gap-3">
          <div className="h-3 w-24 shrink-0 animate-pulse rounded bg-muted" />
          <div className="flex flex-1 flex-col gap-1.5">
            <div
              className="h-3 animate-pulse rounded-r-lg bg-violet-200/50 dark:bg-violet-500/20"
              style={{ width: `${w}%` }}
            />
            <div
              className="h-3 animate-pulse rounded-r-lg bg-amber-200/50 dark:bg-amber-500/20"
              style={{ width: `${Math.max(18, w - 22)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function formatTopEstatesPeriodLabel(
  startDate?: string,
  endDate?: string,
): string | null {
  if (!startDate || !endDate) return null;
  return formatPeriodRange(startDate, endDate);
}

export default TopEstatesEnergyChart;
