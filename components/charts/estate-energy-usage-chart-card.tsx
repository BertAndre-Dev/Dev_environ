"use client";

import { useId, useMemo } from "react";
import { RefreshCw } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ESTATE_ENERGY_USAGE_RANGE_OPTIONS,
  formatEstateUsageDateRange,
  mapEstateEnergyUsageToChartPoints,
  type EstateEnergyUsageData,
  type EstateEnergyUsageRange,
} from "@/lib/estate-energy-usage-chart";
import type { PowerUsageDataPoint } from "@/lib/power-usage-chart";

export type { EstateEnergyUsageRange };

const STROKE_COLOR = "#0150AC";
const FILL_COLOR = "#0150AC";

export interface EstateEnergyUsageChartCardProps {
  readonly title?: string;
  readonly data: EstateEnergyUsageData | null;
  readonly loading?: boolean;
  readonly progress?: number | null;
  readonly range: EstateEnergyUsageRange;
  readonly onRangeChange: (range: EstateEnergyUsageRange) => void;
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

function computeYAxisMax(points: PowerUsageDataPoint[]): number {
  const maxUsage = Math.max(0, ...points.map((p) => p.usageKwh));
  if (maxUsage === 0) return 10;
  const magnitude = 10 ** Math.floor(Math.log10(maxUsage));
  const normalized = maxUsage / magnitude;
  let nice = 10;
  if (normalized <= 1) nice = 1;
  else if (normalized <= 2) nice = 2;
  else if (normalized <= 5) nice = 5;
  return nice * magnitude;
}

type ChartTooltipProps = Readonly<{
  active?: boolean;
  payload?: ReadonlyArray<{ value?: number; payload?: PowerUsageDataPoint }>;
}>;

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  const kwh = payload[0]?.value ?? point?.usageKwh ?? 0;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-foreground">{point?.label}</p>
      <p className="text-muted-foreground tabular-nums">
        {Number(kwh).toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
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
  value: EstateEnergyUsageRange;
  onChange: (range: EstateEnergyUsageRange) => void;
  disabled?: boolean;
}>) {
  return (
    <div className="inline-flex flex-wrap rounded-full border border-input bg-muted/30 p-1">
      {ESTATE_ENERGY_USAGE_RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-full px-2 py-1.5 text-sm font-medium transition-colors cursor-pointer",
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

export function EstateEnergyUsageChartCard({
  title = "Estate energy usage",
  data,
  loading = false,
  progress = null,
  range,
  onRangeChange,
  onRefresh,
  refreshing = false,
  emptyMessage,
  className,
}: EstateEnergyUsageChartCardProps) {
  const gradientId = useId().replaceAll(":", "");

  const chartPoints = useMemo(
    () => mapEstateEnergyUsageToChartPoints(data),
    [data],
  );

  const yMax = useMemo(() => computeYAxisMax(chartPoints), [chartPoints]);
  const hasChartData = chartPoints.length > 0;
  const dateRangeLabel = formatEstateUsageDateRange(data?.from, data?.to);
  const totalUsage = data?.totalUsage ?? 0;
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
            Aggregated meter consumption (kWh) across the estate
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
          <p className="text-xs text-muted-foreground">Total usage</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums">
            {loading
              ? "—"
              : `${totalUsage.toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh`}
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
          <p className="text-xs text-muted-foreground">Failed meters</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums">
            {loading ? "—" : (data?.failedCount ?? 0).toLocaleString()}
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
                ? `Aggregating usage… ${Math.round(progress)}%`
                : "Loading energy usage…"}
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
              <AreaChart
                data={chartPoints}
                margin={{ top: 12, right: 12, left: 4, bottom: 8 }}
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={FILL_COLOR}
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="100%"
                      stopColor={FILL_COLOR}
                      stopOpacity={0.04}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="#e2e8f0"
                  vertical
                  horizontal={false}
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
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="usageKwh"
                  stroke={STROKE_COLOR}
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                  dot={{
                    fill: STROKE_COLOR,
                    r: 4,
                    strokeWidth: 2,
                    stroke: "#ffffff",
                  }}
                  activeDot={{
                    r: 5,
                    fill: STROKE_COLOR,
                    stroke: "#ffffff",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
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

export default EstateEnergyUsageChartCard;
