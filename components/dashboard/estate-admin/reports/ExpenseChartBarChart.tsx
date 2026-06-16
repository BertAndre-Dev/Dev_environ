"use client";

import React, { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3 } from "lucide-react";

import {
  formatNairaCompact,
  formatNairaFull,
} from "./financial-report-chart-utils";
import {
  seriesHasExpenses,
  type ExpenseChartSeriesPoint,
} from "./expense-chart-series";

const EXPENSE_COLOR = "#739FD7";

function SkeletonBars() {
  return (
    <div className="h-[380px] w-full flex items-end justify-center gap-6 px-6 py-8">
      {[
        { key: "sk1", h: 140 },
        { key: "sk2", h: 220 },
        { key: "sk3", h: 180 },
      ].map((b) => (
        <div
          key={b.key}
          className="w-16 rounded-md bg-muted/60 animate-pulse"
          style={{ height: `${b.h}px` }}
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-[380px] w-full grid place-items-center">
      <div className="flex flex-col items-center text-center gap-2">
        <div className="h-12 w-12 rounded-xl bg-muted grid place-items-center">
          <BarChart3 className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">No data for the selected period.</p>
        <p className="text-xs text-muted-foreground">
          Try adjusting the date range or period.
        </p>
      </div>
    </div>
  );
}

function computeNiceYMax(max: number): number {
  if (max <= 0) return 1_000;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const normalized = max / magnitude;
  const nice =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return nice * magnitude;
}

export type { ExpenseChartSeriesPoint };

export interface ExpenseChartBarChartProps {
  loading: boolean;
  series: ExpenseChartSeriesPoint[];
}

export function ExpenseChartBarChart({
  loading,
  series,
}: Readonly<ExpenseChartBarChartProps>) {
  const yMax = useMemo(() => {
    let max = 0;
    for (const row of series) {
      max = Math.max(max, Number(row.value ?? 0));
    }
    return computeNiceYMax(max);
  }, [series]);

  if (loading) return <SkeletonBars />;
  if (!series.length || !seriesHasExpenses(series)) return <EmptyState />;

  const isDense = series.length > 12;
  const minWidth = isDense ? `max(100%, ${series.length * 56}px)` : "100%";
  const barSize = isDense
    ? 18
    : series.length <= 1
      ? 48
      : Math.min(40, Math.max(16, Math.floor(400 / ((series.length || 1) * 2))));

  const X_AXIS_HEIGHT = 28;
  const LEGEND_HEIGHT = 28;
  const CHART_MARGIN = {
    top: 8,
    right: 12,
    bottom: X_AXIS_HEIGHT + LEGEND_HEIGHT,
    left: 0,
  };

  const legendPayload = [
    {
      value: "Expenses",
      type: "square" as const,
      id: "value",
      color: EXPENSE_COLOR,
    },
  ];

  return (
    <div className="h-[380px]">
      <div className="flex h-full">
        <div className="w-[74px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={series}
              barSize={barSize}
              barCategoryGap="30%"
              margin={CHART_MARGIN}
            >
              <ReferenceLine y={0} stroke="#e5e7eb" />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={74}
                domain={[0, yMax]}
                tickFormatter={(v: number) => formatNairaCompact(Number(v))}
              />
              <XAxis hide dataKey="label" height={X_AXIS_HEIGHT} />
              <Legend content={() => null} height={LEGEND_HEIGHT} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-hidden cursor-pointer">
          <div style={{ minWidth }} className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={series}
                barCategoryGap={series.length <= 1 ? "20%" : 18}
                barSize={barSize}
                margin={CHART_MARGIN}
              >
                <YAxis hide domain={[0, yMax]} />
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <ReferenceLine y={0} stroke="#e5e7eb" />

                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  height={X_AXIS_HEIGHT}
                />

                <Tooltip
                  formatter={(value: number) => [
                    formatNairaFull(Number(value)),
                    "Expenses",
                  ]}
                  labelFormatter={String}
                />

                <Legend
                  verticalAlign="bottom"
                  align="center"
                  height={LEGEND_HEIGHT}
                  wrapperStyle={{ cursor: "pointer" }}
                  payload={legendPayload}
                />

                <Bar
                  dataKey="value"
                  fill={EXPENSE_COLOR}
                  radius={[6, 6, 0, 0]}
                  minPointSize={3}
                  cursor="pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
