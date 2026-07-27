"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertCircle, BarChart3, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { resolveEstateName } from "@/lib/analytics/resolveEstateName";
import type {
  AnalyticsScope,
  ConsumptionSnapshotData,
} from "@/types/analytics";

const ACCENT_COLOR = "#7C3AED";
const MUTED_COLOR = "#94A3B8";
const ROW_HEIGHT = 36;
const CHART_PADDING = 48;
const Y_AXIS_WIDTH = 148;

type ChartRow = {
  estateId: string;
  name: string;
  metersWithReading: number;
  totalLastReadingConsumption: number;
  averageConsumptionPerMeter: number;
  isZeroConsumptionFlag: boolean;
};

function formatNumber(value: number): string {
  return Number(value ?? 0).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

function formatCompact(value: number): string {
  const n = Number(value ?? 0);
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  const fmt = (v: number) => {
    const s = v.toFixed(v >= 100 ? 0 : 1);
    return s.endsWith(".0") ? s.slice(0, -2) : s;
  };
  if (abs >= 1_000_000_000) return `${sign}${fmt(abs / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `${sign}${fmt(abs / 1_000_000)}M`;
  if (abs >= 1_000) return `${sign}${fmt(abs / 1_000)}K`;
  return `${sign}${abs.toLocaleString(undefined, { maximumFractionDigits: 1 })}`;
}

function buildChartRows(
  data: ConsumptionSnapshotData,
  scope: AnalyticsScope | null,
): ChartRow[] {
  const scopeEstates = scope?.estates ?? [];
  return [...(data.estates ?? [])]
    .map((entry) => {
      const meters = Math.max(0, Number(entry.metersWithReading ?? 0));
      const total = Number(entry.totalLastReadingConsumption ?? 0);
      return {
        estateId: entry.estateId,
        name: resolveEstateName(entry.estateId, scopeEstates),
        metersWithReading: meters,
        totalLastReadingConsumption: total,
        averageConsumptionPerMeter: Number(
          entry.averageConsumptionPerMeter ?? 0,
        ),
        isZeroConsumptionFlag: meters > 0 && total === 0,
      };
    })
    .sort(
      (a, b) =>
        b.totalLastReadingConsumption - a.totalLastReadingConsumption ||
        a.name.localeCompare(b.name),
    );
}

type TooltipProps = Readonly<{
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: ChartRow }>;
}>;

function ChartTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  return (
    <div className="min-w-[200px] rounded-xl border border-border/80 bg-white px-3.5 py-3 text-sm shadow-lg dark:bg-card">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {row.name}
      </p>
      <div className="mt-2 space-y-1.5">
        <div className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">Total reading</span>
          <span className="font-semibold tabular-nums text-foreground">
            {formatNumber(row.totalLastReadingConsumption)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">Meters w/ reading</span>
          <span className="font-semibold tabular-nums text-foreground">
            {row.metersWithReading.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">Avg / meter</span>
          <span className="font-semibold tabular-nums text-foreground">
            {formatNumber(row.averageConsumptionPerMeter)}
          </span>
        </div>
      </div>
    </div>
  );
}

type ConsumptionSnapshotChartProps = Readonly<{
  data: ConsumptionSnapshotData | null;
  scope?: AnalyticsScope | null;
  loading?: boolean;
  error?: string | null;
  onRetry: () => void;
  className?: string;
}>;

export function ConsumptionSnapshotChart({
  data,
  scope = null,
  loading = false,
  error = null,
  onRetry,
  className,
}: ConsumptionSnapshotChartProps) {
  const rows = useMemo(
    () => (data ? buildChartRows(data, scope) : []),
    [data, scope],
  );

  const chartHeight = Math.max(220, rows.length * ROW_HEIGHT + CHART_PADDING);
  const showError = Boolean(error) && !data && !loading;
  const showEmpty = !loading && !error && rows.length === 0;

  const zeroFlags = rows.filter((row) => row.isZeroConsumptionFlag);

  return (
    <Card
      className={cn(
        "mt-0 gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-sm",
        className,
      )}
    >
      <div className="px-5 pt-5 sm:px-6 sm:pt-6">
        <h2 className="font-heading text-lg font-bold tracking-tight text-foreground sm:text-xl">
          Consumption snapshot
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {loading && !data
            ? "Loading…"
            : `Latest meter readings across ${Number(data?.estateCount ?? 0).toLocaleString()} estates`}
        </p>
      </div>

      <div className="space-y-4 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
        <ChartBody
          showError={showError}
          showEmpty={showEmpty}
          loading={loading}
          hasData={Boolean(data)}
          data={data}
          rows={rows}
          error={error}
          onRetry={onRetry}
          chartHeight={chartHeight}
        />

        {zeroFlags.length > 0 && !showError && !showEmpty ? (
          <div className="space-y-1">
            {zeroFlags.map((row) => (
              <p key={row.estateId} className="text-xs text-muted-foreground">
                {row.name}: {row.metersWithReading.toLocaleString()} meters
                reporting but 0 total consumption — worth checking meter health
              </p>
            ))}
          </div>
        ) : null}

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
  data,
  rows,
  error,
  onRetry,
  chartHeight,
}: Readonly<{
  showError: boolean;
  showEmpty: boolean;
  loading: boolean;
  hasData: boolean;
  data: ConsumptionSnapshotData | null;
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
  if (loading && !hasData) {
    return <ChartSkeleton />;
  }
  if (!data) {
    return <EmptyState />;
  }

  return (
    <div className={cn("space-y-4", loading && "opacity-60")}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Estates"
          value={Number(data.estateCount ?? 0).toLocaleString()}
        />
        <StatTile
          label="Meters w/ reading"
          value={Number(data.metersWithReading ?? 0).toLocaleString()}
        />
        <StatTile
          label="Total reading"
          value={formatCompact(data.totalLastReadingConsumption)}
        />
        <StatTile
          label="Avg / meter"
          value={formatCompact(data.averageConsumptionPerMeter)}
        />
      </div>

      <div className="relative w-full" style={{ height: chartHeight }}>
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
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              tickFormatter={(value: number) => formatCompact(value)}
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
              dataKey="totalLastReadingConsumption"
              radius={[0, 8, 8, 0]}
              barSize={16}
              isAnimationActive={!loading}
            >
              {rows.map((row) => (
                <Cell
                  key={row.estateId}
                  fill={row.isZeroConsumptionFlag ? MUTED_COLOR : ACCENT_COLOR}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 px-3 py-2.5">
      <p className="truncate text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
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
        No consumption readings
      </p>
      <p className="text-xs text-muted-foreground">
        Estate breakdown will appear when meters report last readings.
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
        Couldn’t load consumption snapshot
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
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={`sk-cs-tile-${i}`}
            className="h-16 animate-pulse rounded-xl bg-muted/70"
          />
        ))}
      </div>
      <div className="flex h-[200px] w-full flex-col justify-center gap-3 px-2">
        {[88, 64, 50, 36].map((w, i) => (
          <div key={`sk-cs-bar-${w}-${i}`} className="flex items-center gap-3">
            <div className="h-3 w-24 shrink-0 animate-pulse rounded bg-muted" />
            <div
              className="h-4 animate-pulse rounded-r-lg bg-violet-200/50 dark:bg-violet-500/20"
              style={{ width: `${w}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ConsumptionSnapshotChart;
