"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  RevenuePoint,
  RevenueTrendGranularity,
} from "@/types/analytics";

export type { RevenuePoint };

type MetricMode = "both" | "revenue" | "vends";

type ChartRow = RevenuePoint & {
  label: string;
  revenueDelta: number | null;
  vendDelta: number | null;
};

const REVENUE_COLOR = "#7C3AED";
const VENDS_COLOR = "#F59E0B";
const BAR_GRADIENT_ID = "vendingRevenueBarGradient";

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function formatPeriodLabel(
  period: string,
  granularity: RevenueTrendGranularity,
): string {
  const raw = String(period ?? "").trim();
  if (!raw) return "—";
  if (granularity === "week" || /W\d{1,2}/i.test(raw)) {
    const m = /W(\d{1,2})/i.exec(raw);
    if (m) return `Wk ${m[1]}`;
  }
  const month = /^(\d{4})-(\d{2})$/.exec(raw);
  if (month) {
    const idx = Number(month[2]) - 1;
    if (idx >= 0 && idx < 12) return `${MONTH_SHORT[idx]} ${month[1]}`;
  }
  return raw;
}

function deltaPercent(
  current: number,
  previous: number | undefined,
): number | null {
  if (previous == null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function formatDeltaShort(delta: number | null): string {
  if (delta == null || !Number.isFinite(delta)) return "—";
  return `${Math.abs(delta).toFixed(0)}%`;
}

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

function buildChartRows(
  series: RevenuePoint[],
  granularity: RevenueTrendGranularity,
): ChartRow[] {
  return series.map((point, index) => {
    const prev = index > 0 ? series[index - 1] : undefined;
    return {
      ...point,
      label: formatPeriodLabel(point.period, granularity),
      revenueDelta: deltaPercent(point.vendingRevenue, prev?.vendingRevenue),
      vendDelta: deltaPercent(point.vendCount, prev?.vendCount),
    };
  });
}

type TooltipProps = Readonly<{
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: ChartRow }>;
  label?: string;
}>;

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
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
              style={{ backgroundColor: REVENUE_COLOR }}
              aria-hidden
            />
            Revenue
          </span>
          <span className="font-semibold tabular-nums text-foreground">
            {formatNaira(row.vendingRevenue)}
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

type RevenueTrendChartProps = Readonly<{
  series: RevenuePoint[];
  granularity: RevenueTrendGranularity;
  loading?: boolean;
  error?: string | null;
  onGranularityChange: (value: RevenueTrendGranularity) => void;
  onRetry: () => void;
  className?: string;
}>;

export function RevenueTrendChart({
  series,
  granularity,
  loading = false,
  error = null,
  onGranularityChange,
  onRetry,
  className,
}: RevenueTrendChartProps) {
  const [metricMode, setMetricMode] = useState<MetricMode>("both");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const rows = useMemo(
    () => buildChartRows(series, granularity),
    [series, granularity],
  );

  const totals = useMemo(() => {
    const totalRevenue = rows.reduce((s, r) => s + r.vendingRevenue, 0);
    const latest = rows.at(-1) ?? null;
    return { totalRevenue, latest };
  }, [rows]);

  const viewing =
    activeIndex != null && rows[activeIndex]
      ? rows[activeIndex]
      : (totals.latest ?? null);

  const showRevenue = metricMode === "both" || metricMode === "revenue";
  const showVends = metricMode === "both" || metricMode === "vends";
  const showError = Boolean(error) && series.length === 0 && !loading;
  const showEmpty = !loading && !error && rows.length === 0;
  const periodWord = granularity === "week" ? "week" : "month";
  const periodWordPlural = granularity === "week" ? "weeks" : "months";
  const periodLabel =
    granularity === "week" ? "Weekly" : "Monthly";

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
            Vending Revenue Trend
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {periodLabel}
            {" · "}
            {loading && rows.length === 0
              ? "Loading…"
              : `${formatNairaCompact(totals.totalRevenue)} total across ${rows.length} ${periodWordPlural}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl
            ariaLabel="Granularity"
            value={granularity}
            options={[
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
            ]}
            onChange={onGranularityChange}
            disabled={loading}
          />
          <SegmentedControl
            ariaLabel="Metric view"
            value={metricMode}
            options={[
              { value: "both", label: "Both" },
              { value: "revenue", label: "Revenue" },
              { value: "vends", label: "Vends" },
            ]}
            onChange={setMetricMode}
          />
        </div>
      </div>

      <div className="space-y-4 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
        {showError ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : showEmpty ? (
          <EmptyState />
        ) : loading && rows.length === 0 ? (
          <ChartSkeleton />
        ) : (
          <>
            {totals.latest ? (
              <div className="flex flex-wrap gap-2.5">
                <SummaryPill
                  tone="purple"
                  label={`This ${periodWord}`}
                  value={formatNairaCompact(totals.latest.vendingRevenue)}
                  delta={totals.latest.revenueDelta}
                />
                <SummaryPill
                  tone="orange"
                  label="Vends"
                  value={totals.latest.vendCount.toLocaleString()}
                  delta={totals.latest.vendDelta}
                />
              </div>
            ) : null}

            <div
              className={cn("relative h-[300px] w-full", loading && "opacity-60")}
            >
              {loading ? (
                <ChartSkeleton className="absolute inset-0 z-10 bg-card/50" />
              ) : null}
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={rows}
                  margin={{ top: 12, right: 8, left: 0, bottom: 0 }}
                  onMouseMove={(state) => {
                    const idx = state?.activeTooltipIndex;
                    setActiveIndex(typeof idx === "number" ? idx : null);
                  }}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  <defs>
                    <linearGradient
                      id={BAR_GRADIENT_ID}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={REVENUE_COLOR}
                        stopOpacity={1}
                      />
                      <stop
                        offset="100%"
                        stopColor={REVENUE_COLOR}
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
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                    padding={
                      rows.length === 1
                        ? { left: 40, right: 40 }
                        : { left: 8, right: 8 }
                    }
                  />
                  {showRevenue ? (
                    <YAxis
                      yAxisId="revenue"
                      tickFormatter={(v) => formatNairaCompact(Number(v))}
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      tickLine={false}
                      axisLine={false}
                      width={52}
                      domain={[0, "auto"]}
                    />
                  ) : null}
                  {showVends ? (
                    <YAxis
                      yAxisId="vends"
                      orientation={showRevenue ? "right" : "left"}
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      tickLine={false}
                      axisLine={false}
                      width={32}
                      domain={[0, "auto"]}
                    />
                  ) : null}
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{
                      stroke: "#CBD5E1",
                      strokeWidth: 1,
                    }}
                  />
                  {showRevenue ? (
                    <Bar
                      yAxisId="revenue"
                      dataKey="vendingRevenue"
                      name="Revenue"
                      fill={`url(#${BAR_GRADIENT_ID})`}
                      radius={[8, 8, 0, 0]}
                      maxBarSize={44}
                      animationDuration={650}
                      isAnimationActive
                    />
                  ) : null}
                  {showVends ? (
                    <Line
                      yAxisId="vends"
                      type="monotone"
                      dataKey="vendCount"
                      name="Vends"
                      stroke={VENDS_COLOR}
                      strokeWidth={2.5}
                      dot={{
                        r: 5,
                        fill: VENDS_COLOR,
                        stroke: "#fff",
                        strokeWidth: 2,
                      }}
                      activeDot={{
                        r: 7,
                        fill: VENDS_COLOR,
                        stroke: "#fff",
                        strokeWidth: 2,
                      }}
                      animationDuration={700}
                      isAnimationActive
                    />
                  ) : null}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <p className="text-xs text-muted-foreground">
              {viewing
                ? `Viewing ${viewing.label} · ${viewing.period}`
                : "Hover a bar or point to inspect a period."}
            </p>
          </>
        )}
      </div>
    </Card>
  );
}

function SummaryPill({
  tone,
  label,
  value,
  delta,
}: Readonly<{
  tone: "purple" | "orange";
  label: string;
  value: string;
  delta: number | null;
}>) {
  const up = delta != null && delta >= 0;
  const DotColor = tone === "purple" ? REVENUE_COLOR : VENDS_COLOR;
  const TrendIcon = up ? ArrowUpRight : ArrowDownRight;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm",
        tone === "purple" && "bg-violet-50 dark:bg-violet-500/10",
        tone === "orange" && "bg-amber-50 dark:bg-amber-500/10",
      )}
    >
      <span
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: DotColor }}
        aria-hidden
      />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold tabular-nums text-foreground">{value}</span>
      {delta != null ? (
        <span
          className={cn(
            "inline-flex items-center gap-0.5 text-xs font-semibold",
            up
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-red-500 dark:text-red-400",
          )}
        >
          <TrendIcon className="size-3.5" aria-hidden />
          {formatDeltaShort(delta)}
        </span>
      ) : null}
    </div>
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
                "rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
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
              "rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
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
        No revenue in this period
      </p>
      <p className="text-xs text-muted-foreground">
        Try switching between Week and Month.
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
      <p className="font-medium text-foreground">Couldn’t load revenue trend</p>
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
          key={`sk-bar-${h}-${i}`}
          className="flex-1 animate-pulse rounded-t-lg bg-violet-200/50 dark:bg-violet-500/20"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

export default RevenueTrendChart;
