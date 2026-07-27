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
  AnalyticsPeriodRange,
  PaymentChannelEntry,
} from "@/types/analytics";

export type { PaymentChannelEntry };

type ChartRow = {
  gateway: string;
  label: string;
  totalAmount: number;
  transactionCount: number;
  successRatePercent: number;
  paidCount: number;
  failedCount: number;
};

const BAR_COLOR = "#7C3AED";
const BAR_GRADIENT_ID = "paymentChannelsBarGradient";
const ROW_HEIGHT = 40;
const CHART_PADDING = 48;
const Y_AXIS_WIDTH = 168;

const RATE_GREEN = "#10B981";
const RATE_AMBER = "#F59E0B";
const RATE_RED = "#EF4444";

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

function capitalizeGateway(gateway: string): string {
  const raw = String(gateway ?? "").trim();
  if (!raw) return "Unknown";
  return raw
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function successRateTone(rate: number): {
  color: string;
  className: string;
} {
  if (rate >= 100) {
    return {
      color: RATE_GREEN,
      className:
        "bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200",
    };
  }
  if (rate >= 80) {
    return {
      color: RATE_AMBER,
      className:
        "bg-amber-500/15 text-amber-900 dark:bg-amber-500/20 dark:text-amber-100",
    };
  }
  return {
    color: RATE_RED,
    className: "bg-red-500/15 text-red-800 dark:bg-red-500/20 dark:text-red-200",
  };
}

function buildChartRows(series: PaymentChannelEntry[]): ChartRow[] {
  return [...series]
    .map((entry) => ({
      gateway: String(entry.gateway ?? "").trim() || "unknown",
      label: capitalizeGateway(entry.gateway),
      totalAmount: Number(entry.totalAmount ?? 0),
      transactionCount: Number(entry.transactionCount ?? 0),
      successRatePercent: Number(entry.successRatePercent ?? 0),
      paidCount: Number(entry.paidCount ?? 0),
      failedCount: Number(entry.failedCount ?? 0),
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
}

type TooltipProps = Readonly<{
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: ChartRow }>;
}>;

function ChartTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  const tone = successRateTone(row.successRatePercent);

  return (
    <div className="min-w-[190px] rounded-xl border border-border/80 bg-white px-3.5 py-3 text-sm shadow-lg dark:bg-card">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {row.label}
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
            {formatNaira(row.totalAmount)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">Transactions</span>
          <span className="font-semibold tabular-nums text-foreground">
            {row.transactionCount.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: tone.color }}
              aria-hidden
            />
            Success
          </span>
          <span className="font-semibold tabular-nums text-foreground">
            {row.successRatePercent.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}

type GatewayTickProps = Readonly<{
  x?: number;
  y?: number;
  payload?: { value?: string };
  rowsByLabel: Map<string, ChartRow>;
}>;

function GatewayYTick({ x = 0, y = 0, payload, rowsByLabel }: GatewayTickProps) {
  const label = String(payload?.value ?? "");
  const row = rowsByLabel.get(label);
  const rate = row?.successRatePercent ?? 0;
  const tone = successRateTone(rate);

  return (
    <g transform={`translate(${x},${y})`}>
      <foreignObject
        x={-Y_AXIS_WIDTH}
        y={-14}
        width={Y_AXIS_WIDTH - 6}
        height={28}
      >
        <div className="flex h-7 items-center justify-end gap-1.5 pr-1">
          <span
            className={cn(
              "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums leading-none",
              tone.className,
            )}
          >
            {rate.toFixed(0)}%
          </span>
          <span className="truncate text-right text-xs font-medium text-foreground">
            {label}
          </span>
        </div>
      </foreignObject>
    </g>
  );
}

type PaymentChannelsChartProps = Readonly<{
  series: PaymentChannelEntry[];
  loading?: boolean;
  error?: string | null;
  period?: AnalyticsPeriodRange | null;
  onRetry: () => void;
  className?: string;
}>;

export function PaymentChannelsChart({
  series,
  loading = false,
  error = null,
  period = null,
  onRetry,
  className,
}: PaymentChannelsChartProps) {
  const rows = useMemo(() => buildChartRows(series), [series]);
  const rowsByLabel = useMemo(
    () => new Map(rows.map((row) => [row.label, row])),
    [rows],
  );

  const chartHeight = Math.max(220, rows.length * ROW_HEIGHT + CHART_PADDING);
  const totalAmount = useMemo(
    () => rows.reduce((sum, row) => sum + row.totalAmount, 0),
    [rows],
  );

  const unknownAttributionGap = useMemo(() => {
    if (totalAmount <= 0) return false;
    return rows.some(
      (row) =>
        row.gateway.toLowerCase() === "unknown" &&
        row.totalAmount / totalAmount > 0.5,
    );
  }, [rows, totalAmount]);

  const showError = Boolean(error) && rows.length === 0 && !loading;
  const showEmpty = !loading && !error && rows.length === 0;
  const periodLabel =
    period?.startDate && period?.endDate
      ? formatPeriodRange(period.startDate, period.endDate)
      : null;

  return (
    <Card
      className={cn(
        "mt-0 gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-sm",
        className,
      )}
    >
      <div className="px-5 pt-5 sm:px-6 sm:pt-6">
        <h2 className="font-heading text-lg font-bold tracking-tight text-foreground sm:text-xl">
          Payment channel performance
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {loading && rows.length === 0
            ? "Loading…"
            : `${formatNairaCompact(totalAmount)} across ${rows.length} gateway${rows.length === 1 ? "" : "s"}`}
          {periodLabel ? ` · ${periodLabel}` : null}
        </p>
      </div>

      <div className="space-y-3 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
        <ChartBody
          showError={showError}
          showEmpty={showEmpty}
          loading={loading}
          rows={rows}
          rowsByLabel={rowsByLabel}
          error={error}
          onRetry={onRetry}
          chartHeight={chartHeight}
        />
        {unknownAttributionGap && !showError ? (
          <p className="text-xs text-muted-foreground">
            One gateway labeled &quot;Unknown&quot; accounts for more than half
            of volume — this often indicates a gateway-attribution data gap.
          </p>
        ) : null}
      </div>
    </Card>
  );
}

function ChartBody({
  showError,
  showEmpty,
  loading,
  rows,
  rowsByLabel,
  error,
  onRetry,
  chartHeight,
}: Readonly<{
  showError: boolean;
  showEmpty: boolean;
  loading: boolean;
  rows: ChartRow[];
  rowsByLabel: Map<string, ChartRow>;
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
          margin={{ top: 8, right: 16, left: 4, bottom: 8 }}
        >
          <defs>
            <linearGradient
              id={BAR_GRADIENT_ID}
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="0%" stopColor={BAR_COLOR} stopOpacity={0.75} />
              <stop offset="100%" stopColor={BAR_COLOR} stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            className="stroke-border/60"
          />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            tickFormatter={(value: number) => formatNairaCompact(value)}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={Y_AXIS_WIDTH}
            reversed
            tickLine={false}
            axisLine={false}
            interval={0}
            tick={<GatewayYTick rowsByLabel={rowsByLabel} />}
          />
          <Tooltip
            cursor={{ fill: "rgba(124, 58, 237, 0.06)" }}
            content={<ChartTooltip />}
          />
          <Bar
            dataKey="totalAmount"
            fill={`url(#${BAR_GRADIENT_ID})`}
            radius={[0, 8, 8, 0]}
            barSize={18}
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
        No payment channel data
      </p>
      <p className="text-xs text-muted-foreground">
        Gateway performance will appear when transactions are recorded.
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
        Couldn’t load payment channels
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
      {[92, 68, 54, 40].map((w, i) => (
        <div key={`sk-pay-${w}-${i}`} className="flex items-center gap-3">
          <div className="h-3 w-28 shrink-0 animate-pulse rounded bg-muted" />
          <div
            className="h-5 animate-pulse rounded-r-lg bg-violet-200/50 dark:bg-violet-500/20"
            style={{ width: `${w}%` }}
          />
        </div>
      ))}
    </div>
  );
}

export default PaymentChannelsChart;
