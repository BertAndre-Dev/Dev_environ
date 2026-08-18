"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  formatTransactionAmount,
  formatTransactionAmountCompact,
} from "@/lib/transaction-summary-chart";
import type { PlatformFeeBarChart } from "@/types/analytics";

const SERIES_COLORS = [
  "#0150AC",
  "#2D9C6C",
  "#F99C52",
  "#7C3AED",
  "#739FD7",
  "#D94444",
  "#A7C5E8",
  "#F59E0B",
] as const;

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

type ChartRow = {
  category: string;
  [seriesName: string]: string | number;
};

type PlatformFeeTrendChartProps = Readonly<{
  barChart: PlatformFeeBarChart;
  className?: string;
}>;

function formatMonthCategory(raw: string): string | null {
  const match = /^(\d{4})-(\d{2})$/.exec(raw.trim());
  if (!match) return null;
  const month = MONTH_SHORT[Number(match[2]) - 1];
  if (!month) return null;
  return `${month} ${match[1]}`;
}

function formatWeekCategory(raw: string): string | null {
  const weekMatch = /^(\d{4})-W(\d{1,2})$/i.exec(raw.trim());
  if (weekMatch) {
    return `W${Number(weekMatch[2])} ${weekMatch[1]}`;
  }
  return null;
}

function formatDayCategory(raw: string): string {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  const month = MONTH_SHORT[d.getUTCMonth()];
  return `${month} ${d.getUTCDate()}`;
}

function formatCategory(
  category: string,
  granularity: PlatformFeeBarChart["granularity"],
): string {
  const raw = String(category ?? "").trim();
  if (!raw) return "—";
  if (granularity === "month") {
    return formatMonthCategory(raw) ?? raw;
  }
  if (granularity === "week") {
    return formatWeekCategory(raw) ?? formatDayCategory(raw);
  }
  return formatDayCategory(raw);
}

function buildRows(barChart: PlatformFeeBarChart): ChartRow[] {
  const series = barChart.series ?? [];
  return (barChart.categories ?? []).map((category, index) => {
    const row: ChartRow = {
      category: formatCategory(category, barChart.granularity),
    };
    for (const item of series) {
      row[item.name] = Number(item.data?.[index] ?? 0);
    }
    return row;
  });
}

type TooltipProps = Readonly<{
  active?: boolean;
  payload?: ReadonlyArray<{
    name?: string;
    value?: number;
    color?: string;
  }>;
  label?: string;
}>;

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-[180px] rounded-xl border border-border/80 bg-white px-3.5 py-3 text-sm shadow-lg dark:bg-card">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 space-y-1.5">
        {payload.map((entry) => (
          <div
            key={entry.name}
            className="flex items-center justify-between gap-6"
          >
            <span className="flex items-center gap-2 text-muted-foreground">
              <span
                className="size-2 shrink-0 rounded-sm"
                style={{ backgroundColor: entry.color }}
                aria-hidden
              />
              {entry.name}
            </span>
            <span className="font-semibold tabular-nums text-foreground">
              {formatTransactionAmount(Number(entry.value ?? 0))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PlatformFeeTrendChart({
  barChart,
  className,
}: PlatformFeeTrendChartProps) {
  const series = barChart.series ?? [];
  const rows = useMemo(() => buildRows(barChart), [barChart]);
  const tickInterval = rows.length > 20 ? Math.ceil(rows.length / 10) - 1 : 0;

  return (
    <Card
      className={cn(
        "mt-0 gap-0 overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card to-violet-50/70 p-0 shadow-sm dark:to-violet-950/20",
        className,
      )}
    >
      <div className="border-b border-border px-5 py-5 sm:px-6">
        <h2 className="font-heading text-lg font-bold tracking-tight text-foreground sm:text-xl">
          Fee trend
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Settled fees over time
        </p>
      </div>

      <div className="py-5 sm:pb-6">
        {rows.length === 0 || series.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mx-4 h-[300px] rounded-xl bg-white/70 dark:bg-black/20 sm:mx-5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rows}
                margin={{ top: 12, right: 8, left: 4, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  interval={tickInterval}
                  padding={
                    rows.length === 1
                      ? { left: 40, right: 40 }
                      : { left: 8, right: 8 }
                  }
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  domain={[0, "auto"]}
                  tickFormatter={(value: number) =>
                    formatTransactionAmountCompact(Number(value))
                  }
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "rgba(1, 80, 172, 0.06)" }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  iconType="square"
                  iconSize={10}
                />
                {series.map((item, index) => (
                  <Bar
                    key={item.name}
                    dataKey={item.name}
                    name={item.name}
                    stackId="fees"
                    fill={SERIES_COLORS[index % SERIES_COLORS.length]}
                    maxBarSize={36}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex h-[280px] flex-col items-center justify-center gap-2 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-muted">
        <BarChart3 className="h-5 w-5 text-muted-foreground" aria-hidden />
      </div>
      <p className="text-sm font-medium text-foreground">No fee trend yet</p>
      <p className="text-xs text-muted-foreground">
        Trend data will appear when settled fees are recorded.
      </p>
    </div>
  );
}

export default PlatformFeeTrendChart;
