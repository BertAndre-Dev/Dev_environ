"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatTransactionAmount } from "@/lib/transaction-summary-chart";
import type { TrendPoint } from "@/types/analytics";

const TREND_COLOR = "#7C3AED";
const TREND_GRADIENT_ID = "transactionTrendAreaGradient";

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

type ChartRow = TrendPoint & { label: string };

type TransactionTrendChartProps = Readonly<{
  series: TrendPoint[];
  className?: string;
}>;

function formatShortDay(period: string): string {
  const raw = String(period ?? "").trim();
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  const month = MONTH_SHORT[d.getUTCMonth()];
  const day = d.getUTCDate();
  return `${month} ${day}`;
}

function buildRows(series: TrendPoint[]): ChartRow[] {
  return series.map((point) => ({
    ...point,
    label: formatShortDay(point.period),
  }));
}

type TooltipProps = Readonly<{
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: ChartRow }>;
  label?: string;
}>;

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  return (
    <div className="min-w-[180px] rounded-xl border border-border/80 bg-white px-3.5 py-3 text-sm shadow-lg dark:bg-card">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 space-y-1.5">
        <TooltipRow
          label="Transactions"
          value={Number(row.transactionCount ?? 0).toLocaleString()}
        />
        <TooltipRow
          label="Amount"
          value={formatTransactionAmount(Number(row.totalAmount ?? 0))}
        />
        <TooltipRow
          label="Inflow"
          value={Number(row.creditCount ?? 0).toLocaleString()}
        />
        <TooltipRow
          label="Outflow"
          value={Number(row.debitCount ?? 0).toLocaleString()}
        />
      </div>
    </div>
  );
}

function TooltipRow({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );
}

export function TransactionTrendChart({
  series,
  className,
}: TransactionTrendChartProps) {
  const rows = useMemo(() => buildRows(series), [series]);
  const tickInterval =
    rows.length > 20 ? Math.ceil(rows.length / 10) - 1 : 0;

  return (
    <Card
      className={cn(
        "mt-0 gap-0 overflow-hidden rounded-xl border border-border bg-card p-0 shadow-sm",
        className,
      )}
    >
      <div className="border-b border-border px-5 py-5 sm:px-6">
        <h2 className="font-heading text-lg font-bold tracking-tight text-foreground sm:text-xl">
          Transaction trend
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Daily transaction count
        </p>
      </div>

      <div className="py-5 sm:pb-6">
        {rows.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={rows}
                margin={{ top: 12, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id={TREND_GRADIENT_ID}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={TREND_COLOR}
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="100%"
                      stopColor={TREND_COLOR}
                      stopOpacity={0.04}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
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
                  dataKey="transactionCount"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                  domain={[0, "auto"]}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ stroke: "#CBD5E1", strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="transactionCount"
                  name="Transactions"
                  stroke={TREND_COLOR}
                  strokeWidth={2.5}
                  fill={`url(#${TREND_GRADIENT_ID})`}
                  dot={{
                    r: 4,
                    fill: TREND_COLOR,
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 6,
                    fill: TREND_COLOR,
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                  animationDuration={700}
                  isAnimationActive
                />
              </AreaChart>
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
      <p className="text-sm font-medium text-foreground">
        No transaction trend yet
      </p>
      <p className="text-xs text-muted-foreground">
        Daily counts will appear when transactions are recorded.
      </p>
    </div>
  );
}

export default TransactionTrendChart;
