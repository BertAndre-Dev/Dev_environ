"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
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
import type { ChargeBreakdownItem } from "@/types/analytics";

const BAR_COLOR = "#F59E0B";
const BAR_GRADIENT_ID = "chargeBreakdownBarGradient";
const ROW_HEIGHT = 48;
const CHART_PADDING = 56;
const Y_AXIS_WIDTH = 128;
const LABEL_MAX = 16;

type ChartRow = ChargeBreakdownItem & { displayName: string };

type ChargeBreakdownChartProps = Readonly<{
  breakdown: ChargeBreakdownItem[];
  className?: string;
}>;

function truncateLabel(label: string): string {
  const raw = label.trim() || "Unknown";
  if (raw.length <= LABEL_MAX) return raw;
  return `${raw.slice(0, LABEL_MAX - 1)}…`;
}

type TooltipProps = Readonly<{
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: ChartRow }>;
}>;

function ChartTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  return (
    <div className="min-w-[180px] rounded-xl border border-border/80 bg-white px-3.5 py-3 text-sm shadow-lg dark:bg-card">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {row.chargeType || "Unknown"}
      </p>
      <div className="mt-2 space-y-1.5">
        <div className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">Amount</span>
          <span className="font-semibold tabular-nums text-foreground">
            {formatTransactionAmount(Number(row.totalAmount ?? 0))}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">Transactions</span>
          <span className="font-semibold tabular-nums text-foreground">
            {Number(row.transactionCount ?? 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ChargeBreakdownChart({
  breakdown,
  className,
}: ChargeBreakdownChartProps) {
  const rows = useMemo<ChartRow[]>(() => {
    return [...breakdown]
      .sort(
        (a, b) => Number(b.totalAmount ?? 0) - Number(a.totalAmount ?? 0),
      )
      .map((item) => ({
        ...item,
        displayName: truncateLabel(String(item.chargeType ?? "")),
      }));
  }, [breakdown]);

  const chartHeight = Math.max(
    220,
    rows.length * ROW_HEIGHT + CHART_PADDING,
  );

  return (
    <Card
      className={cn(
        "mt-0 gap-0 overflow-hidden rounded-xl border border-border bg-card p-0 shadow-sm",
        className,
      )}
    >
      <div className="border-b border-border px-5 py-5 sm:px-6">
        <h2 className="font-heading text-lg font-bold tracking-tight text-foreground sm:text-xl">
          Charge breakdown
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Totals by charge type
        </p>
      </div>
      <div className="px-5 py-5 sm:px-6 sm:pb-6">
        {rows.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ height: chartHeight }} className="w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rows}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 4, bottom: 8 }}
              >
                <defs>
                  <linearGradient
                    id={BAR_GRADIENT_ID}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop offset="0%" stopColor={BAR_COLOR} stopOpacity={0.75} />
                    <stop offset="100%" stopColor={BAR_COLOR} stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="var(--border)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tickFormatter={(v) =>
                    formatTransactionAmountCompact(Number(v))
                  }
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, "auto"]}
                />
                <YAxis
                  type="category"
                  dataKey="displayName"
                  width={Y_AXIS_WIDTH}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "rgba(245, 158, 11, 0.08)" }}
                />
                <Bar
                  dataKey="totalAmount"
                  name="Amount"
                  fill={`url(#${BAR_GRADIENT_ID})`}
                  radius={[0, 6, 6, 0]}
                  maxBarSize={22}
                />
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
    <div className="flex h-[220px] flex-col items-center justify-center gap-2 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-muted">
        <BarChart3 className="h-5 w-5 text-muted-foreground" aria-hidden />
      </div>
      <p className="text-sm font-medium text-foreground">
        No charge breakdown yet
      </p>
      <p className="text-xs text-muted-foreground">
        Charge types will appear when fees are recorded.
      </p>
    </div>
  );
}

export default ChargeBreakdownChart;
