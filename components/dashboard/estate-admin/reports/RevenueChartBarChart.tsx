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
  getActiveSegmentKeys,
  seriesHasRevenue,
  type RevenueChartSeriesPoint,
} from "./revenue-chart-series";

const SEGMENT_COLORS: Record<string, string> = {
  vending: "#0150AC",
  bills: "#A7C5E8",
  Other: "#2E9E6B",
  value: "#0150AC",
};

const HEAD_PALETTE = [
  "#2E9E6B",
  "#E67E22",
  "#8E44AD",
  "#16A085",
  "#C0392B",
  "#2980B9",
] as const;

function colorForSegment(key: string, index: number): string {
  if (SEGMENT_COLORS[key]) return SEGMENT_COLORS[key];
  return HEAD_PALETTE[index % HEAD_PALETTE.length];
}

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

function toChartRows(
  series: RevenueChartSeriesPoint[],
  segmentKeys: string[],
  singleHead: boolean,
) {
  return series.map((point) => {
    const row: Record<string, string | number> = {
      key: point.key,
      label: point.label,
      value: point.value,
    };

    if (singleHead) return row;

    for (const key of segmentKeys) {
      row[key] = Number(point.segments[key] ?? 0);
    }
    return row;
  });
}

export type { RevenueChartSeriesPoint };

export interface RevenueChartBarChartProps {
  loading: boolean;
  series: RevenueChartSeriesPoint[];
  singleHead?: boolean;
}

export function RevenueChartBarChart({
  loading,
  series,
  singleHead = false,
}: Readonly<RevenueChartBarChartProps>) {
  const activeSegments = useMemo(
    () => getActiveSegmentKeys(series),
    [series],
  );

  const segmentKeys = useMemo(
    () => activeSegments.map((s) => s.key),
    [activeSegments],
  );

  const chartRows = useMemo(
    () => toChartRows(series, segmentKeys, singleHead),
    [series, segmentKeys, singleHead],
  );

  const legendPayload = useMemo(() => {
    if (singleHead) {
      return [
        {
          value: "Revenue",
          type: "square" as const,
          id: "value",
          color: SEGMENT_COLORS.value,
        },
      ];
    }
    return activeSegments.map((seg, i) => ({
      value: seg.label,
      type: "square" as const,
      id: seg.key,
      color: colorForSegment(seg.key, i),
    }));
  }, [activeSegments, singleHead]);

  const labelByKey = useMemo(() => {
    const map = new Map<string, string>();
    for (const seg of activeSegments) {
      map.set(seg.key, seg.label);
    }
    map.set("value", "Revenue");
    return map;
  }, [activeSegments]);

  const yMax = useMemo(() => {
    let max = 0;
    for (const row of chartRows) {
      max = Math.max(max, Number(row.value ?? 0));
    }
    return computeNiceYMax(max);
  }, [chartRows]);

  if (loading) return <SkeletonBars />;
  if (!series.length || !seriesHasRevenue(series)) return <EmptyState />;

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

  const useStack = !singleHead && segmentKeys.length > 0;

  return (
    <div className="h-[380px]">
      <div className="flex h-full">
        <div className="w-[74px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartRows}
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
                data={chartRows}
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
                  formatter={(value: number, name: string) => [
                    formatNairaFull(Number(value)),
                    labelByKey.get(name) ?? name,
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

                {singleHead ? (
                  <Bar
                    dataKey="value"
                    fill={SEGMENT_COLORS.value}
                    radius={[6, 6, 0, 0]}
                    minPointSize={3}
                    cursor="pointer"
                  />
                ) : (
                  segmentKeys.map((key, index) => {
                    const isTop = index === segmentKeys.length - 1;
                    const isBottom = index === 0;
                    return (
                      <Bar
                        key={key}
                        dataKey={key}
                        stackId={useStack ? "revenue-stack" : undefined}
                        fill={colorForSegment(key, index)}
                        radius={
                          useStack
                            ? isTop
                              ? [6, 6, 0, 0]
                              : isBottom
                                ? [0, 0, 0, 0]
                                : [0, 0, 0, 0]
                            : [6, 6, 0, 0]
                        }
                        minPointSize={3}
                        cursor="pointer"
                      />
                    );
                  })
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
