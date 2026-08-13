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
import type { TopUser } from "@/types/analytics";

const BAR_COLOR = "#7C3AED";
const BAR_GRADIENT_ID = "topUsersAmountBarGradient";
const ROW_HEIGHT = 48;
const CHART_PADDING = 56;
const Y_AXIS_WIDTH = 128;
const NAME_MAX = 16;

type ChartRow = {
  walletId: string;
  userName: string;
  displayName: string;
  totalAmount: number;
  transactionCount: number;
  creditAmount: number;
  debitAmount: number;
};

type TopUsersChartProps = Readonly<{
  users: TopUser[];
  onBarClick?: (walletId: string) => void;
  className?: string;
}>;

function truncateName(name: string): string {
  const raw = name.trim() || "Unknown user";
  if (raw.length <= NAME_MAX) return raw;
  return `${raw.slice(0, NAME_MAX - 1)}…`;
}

function buildRows(users: TopUser[]): ChartRow[] {
  return users.map((user) => {
    const userName = String(user.userName ?? "").trim() || "Unknown user";
    return {
      walletId: user.walletId,
      userName,
      displayName: truncateName(userName),
      totalAmount: Number(user.totalAmount ?? 0),
      transactionCount: Number(user.transactionCount ?? 0),
      creditAmount: Number(user.creditAmount ?? 0),
      debitAmount: Number(user.debitAmount ?? 0),
    };
  });
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
        {row.userName}
      </p>
      <div className="mt-2 space-y-1.5">
        <TooltipRow
          label="Amount"
          value={formatTransactionAmount(row.totalAmount)}
        />
        <TooltipRow
          label="Transactions"
          value={row.transactionCount.toLocaleString()}
        />
        <TooltipRow
          label="Inflow"
          value={formatTransactionAmount(row.creditAmount)}
        />
        <TooltipRow
          label="Outflow"
          value={formatTransactionAmount(row.debitAmount)}
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

export function TopUsersChart({
  users,
  onBarClick,
  className,
}: TopUsersChartProps) {
  const rows = useMemo(() => buildRows(users), [users]);
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
          Top users
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Highest transaction volume
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
                  cursor={{ fill: "rgba(124, 58, 237, 0.06)" }}
                />
                <Bar
                  dataKey="totalAmount"
                  name="Amount"
                  fill={`url(#${BAR_GRADIENT_ID})`}
                  radius={[0, 6, 6, 0]}
                  maxBarSize={22}
                  cursor={onBarClick ? "pointer" : "default"}
                  onClick={(entry) => {
                    const row = entry as ChartRow & { payload?: ChartRow };
                    const walletId = row.walletId ?? row.payload?.walletId;
                    if (walletId && onBarClick) onBarClick(walletId);
                  }}
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
      <p className="text-sm font-medium text-foreground">No top users yet</p>
      <p className="text-xs text-muted-foreground">
        Rankings will appear when transactions are recorded.
      </p>
    </div>
  );
}

export default TopUsersChart;
