"use client";

import { useMemo } from "react";
import { RefreshCw } from "lucide-react";
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

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ESTATE_CONSUMPTION_CHART_RANGE_OPTIONS,
  formatEstateConsumptionDateRange,
  mapEstateConsumptionToBarPoints,
  type EstateConsumptionChartData,
  type EstateConsumptionChartRange,
} from "@/lib/estate-consumption-chart";

export type { EstateConsumptionChartRange };

const BAR_COLOR = "#D0DFF2";
const BAR_COLOR_HIGHLIGHT = "#0150AC";

export interface EstateConsumptionChartCardProps {
  readonly title?: string;
  readonly data: EstateConsumptionChartData | null;
  readonly loading?: boolean;
  readonly progress?: number | null;
  readonly range: EstateConsumptionChartRange;
  readonly onRangeChange: (range: EstateConsumptionChartRange) => void;
  readonly onRefresh?: () => void;
  readonly refreshing?: boolean;
  readonly emptyMessage?: string | null;
  readonly className?: string;
}

function formatYAxisTick(value: number): string {
  if (value === 0) return "0";
  if (value >= 1_000) {
    return `${(value / 1_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k`;
  }
  return String(value);
}

function computeYAxisMax(values: number[]): number {
  const max = Math.max(0, ...values);
  if (max === 0) return 10;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const normalized = max / magnitude;
  let nice = 10;
  if (normalized <= 1) nice = 1;
  else if (normalized <= 2) nice = 2;
  else if (normalized <= 5) nice = 5;
  return nice * magnitude;
}

type ChartTooltipProps = Readonly<{
  active?: boolean;
  payload?: ReadonlyArray<{
    value?: number;
    payload?: { label?: string; value?: number };
  }>;
}>;

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  const value = payload[0]?.value ?? point?.value ?? 0;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-foreground">{point?.label}</p>
      <p className="text-muted-foreground tabular-nums">
        {Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
        kWh
      </p>
    </div>
  );
}

function PeriodSegmentedControl({
  value,
  onChange,
  disabled,
}: Readonly<{
  value: EstateConsumptionChartRange;
  onChange: (range: EstateConsumptionChartRange) => void;
  disabled?: boolean;
}>) {
  return (
    <div className="inline-flex flex-wrap rounded-full border border-input bg-muted/30 p-1">
      {ESTATE_CONSUMPTION_CHART_RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-full px-2 py-1.5 text-sm font-medium transition-colors cursor-pointer sm:px-4",
            disabled && "cursor-not-allowed opacity-60",
            value === opt.value
              ? "bg-[#0150AC] text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function EstateConsumptionChartCard({
  title = "Estate consumption chart",
  data,
  loading = false,
  progress = null,
  range,
  onRangeChange,
  onRefresh,
  refreshing = false,
  emptyMessage,
  className,
}: EstateConsumptionChartCardProps) {
  const barPoints = useMemo(() => mapEstateConsumptionToBarPoints(data), [data]);

  const maxValue = useMemo(
    () => Math.max(0, ...barPoints.map((p) => p.value)),
    [barPoints],
  );

  const chartData = useMemo(
    () =>
      barPoints.map((point) => ({
        ...point,
        highlighted: point.value === maxValue && maxValue > 0,
      })),
    [barPoints, maxValue],
  );

  const yMax = useMemo(
    () => computeYAxisMax(barPoints.map((p) => p.value)),
    [barPoints],
  );
  const hasChartData = chartData.length > 0;
  const dateRangeLabel = formatEstateConsumptionDateRange(data?.from, data?.to);
  const totalConsumption = data?.totalConsumption ?? 0;
  const showProgress = loading && typeof progress === "number";

  const yTicks = useMemo(() => {
    const tickCount = 4;
    const step = yMax / tickCount;
    return Array.from({ length: tickCount + 1 }, (_, i) =>
      Math.round(step * i * 100) / 100,
    );
  }, [yMax]);

  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden rounded-xl border border-border bg-card p-0 shadow-sm",
        className,
      )}
    >
      <div className="flex flex-col gap-4 border-b border-border px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-heading text-2xl font-bold text-foreground">
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Per-period consumption (kWh) aggregated across estate meters
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PeriodSegmentedControl
            value={range}
            onChange={onRangeChange}
            disabled={loading}
          />
          {onRefresh ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading || refreshing}
              onClick={onRefresh}
              className="shrink-0"
            >
              <RefreshCw
                className={cn("mr-2 size-4", refreshing && "animate-spin")}
              />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 border-b border-border px-6 py-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Total consumption</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums">
            {loading
              ? "—"
              : `${totalConsumption.toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh`}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Data points</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums">
            {loading ? "—" : (data?.count ?? chartData.length).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Meters aggregated</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums">
            {loading ? "—" : (data?.successCount ?? 0).toLocaleString()}
            {!loading && data ? (
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                / {data.meterCount.toLocaleString()}
              </span>
            ) : null}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Period</p>
          <p className="mt-0.5 text-sm font-medium">
            {loading ? "—" : (dateRangeLabel ?? "—")}
          </p>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6 sm:py-6">
        {loading ? (
          <div className="flex h-[300px] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>
              {showProgress
                ? `Aggregating chart… ${Math.round(progress)}%`
                : "Loading consumption chart…"}
            </span>
            {showProgress ? (
              <div className="h-1.5 w-48 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-[#0150AC] transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.max(0, progress))}%`,
                  }}
                />
              </div>
            ) : null}
          </div>
        ) : hasChartData ? (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 12, right: 12, left: 4, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="#e2e8f0"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                />
                <YAxis
                  ticks={yTicks}
                  domain={[0, yMax]}
                  tickFormatter={formatYAxisTick}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  label={{
                    value: "kWh",
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 11, fill: "#94a3b8" },
                  }}
                />
                <Tooltip content={<ChartTooltip />} cursor={false} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56}>
                  {chartData.map((entry) => (
                    <Cell
                      key={`${entry.date}-${entry.value}`}
                      fill={
                        entry.highlighted ? BAR_COLOR_HIGHLIGHT : BAR_COLOR
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : emptyMessage ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

export default EstateConsumptionChartCard;
