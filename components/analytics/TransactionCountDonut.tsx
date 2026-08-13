"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TransactionSummary } from "@/types/analytics";

/** Success/teal — same paid/credit token as bills-status donut. */
const CREDIT_FILL = "#2D9C6C";
/** Warning/coral — same pending token as bills-status donut. */
const DEBIT_FILL = "#F99C52";

type TransactionCountDonutProps = Readonly<{
  data: TransactionSummary;
  className?: string;
}>;

type ChartSlice = {
  key: "credit" | "debit" | "empty";
  name: string;
  value: number;
  fill: string;
};

type LegendPillProps = Readonly<{
  color: string;
  label: string;
  value: number;
}>;

function LegendPill({ color, label, value }: LegendPillProps) {
  return (
    <div className="flex min-w-30 flex-1 items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
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
  payload?: ReadonlyArray<{
    name?: string;
    value?: number;
    payload?: ChartSlice;
  }>;
}>;

function DonutTooltip({ active, payload }: DonutTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item || item.key === "empty") return null;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{item.name}</p>
      <p className="tabular-nums text-muted-foreground">
        {item.value.toLocaleString()}
      </p>
    </div>
  );
}

export function TransactionCountDonut({
  data,
  className,
}: TransactionCountDonutProps) {
  const creditCount = Math.max(0, Number(data.creditTransactions ?? 0));
  const debitCount = Math.max(0, Number(data.debitTransactions ?? 0));
  const total = Number(data.totalTransactions ?? 0);

  const chartData = useMemo<ChartSlice[]>(() => {
    const slices: ChartSlice[] = [
      {
        key: "credit",
        name: "Inflow",
        value: creditCount,
        fill: CREDIT_FILL,
      },
      {
        key: "debit",
        name: "Outflow",
        value: debitCount,
        fill: DEBIT_FILL,
      },
    ];
    const visible = slices.filter((slice) => slice.value > 0);
    if (visible.length > 0) return visible;

    return [
      {
        key: "empty",
        name: "None",
        value: 1,
        fill: "var(--muted)",
      },
    ];
  }, [creditCount, debitCount]);

  return (
    <Card
      className={cn(
        "mt-0 gap-0 overflow-hidden rounded-xl border border-border bg-card p-0 shadow-sm",
        className,
      )}
    >
      <div className="border-b border-border px-6 py-5">
        <h2 className="font-heading text-lg font-bold text-foreground sm:text-xl">
          Transaction count
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Inflow vs outflow transactions
        </p>
      </div>

      <div className="flex flex-col items-center justify-center px-6 py-6">
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
                paddingAngle={chartData.length > 1 ? 4 : 0}
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
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="mt-0.5 text-2xl font-bold tabular-nums text-foreground">
              {total.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-4 flex w-full flex-col gap-2 sm:flex-row sm:gap-3">
          <LegendPill
            color={CREDIT_FILL}
            label="Inflow"
            value={creditCount}
          />
          <LegendPill
            color={DEBIT_FILL}
            label="Outflow"
            value={debitCount}
          />
        </div>
      </div>
    </Card>
  );
}

export default TransactionCountDonut;
