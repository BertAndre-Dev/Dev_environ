"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
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
  toCollectionEfficiencyRows,
  type CollectionEfficiencyRow,
} from "@/lib/analytics/toCollectionEfficiencyRows";
import type { CollectionEfficiencyData } from "@/types/analytics";

const EXPECTED_COLOR = "#94A3B8";
const COLLECTED_COLOR = "#10B981";
const EFF_GREEN = "#10B981";
const EFF_AMBER = "#F59E0B";
const EFF_RED = "#EF4444";
const EFF_MUTED = "#94A3B8";

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

function efficiencyColor(row: CollectionEfficiencyRow): string {
  if (!row.isApplicable) return EFF_MUTED;
  if (row.efficiencyPercent >= 70) return EFF_GREEN;
  if (row.efficiencyPercent >= 40) return EFF_AMBER;
  return EFF_RED;
}

function efficiencyLabel(row: CollectionEfficiencyRow): string {
  if (!row.isApplicable) return "N/A";
  return `${Number(row.efficiencyPercent).toFixed(1)}%`;
}

type TooltipProps = Readonly<{
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: CollectionEfficiencyRow }>;
  label?: string;
}>;

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  return (
    <div className="min-w-[200px] rounded-xl border border-border/80 bg-white px-3.5 py-3 text-sm shadow-lg dark:bg-card">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label ?? row.category}
      </p>
      <div className="mt-2 space-y-1.5">
        <div className="flex items-center justify-between gap-6">
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: EXPECTED_COLOR }}
              aria-hidden
            />
            Expected
          </span>
          <span className="font-semibold tabular-nums text-foreground">
            {formatNaira(row.expected)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: COLLECTED_COLOR }}
              aria-hidden
            />
            Collected
          </span>
          <span className="font-semibold tabular-nums text-foreground">
            {formatNaira(row.collected)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">Efficiency</span>
          <span
            className="font-semibold tabular-nums"
            style={{ color: efficiencyColor(row) }}
          >
            {row.isApplicable
              ? `${Number(row.efficiencyPercent).toFixed(1)}%`
              : "N/A (none expected)"}
          </span>
        </div>
      </div>
    </div>
  );
}

type EffLabelProps = Readonly<{
  x?: number;
  y?: number;
  width?: number;
  index?: number;
  rows: CollectionEfficiencyRow[];
}>;

function EfficiencyLabel({ x = 0, y = 0, width = 0, index = 0, rows }: EffLabelProps) {
  const row = rows[index];
  if (!row) return null;
  const text = efficiencyLabel(row);
  const fill = efficiencyColor(row);
  // Center over the Expected+Collected group (barGap=6).
  const cx = x + width + 3;
  // Zero-height bars place y on the baseline — keep N/A near the chart top.
  const labelY = row.isApplicable ? y - 8 : 22;

  return (
    <text
      x={cx}
      y={labelY}
      fill={fill}
      textAnchor="middle"
      fontSize={12}
      fontWeight={600}
    >
      {text}
    </text>
  );
}

type CollectionEfficiencyChartProps = Readonly<{
  data: CollectionEfficiencyData | null;
  loading?: boolean;
  error?: string | null;
  onRetry: () => void;
  className?: string;
}>;

export function CollectionEfficiencyChart({
  data,
  loading = false,
  error = null,
  onRetry,
  className,
}: CollectionEfficiencyChartProps) {
  const rows = useMemo(() => toCollectionEfficiencyRows(data), [data]);

  const overall = data?.overall;
  const overallExpected = Number(overall?.expected ?? 0);
  const overallCollected = Number(overall?.collected ?? 0);
  const overallApplicable = overallExpected > 0;
  const overallPct = Number(overall?.efficiencyPercent ?? 0);

  const showError = Boolean(error) && !data && !loading;
  const showEmpty =
    !loading &&
    !error &&
    overallExpected === 0 &&
    overallCollected === 0;

  const naNotes = rows
    .filter((row) => !row.isApplicable)
    .map(
      (row) =>
        `${row.category} shows no expected amount — nothing was expected for these estates this period.`,
    );

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
            Collection efficiency
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading && !data
              ? "Loading…"
              : overallApplicable
                ? `Overall ${overallPct.toFixed(1)}% · ${formatNairaCompact(overallCollected)} of ${formatNairaCompact(overallExpected)}`
                : "No amounts expected this period"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: EXPECTED_COLOR }}
              aria-hidden
            />
            Expected
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: COLLECTED_COLOR }}
              aria-hidden
            />
            Collected
          </span>
        </div>
      </div>

      <div className="space-y-3 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
        <ChartBody
          showError={showError}
          showEmpty={showEmpty}
          loading={loading}
          hasData={Boolean(data)}
          rows={rows}
          error={error}
          onRetry={onRetry}
        />
        {naNotes.length > 0 && !showError && !showEmpty ? (
          <div className="space-y-1">
            {naNotes.map((note) => (
              <p key={note} className="text-xs text-muted-foreground">
                {note}
              </p>
            ))}
          </div>
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
  error,
  onRetry,
}: Readonly<{
  showError: boolean;
  showEmpty: boolean;
  loading: boolean;
  hasData: boolean;
  rows: CollectionEfficiencyRow[];
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

  return (
    <div
      className={cn("relative h-[280px] w-full", loading && "opacity-60")}
    >
      {loading ? (
        <ChartSkeleton className="absolute inset-0 z-10 bg-card/50" />
      ) : null}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          margin={{ top: 28, right: 12, left: 4, bottom: 8 }}
          barGap={6}
          barCategoryGap="28%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            className="stroke-border/60"
          />
          <XAxis
            dataKey="category"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--foreground)" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            tickFormatter={(value: number) => formatNairaCompact(value)}
          />
          <Tooltip
            cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
            content={<ChartTooltip />}
          />
          <Bar
            dataKey="expected"
            name="Expected"
            fill={EXPECTED_COLOR}
            radius={[6, 6, 0, 0]}
            maxBarSize={42}
            isAnimationActive={!loading}
          >
            <LabelList
              dataKey="expected"
              content={(props) => (
                <EfficiencyLabel
                  {...(props as EffLabelProps)}
                  rows={rows}
                />
              )}
            />
          </Bar>
          <Bar
            dataKey="collected"
            name="Collected"
            fill={COLLECTED_COLOR}
            radius={[6, 6, 0, 0]}
            maxBarSize={42}
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
        No collection data this period
      </p>
      <p className="text-xs text-muted-foreground">
        Efficiency will appear when bills or rent are expected.
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
        Couldn’t load collection efficiency
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
        "flex h-[280px] w-full items-end justify-center gap-8 px-8 py-6",
        className,
      )}
      aria-hidden
    >
      {[0, 1].map((group) => (
        <div key={`sk-ce-${group}`} className="flex items-end gap-2">
          <div className="h-36 w-10 animate-pulse rounded-t-md bg-slate-200/70 dark:bg-slate-500/20" />
          <div className="h-24 w-10 animate-pulse rounded-t-md bg-emerald-200/60 dark:bg-emerald-500/20" />
        </div>
      ))}
    </div>
  );
}

export default CollectionEfficiencyChart;
