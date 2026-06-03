"use client";

import { useId, useMemo } from "react";
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
import type { PowerUsageDataPoint } from "@/lib/power-usage-chart";
import { cn } from "@/lib/utils";

export type { PowerUsageDataPoint } from "@/lib/power-usage-chart";

export interface PowerUsageCardProps {
  readonly title?: string;
  readonly data: PowerUsageDataPoint[];
  readonly totalUsageKwh?: number;
  readonly className?: string;
  readonly loading?: boolean;
  readonly emptyMessage?: string;
}

const STROKE_COLOR = "#0150AC";
const FILL_COLOR = "#0150AC";

function formatYAxisTick(value: number): string {
  if (value === 0) return "0";
  return `${value} kWh`;
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
      <p className="text-muted-foreground tabular-nums">{kwh} kWh</p>
    </div>
  );
}

function computeYAxisMax(points: PowerUsageDataPoint[]): number {
  const maxUsage = Math.max(0, ...points.map((p) => p.usageKwh));
  if (maxUsage === 0) return 250;
  const step = 50;
  return Math.ceil(maxUsage / step) * step;
}

export function PowerUsageCard({
  title = "Power Usage",
  data,
  totalUsageKwh,
  className,
  loading = false,
  emptyMessage = "No power usage data to display",
}: PowerUsageCardProps) {
  const gradientId = useId().replaceAll(":", "");

  const resolvedTotal = useMemo(() => {
    if (typeof totalUsageKwh === "number") return totalUsageKwh;
    return Math.round(data.reduce((sum, p) => sum + p.usageKwh, 0));
  }, [data, totalUsageKwh]);

  const yMax = useMemo(() => computeYAxisMax(data), [data]);
  const hasChartData = data.length > 0;

  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let v = 0; v <= yMax; v += 50) {
      ticks.push(v);
    }
    return ticks;
  }, [yMax]);

  return (
    <Card
      className={cn(
        "mt-0 gap-0 overflow-hidden rounded-xl border border-border bg-card p-0 shadow-sm",
        className,
      )}
    >
      <div className="border-b border-border px-6 py-5">
        <h2 className="font-heading text-2xl font-bold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Total Usage:{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {loading ? "—" : `${resolvedTotal.toLocaleString()} kWh`}
          </span>
        </p>
      </div>

      <div className="px-4 py-4 sm:px-6 sm:py-6">
        {loading ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : hasChartData ? (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 12, right: 12, left: 4, bottom: 8 }}
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={FILL_COLOR} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={FILL_COLOR} stopOpacity={0.04} />
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
                  width={56}
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
        ) : (
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        )}
      </div>
    </Card>
  );
}

export default PowerUsageCard;
