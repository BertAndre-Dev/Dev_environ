"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type BillsStatusSegmentKey = "paid" | "pending" | "overdue";

export interface BillsStatusData {
  total: number;
  paid: number;
  pending: number;
  overdue: number;
}

export interface BillsStatusDonutCardProps {
  readonly title?: string;
  readonly data: BillsStatusData;
  readonly className?: string;
  readonly loading?: boolean;
}

const SEGMENT_CONFIG: ReadonlyArray<{
  key: BillsStatusSegmentKey;
  label: string;
  fill: string;
  dotClassName: string;
}> = [
  {
    key: "paid",
    label: "Paid",
    fill: "#2D9C6C",
    dotClassName: "bg-[#2D9C6C]",
  },
  {
    key: "pending",
    label: "Pending",
    fill: "#F99C52",
    dotClassName: "bg-[#F99C52]",
  },
  {
    key: "overdue",
    label: "Overdue",
    fill: "#D94444",
    dotClassName: "bg-[#D94444]",
  },
];

type ChartSlice = {
  key: BillsStatusSegmentKey;
  name: string;
  value: number;
  fill: string;
};

function buildChartSlices(data: BillsStatusData): ChartSlice[] {
  return SEGMENT_CONFIG.map(({ key, label, fill }) => ({
    key,
    name: label,
    value: Math.max(0, data[key]),
    fill,
  })).filter((slice) => slice.value > 0);
}

type LegendPillProps = Readonly<{
  dotClassName: string;
  label: string;
  value: number;
}>;

function LegendPill({ dotClassName, label, value }: LegendPillProps) {
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
        {value.toLocaleString()}
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
      <p className="text-muted-foreground tabular-nums">
        {item.value.toLocaleString()}
      </p>
    </div>
  );
}

export function BillsStatusDonutCard({
  title = "Bills",
  data,
  className,
  loading = false,
}: BillsStatusDonutCardProps) {
  const chartData = useMemo(() => buildChartSlices(data), [data]);
  const hasChartData = chartData.some((slice) => slice.value > 0);

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
        <p className="mt-1 text-sm text-muted-foreground">
          Total Bills:{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {loading ? "—" : data.total.toLocaleString()}
          </span>
        </p>
      </div>

      <div className="px-6 py-6">
        {loading ? (
          <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : hasChartData ? (
          <ResponsiveContainer width="100%" height={220}>
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
        ) : (
          <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
            No bill status data to display
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-3">
          {SEGMENT_CONFIG.map(({ key, label, dotClassName }) => (
            <LegendPill
              key={key}
              dotClassName={dotClassName}
              label={label}
              value={loading ? 0 : data[key]}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

export default BillsStatusDonutCard;
