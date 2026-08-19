"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatTransactionAmount } from "@/lib/transaction-summary-chart";
import type { PlatformFeePieSlice } from "@/types/analytics";

const SLICE_COLORS = [
  "#0150AC",
  "#2D9C6C",
  "#F99C52",
  "#7C3AED",
  "#739FD7",
  "#D94444",
  "#A7C5E8",
  "#F59E0B",
] as const;

type ChartSlice = PlatformFeePieSlice & {
  fill: string;
};

type PlatformFeeSourceChartProps = Readonly<{
  slices: PlatformFeePieSlice[];
  className?: string;
}>;

function colorForIndex(index: number): string {
  return SLICE_COLORS[index % SLICE_COLORS.length];
}

type DonutTooltipProps = Readonly<{
  active?: boolean;
  payload?: ReadonlyArray<{
    payload?: ChartSlice;
  }>;
}>;

function DonutTooltip({ active, payload }: DonutTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{item.label}</p>
      <p className="tabular-nums text-muted-foreground">
        {formatTransactionAmount(Number(item.value ?? 0))}
      </p>
    </div>
  );
}

export function PlatformFeeSourceChart({
  slices,
  className,
}: PlatformFeeSourceChartProps) {
  const chartData = useMemo<ChartSlice[]>(
    () =>
      slices.map((slice, index) => ({
        ...slice,
        fill: colorForIndex(index),
      })),
    [slices],
  );

  const total = useMemo(
    () => chartData.reduce((sum, slice) => sum + Number(slice.value ?? 0), 0),
    [chartData],
  );

  return (
    <Card
      className={cn(
        "mt-0 gap-0 overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card to-blue-50/70 p-0 shadow-sm dark:to-blue-950/20",
        className,
      )}
    >
      <div className="border-b border-border px-6 py-5">
        <h2 className="font-heading text-lg font-bold text-foreground sm:text-xl">
          Fee sources
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Settled fees by source
        </p>
      </div>

      {chartData.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col items-center justify-center px-4 py-5 sm:px-5">
          <div className="relative h-[280px] w-full rounded-xl bg-white/70 dark:bg-black/20">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  dataKey="value"
                  nameKey="label"
                  innerRadius="52%"
                  outerRadius="96%"
                  paddingAngle={chartData.length > 1 ? 4 : 0}
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`${entry.label}-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="mt-0.5 text-lg font-bold tabular-nums text-foreground sm:text-xl">
                {formatTransactionAmount(total)}
              </p>
            </div>
          </div>

          <div className="mt-4 flex w-full flex-col gap-2">
            {chartData.map((slice, index) => (
              <div
                key={`${slice.label}-${index}`}
                className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: slice.fill }}
                    aria-hidden
                  />
                  <span className="truncate text-sm text-muted-foreground">
                    {slice.label}
                  </span>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                  {formatTransactionAmount(Number(slice.value ?? 0))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex h-[280px] flex-col items-center justify-center gap-2 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-muted">
        <PieChartIcon className="h-5 w-5 text-muted-foreground" aria-hidden />
      </div>
      <p className="text-sm font-medium text-foreground">No source breakdown</p>
      <p className="text-xs text-muted-foreground">
        Settled fees will appear here when recorded.
      </p>
    </div>
  );
}

export default PlatformFeeSourceChart;
