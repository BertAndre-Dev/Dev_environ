"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  formatTransactionAmount,
  formatTransactionAmountCompact,
  hasTransactionSummaryData,
  mapTransactionSummaryToBarChart,
  type TransactionSummaryData,
} from "@/lib/transaction-summary-chart";

export type { TransactionSummaryData };

const BAR_COLOR = "#D0DFF2";
const BAR_COLOR_HIGHLIGHT = "#0150AC";

export interface TransactionSummaryCardProps {
  readonly title?: string;
  readonly data: TransactionSummaryData;
  readonly loading?: boolean;
  readonly emptyMessage?: string;
  readonly className?: string;
}

type SummaryStatProps = Readonly<{
  label: string;
  value: string;
  loading?: boolean;
}>;

function SummaryStat({ label, value, loading }: SummaryStatProps) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
        {loading ? "—" : value}
      </p>
    </div>
  );
}

type ChartTooltipProps = Readonly<{
  active?: boolean;
  payload?: ReadonlyArray<{
    value?: number;
    payload?: { label?: string; count?: number };
  }>;
}>;

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  const amount = payload[0]?.value ?? 0;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{point?.label ?? "Amount"}</p>
      <p className="tabular-nums text-foreground">
        {formatTransactionAmount(amount)}
      </p>
      {typeof point?.count === "number" ? (
        <p className="text-muted-foreground">
          {point.count.toLocaleString()} transaction
          {point.count === 1 ? "" : "s"}
        </p>
      ) : null}
    </div>
  );
}

export function TransactionSummaryCard({
  title = "Transaction Summary",
  data,
  loading = false,
  emptyMessage = "No transaction data to display",
  className,
}: TransactionSummaryCardProps) {
  const chartData = useMemo(() => mapTransactionSummaryToBarChart(data), [data]);
  const hasData = hasTransactionSummaryData(data);

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
          Credit vs debit amounts
        </p>
      </div>

      <div className="px-6 py-6">
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryStat
            label="Total transactions"
            value={data.totalTransactions.toLocaleString()}
            loading={loading}
          />
          <SummaryStat
            label="Net flow"
            value={formatTransactionAmount(data.netFlow)}
            loading={loading}
          />
          <SummaryStat
            label="Total credits"
            value={formatTransactionAmount(data.totalCredits)}
            loading={loading}
          />
          <SummaryStat
            label="Total debits"
            value={formatTransactionAmount(data.totalDebits)}
            loading={loading}
          />
        </div>

        {loading ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : hasData && chartData.length > 0 ? (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={formatTransactionAmountCompact}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                />
                <Tooltip content={<ChartTooltip />} cursor={false} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={72}>
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.label}
                      fill={
                        entry.highlighted ? BAR_COLOR_HIGHLIGHT : BAR_COLOR
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <SummaryStat
            label="Credit transactions"
            value={data.creditTransactions.toLocaleString()}
            loading={loading}
          />
          <SummaryStat
            label="Debit transactions"
            value={data.debitTransactions.toLocaleString()}
            loading={loading}
          />
          <SummaryStat
            label="Paid transactions"
            value={data.paidTransactions.toLocaleString()}
            loading={loading}
          />
        </div>
      </div>
    </Card>
  );
}

export default TransactionSummaryCard;
