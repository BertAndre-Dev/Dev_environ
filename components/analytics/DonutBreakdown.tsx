"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type DonutSlice = {
  name: string;
  value: number;
  fill: string;
};

type DonutBreakdownProps = Readonly<{
  title: string;
  slices: DonutSlice[];
  centerLabel: string;
  centerSubLabel?: string;
  formatValue?: (value: number) => string;
  emptyMessage?: string;
  emptyDescription?: string;
  className?: string;
  chartHeight?: number;
  /** Donut ring thickness — higher values produce a wider ring. */
  ringWidth?: number;
}>;

type ChartSlice = DonutSlice & { key: string };

type DonutTooltipProps = Readonly<{
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: ChartSlice }>;
  formatValue: (value: number) => string;
}>;

function DonutTooltip({ active, payload, formatValue }: DonutTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{item.name}</p>
      <p className="tabular-nums text-muted-foreground">
        {formatValue(item.value)}
      </p>
    </div>
  );
}

function defaultFormatValue(value: number): string {
  return value.toLocaleString();
}

export function DonutBreakdown({
  title,
  slices,
  centerLabel,
  centerSubLabel = "Total",
  formatValue = defaultFormatValue,
  emptyMessage = "No data this period",
  emptyDescription,
  className,
  chartHeight = 280,
  ringWidth = 36,
}: DonutBreakdownProps) {
  const visibleSlices = useMemo(
    () => slices.filter((slice) => slice.value > 0),
    [slices],
  );

  const chartData = useMemo<ChartSlice[]>(
    () =>
      visibleSlices.map((slice, index) => ({
        ...slice,
        key: `${slice.name}-${index}`,
      })),
    [visibleSlices],
  );

  const total = useMemo(
    () => slices.reduce((sum, slice) => sum + Math.max(0, slice.value), 0),
    [slices],
  );

  const isEmpty = total === 0;

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-background/60 p-4 shadow-sm",
        className,
      )}
    >
      <h3 className="font-heading text-base font-semibold text-foreground">
        {title}
      </h3>

      {isEmpty ? (
        <div
          className="flex flex-col items-center justify-center gap-2 text-center"
          style={{ minHeight: chartHeight }}
        >
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-muted">
            <PieChartIcon className="h-5 w-5 text-muted-foreground" aria-hidden />
          </div>
          <p className="text-sm font-medium text-foreground">{emptyMessage}</p>
          {emptyDescription ? (
            <p className="text-xs text-muted-foreground">{emptyDescription}</p>
          ) : null}
        </div>
      ) : (
        <>
          <div className="relative w-full" style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  dataKey="value"
                  nameKey="name"
                  innerRadius={`${Math.max(40, 100 - ringWidth * 2 - 8)}%`}
                  outerRadius="96%"
                  paddingAngle={chartData.length > 1 ? 4 : 0}
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.key} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  content={
                    <DonutTooltip formatValue={formatValue} />
                  }
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <p className="text-xs text-muted-foreground">{centerSubLabel}</p>
              <p className="mt-0.5 text-xl font-bold tabular-nums text-foreground sm:text-2xl">
                {centerLabel}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {slices.map((slice) => {
              const percent =
                total > 0 ? (Math.max(0, slice.value) / total) * 100 : 0;
              return (
                <div
                  key={slice.name}
                  className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: slice.fill }}
                      aria-hidden
                    />
                    <span className="truncate text-sm text-muted-foreground">
                      {slice.name}
                    </span>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                    {formatValue(slice.value)}
                    <span className="ml-1.5 font-normal text-muted-foreground">
                      · {percent.toFixed(1)}%
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default DonutBreakdown;
