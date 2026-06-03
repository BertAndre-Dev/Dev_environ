"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type OccupancySegmentKey = "occupied" | "vacant";

export interface OccupancyDistributionData {
  totalResidents: number;
  occupiedPercentage: number;
  vacantPercentage: number;
}

export interface OccupancyDistributionDonutCardProps {
  readonly title?: string;
  readonly data: OccupancyDistributionData;
  readonly className?: string;
  readonly loading?: boolean;
  readonly primaryLabel?: string;
  readonly secondaryLabel?: string;
  readonly emptyMessage?: string;
}

const DEFAULT_SEGMENT_CONFIG: ReadonlyArray<{
  key: OccupancySegmentKey;
  label: string;
  fill: string;
  dotClassName: string;
}> = [
  {
    key: "occupied",
    label: "Occupied",
    fill: "#0052B4",
    dotClassName: "bg-[#0052B4]",
  },
  {
    key: "vacant",
    label: "Vacant",
    fill: "#A3C2E8",
    dotClassName: "bg-[#A3C2E8]",
  },
];

function resolveSegmentConfig(
  primaryLabel?: string,
  secondaryLabel?: string,
): typeof DEFAULT_SEGMENT_CONFIG {
  return DEFAULT_SEGMENT_CONFIG.map((segment) => {
    if (segment.key === "occupied" && primaryLabel) {
      return { ...segment, label: primaryLabel };
    }
    if (segment.key === "vacant" && secondaryLabel) {
      return { ...segment, label: secondaryLabel };
    }
    return segment;
  });
}

type ChartSlice = {
  key: OccupancySegmentKey;
  name: string;
  value: number;
  fill: string;
};

function buildChartSlices(
  data: OccupancyDistributionData,
  segmentConfig: typeof DEFAULT_SEGMENT_CONFIG,
): ChartSlice[] {
  const segments: Array<{ key: OccupancySegmentKey; value: number }> = [
    { key: "occupied", value: Math.max(0, data.occupiedPercentage) },
    { key: "vacant", value: Math.max(0, data.vacantPercentage) },
  ];

  return segmentConfig.map(({ key, label, fill }) => {
    const segment = segments.find((s) => s.key === key);
    return {
      key,
      name: label,
      value: segment?.value ?? 0,
      fill,
    };
  }).filter((slice) => slice.value > 0);
}

type LegendPillProps = Readonly<{
  dotClassName: string;
  label: string;
  value: number;
  loading?: boolean;
}>;

function LegendPill({ dotClassName, label, value, loading }: LegendPillProps) {
  return (
    <div className="flex min-w-30 flex-1 items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={cn("size-2.5 shrink-0 rounded-full", dotClassName)}
          aria-hidden
        />
        <span className="truncate text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
        {loading ? "—" : `${value}%`}
      </span>
    </div>
  );
}

type DonutTooltipProps = Readonly<{
  active?: boolean;
  payload?: ReadonlyArray<{ name?: string; value?: number; payload?: ChartSlice }>;
}>;

function DonutTooltip({ active, payload }: DonutTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{item.name}</p>
      <p className="text-muted-foreground tabular-nums">{item.value}%</p>
    </div>
  );
}

export function OccupancyDistributionDonutCard({
  title = "Occupancy Distribution",
  data,
  className,
  loading = false,
  primaryLabel,
  secondaryLabel,
  emptyMessage = "No occupancy data to display",
}: OccupancyDistributionDonutCardProps) {
  const segmentConfig = useMemo(
    () => resolveSegmentConfig(primaryLabel, secondaryLabel),
    [primaryLabel, secondaryLabel],
  );
  const chartData = useMemo(
    () => buildChartSlices(data, segmentConfig),
    [data, segmentConfig],
  );
  const hasChartData = chartData.some((slice) => slice.value > 0);
  const segmentPercentages: Record<OccupancySegmentKey, number> = {
    occupied: data.occupiedPercentage,
    vacant: data.vacantPercentage,
  };

  return (
    <Card
      className={cn(
        "mt-0 gap-0 overflow-hidden rounded-xl border border-border bg-card p-0 shadow-sm",
        className,
      )}
    >
      <div className="border-b border-border px-6 py-5">
        <h2 className="font-heading text-2xl font-bold text-foreground">
          {title}
        </h2>
      </div>

      <div className="px-6 py-6">
        {loading ? (
          <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : hasChartData ? (
          <div className="relative h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  dataKey="value"
                  nameKey="name"
                  innerRadius="58%"
                  outerRadius="88%"
                  paddingAngle={4}
                  cornerRadius={8}
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.key} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <p className="text-xs text-muted-foreground">Total residents</p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums text-foreground">
                {data.totalResidents.toLocaleString()}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-3">
          {segmentConfig.map(({ key, label, dotClassName }) => (
            <LegendPill
              key={key}
              dotClassName={dotClassName}
              label={label}
              value={segmentPercentages[key]}
              loading={loading}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

export default OccupancyDistributionDonutCard;
