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
import { AlertCircle, BarChart3, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  CompanyGenerateFinancialReportEstateRef,
  CompanyGenerateFinancialReportExpenseHead,
} from "@/types/analytics";
import {
  aggregateExpensesByHead,
  formatFinancialReportCurrency,
} from "@/lib/company-overview-financial-report";

/** Distinct palette so each expense head reads as its own series. */
const HEAD_BAR_COLORS = [
  "#0EA5E9", // sky
  "#8B5CF6", // violet
  "#F59E0B", // amber
  "#EC4899", // pink
  "#14B8A6", // teal
  "#F97316", // orange
  "#6366F1", // indigo
  "#84CC16", // lime
  "#EF4444", // red
  "#06B6D4", // cyan
] as const;

type HeadBarRow = {
  headName: string;
  totalAmount: number;
  fill: string;
  byEstate: { estateId: string; amount: number; estateName: string }[];
};

function formatNairaCompact(value: number): string {
  const n = Number(value ?? 0);
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  const fmt = (v: number) => {
    const s = v.toFixed(v >= 100 ? 0 : 1);
    return s.endsWith(".0") ? s.slice(0, -2) : s;
  };
  if (abs >= 1_000_000_000) return `₦${sign}${fmt(abs / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `₦${sign}${fmt(abs / 1_000_000)}M`;
  if (abs >= 1_000) return `₦${sign}${fmt(abs / 1_000)}K`;
  return formatFinancialReportCurrency(n);
}

type TooltipProps = Readonly<{
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: HeadBarRow }>;
  label?: string;
}>;

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="min-w-[220px] max-w-[280px] rounded-xl border border-border/80 bg-white px-3.5 py-3 text-sm shadow-lg dark:bg-card">
      <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <span
          className="size-2.5 rounded-full"
          style={{ backgroundColor: row.fill }}
          aria-hidden
        />
        {label}
      </p>
      <div className="mt-2 flex items-center justify-between gap-6">
        <span className="text-muted-foreground">Total</span>
        <span className="font-semibold tabular-nums text-foreground">
          {formatFinancialReportCurrency(row.totalAmount)}
        </span>
      </div>
      {row.byEstate.length > 0 ? (
        <div className="mt-2 space-y-1 border-t border-border/60 pt-2">
          {row.byEstate.map((e) => (
            <div
              key={`${row.headName}-${e.estateId}`}
              className="flex items-center justify-between gap-4 text-xs"
            >
              <span className="truncate text-muted-foreground">
                {e.estateName}
              </span>
              <span className="shrink-0 tabular-nums text-foreground">
                {formatFinancialReportCurrency(e.amount)}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

type CompanyFinancialReportExpensesByHeadChartProps = Readonly<{
  byHead: CompanyGenerateFinancialReportExpenseHead[];
  estatesIncluded: CompanyGenerateFinancialReportEstateRef[];
  loading?: boolean;
  error?: string | null;
  onRetry: () => void;
  className?: string;
}>;

export function CompanyFinancialReportExpensesByHeadChart({
  byHead,
  estatesIncluded,
  loading = false,
  error = null,
  onRetry,
  className,
}: CompanyFinancialReportExpensesByHeadChartProps) {
  const estateNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of estatesIncluded) {
      map.set(e.id, e.name);
    }
    return map;
  }, [estatesIncluded]);

  const rows = useMemo<HeadBarRow[]>(() => {
    return aggregateExpensesByHead(byHead).map((agg, index) => ({
      headName: agg.headName,
      totalAmount: agg.totalAmount,
      fill: HEAD_BAR_COLORS[index % HEAD_BAR_COLORS.length],
      byEstate: agg.byEstate.map((e) => ({
        ...e,
        estateName: estateNameById.get(e.estateId) ?? e.estateId,
      })),
    }));
  }, [byHead, estateNameById]);

  const chartHeight = Math.max(220, rows.length * 36 + 48);
  const showError = Boolean(error) && rows.length === 0 && !loading;
  const showEmpty = !loading && !error && rows.length === 0;

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Expenses by head
        </h3>
        <p className="text-xs text-muted-foreground">
          Aggregated across estates; tooltip shows estate breakdown.
        </p>
      </div>

      {showError ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : showEmpty ? (
        <EmptyState />
      ) : loading && rows.length === 0 ? (
        <ChartSkeleton />
      ) : (
        <div
          className={cn("relative w-full", loading && "opacity-60")}
          style={{ height: chartHeight }}
        >
          {loading ? (
            <ChartSkeleton className="absolute inset-0 z-10 bg-card/50" />
          ) : null}
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rows}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 4, bottom: 8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                className="stroke-border/60"
              />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                tickFormatter={(v: number) => formatNairaCompact(v)}
              />
              <YAxis
                type="category"
                dataKey="headName"
                width={110}
                tickLine={false}
                axisLine={false}
                interval={0}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
              <Tooltip
                cursor={{ fill: "rgba(14, 165, 233, 0.08)" }}
                content={<ChartTooltip />}
              />
              <Bar
                dataKey="totalAmount"
                radius={[0, 10, 10, 0]}
                barSize={20}
                isAnimationActive={!loading}
              >
                {rows.map((row) => (
                  <Cell key={row.headName} fill={row.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-muted">
        <BarChart3 className="h-5 w-5 text-muted-foreground" aria-hidden />
      </div>
      <p className="text-sm font-medium text-foreground">No expense heads</p>
      <p className="text-xs text-muted-foreground">
        No expenses recorded for this period.
      </p>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: Readonly<{ message: string | null; onRetry: () => void }>) {
  return (
    <div className="flex h-[200px] flex-col items-center justify-center gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" aria-hidden />
      <p className="font-medium text-foreground">Couldn&apos;t load expenses</p>
      <p className="max-w-md text-sm text-muted-foreground">
        {message ?? "Something went wrong. Please try again."}
      </p>
      <Button variant="outline" size="sm" className="gap-2" onClick={onRetry}>
        <RefreshCw className="h-4 w-4" aria-hidden />
        Retry
      </Button>
    </div>
  );
}

function ChartSkeleton({ className }: Readonly<{ className?: string }>) {
  return (
    <div
      className={cn(
        "flex h-[200px] w-full flex-col justify-center gap-3 px-2 py-4",
        className,
      )}
      aria-hidden
    >
      {[70, 55, 85, 40].map((w, i) => (
        <div
          key={`head-sk-${w}-${i}`}
          className="h-4 animate-pulse rounded-r-lg bg-teal-200/50 dark:bg-teal-500/20"
          style={{ width: `${w}%` }}
        />
      ))}
    </div>
  );
}

export default CompanyFinancialReportExpensesByHeadChart;
