"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BarProps } from "recharts";
import { AlertCircle, BarChart3, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  efficiencyColorForPercent,
  efficiencyToneClass,
} from "@/lib/analytics/efficiencyColor";
import {
  toCollectionEfficiencyRows,
  type CollectionEfficiencyRow,
} from "@/lib/analytics/toCollectionEfficiencyRows";
import type { CollectionEfficiencyData } from "@/types/analytics";

const EXPECTED_COLOR = "#94A3B8";
const COLLECTED_COLOR = "#10B981";

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

type TooltipProps = Readonly<{
  active?: boolean;
  payload?: ReadonlyArray<{
    name?: string;
    value?: number;
    payload?: CollectionEfficiencyRow;
  }>;
  label?: string;
}>;

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  if (row.isNoActivity) {
    return (
      <div className="min-w-[180px] rounded-xl border border-border/80 bg-white px-3.5 py-3 text-sm shadow-lg dark:bg-card">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label ?? row.category}
        </p>
        <p className="mt-2 text-muted-foreground">No activity this period</p>
      </div>
    );
  }

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
            style={{
              color: efficiencyColorForPercent(
                row.efficiencyPercent,
                row.isApplicable,
              ),
            }}
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

type NoActivityBarProps = BarProps & {
  payload?: CollectionEfficiencyRow;
};

function NoActivityBarShape(props: NoActivityBarProps) {
  const x = Number(props.x ?? 0);
  const y = Number(props.y ?? 0);
  const width = Number(props.width ?? 0);
  const height = Number(props.height ?? 0);
  const { payload, fill } = props;
  if (payload?.isNoActivity) {
    return (
      <text
        x={x + 8}
        y={y + height / 2}
        dy={4}
        fill="var(--muted-foreground)"
        fontSize={12}
      >
        No activity this period
      </text>
    );
  }
  if (width <= 0) {
    return <g />;
  }
  return (
    <Rectangle
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      radius={[0, 4, 4, 0] as unknown as number}
    />
  );
}

function CollectedBarShape(props: NoActivityBarProps) {
  const x = Number(props.x ?? 0);
  const y = Number(props.y ?? 0);
  const width = Number(props.width ?? 0);
  const height = Number(props.height ?? 0);
  const { payload } = props;
  if (payload?.isNoActivity || width <= 0) {
    return <g />;
  }
  return (
    <Rectangle
      x={x}
      y={y}
      width={width}
      height={height}
      fill={COLLECTED_COLOR}
      radius={[0, 4, 4, 0] as unknown as number}
    />
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
  const meterColor = efficiencyColorForPercent(overallPct, overallApplicable);

  const showError = Boolean(error) && !data && !loading;
  const showEmpty =
    !loading &&
    !error &&
    overallExpected === 0 &&
    overallCollected === 0;

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
            Collection efficiency (Bills &amp; Rent)
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading && !data
              ? "Loading…"
              : overallApplicable
                ? `${formatNairaCompact(overallCollected)} collected of ${formatNairaCompact(overallExpected)} expected`
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

      <div className="space-y-4 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
        <ChartBody
          showError={showError}
          showEmpty={showEmpty}
          loading={loading}
          hasData={Boolean(data)}
          rows={rows}
          error={error}
          onRetry={onRetry}
          overallExpected={overallExpected}
          overallCollected={overallCollected}
          overallPct={overallPct}
          overallApplicable={overallApplicable}
          meterColor={meterColor}
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
  rows,
  error,
  onRetry,
  overallExpected,
  overallCollected,
  overallPct,
  overallApplicable,
  meterColor,
}: Readonly<{
  showError: boolean;
  showEmpty: boolean;
  loading: boolean;
  hasData: boolean;
  rows: CollectionEfficiencyRow[];
  error: string | null;
  onRetry: () => void;
  overallExpected: number;
  overallCollected: number;
  overallPct: number;
  overallApplicable: boolean;
  meterColor: string;
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
    <div className={cn("space-y-4", loading && "opacity-60")}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile label="Expected" value={formatNairaCompact(overallExpected)} />
        <StatTile label="Collected" value={formatNairaCompact(overallCollected)} />
        <StatTile
          label="Efficiency"
          value={
            overallApplicable ? `${overallPct.toFixed(1)}%` : "N/A"
          }
          valueClassName={efficiencyToneClass(overallPct, overallApplicable)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Overall efficiency</span>
          <span
            className={cn(
              "font-semibold tabular-nums",
              efficiencyToneClass(overallPct, overallApplicable),
            )}
          >
            {overallApplicable ? `${overallPct.toFixed(1)}%` : "N/A"}
          </span>
        </div>
        <div
          className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
          role="meter"
          aria-valuenow={overallApplicable ? overallPct : 0}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Overall collection efficiency"
        >
          <div
            className="h-full rounded-full transition-[width]"
            style={{
              width: `${overallApplicable ? Math.min(100, overallPct) : 0}%`,
              backgroundColor: meterColor,
            }}
          />
        </div>
      </div>

      <div className="relative h-[220px] w-full">
        {loading ? (
          <ChartSkeleton className="absolute inset-0 z-10 bg-card/50" />
        ) : null}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
            barGap={4}
            barCategoryGap="24%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              className="stroke-border/60"
            />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickFormatter={(value: number) => formatNairaCompact(value)}
            />
            <YAxis
              type="category"
              dataKey="category"
              tickLine={false}
              axisLine={false}
              width={56}
              tick={{ fontSize: 12, fill: "var(--foreground)" }}
            />
            <Tooltip
              cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
              content={<ChartTooltip />}
            />
            <Bar
              dataKey="expected"
              name="Expected"
              fill={EXPECTED_COLOR}
              radius={[0, 4, 4, 0]}
              maxBarSize={18}
              isAnimationActive={!loading}
              shape={(props: NoActivityBarProps) => (
                <NoActivityBarShape
                  {...props}
                  payload={props.payload as CollectionEfficiencyRow | undefined}
                />
              )}
            >
              {rows.map((row) => (
                <Cell
                  key={`exp-${row.key}`}
                  fill={row.isNoActivity ? "transparent" : EXPECTED_COLOR}
                />
              ))}
            </Bar>
            <Bar
              dataKey="collected"
              name="Collected"
              fill={COLLECTED_COLOR}
              radius={[0, 4, 4, 0]}
              maxBarSize={18}
              isAnimationActive={!loading}
              shape={(props: NoActivityBarProps) => (
                <CollectedBarShape
                  {...props}
                  payload={props.payload as CollectionEfficiencyRow | undefined}
                />
              )}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  valueClassName,
}: Readonly<{
  label: string;
  value: string;
  valueClassName?: string;
}>) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 font-heading text-xl font-bold tabular-nums tracking-tight text-foreground sm:text-2xl",
          valueClassName,
        )}
      >
        {value}
      </p>
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
        Couldn&apos;t load collection efficiency
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
    <div className={cn("space-y-4", className)} aria-hidden>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={`sk-stat-${i}`}
            className="h-16 animate-pulse rounded-xl bg-muted/70"
          />
        ))}
      </div>
      <div className="h-2.5 animate-pulse rounded-full bg-muted/70" />
      <div className="flex h-[180px] flex-col justify-center gap-6 px-2">
        {[0, 1].map((i) => (
          <div key={`sk-bar-${i}`} className="flex items-center gap-3">
            <div className="h-3 w-12 animate-pulse rounded bg-muted/70" />
            <div className="h-4 flex-1 animate-pulse rounded bg-slate-200/70 dark:bg-slate-500/20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default CollectionEfficiencyChart;
