"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertCircle, BarChart3, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CompanyGenerateFinancialReportByEstate } from "@/types/analytics";
import {
  formatFinancialReportCurrency,
  getEstateActivityLabel,
} from "@/lib/company-overview-financial-report";

const REVENUE_COLOR = "#10B981";
const REVENUE_COLOR_DEEP = "#059669";
const EXPENSE_COLOR = "#F43F5E";
const EXPENSE_COLOR_DEEP = "#E11D48";
const REVENUE_GRADIENT_ID = "companyFinReportRevenueGrad";
const EXPENSE_GRADIENT_ID = "companyFinReportExpenseGrad";

type EstateBarRow = {
  estateName: string;
  totalRevenue: number;
  totalExpenses: number;
  activityLabel: "No activity" | "Profit" | "Loss";
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
  payload?: ReadonlyArray<{ payload?: EstateBarRow }>;
  label?: string;
}>;

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="min-w-[200px] rounded-xl border border-border/80 bg-white px-3.5 py-3 text-sm shadow-lg dark:bg-card">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{row.activityLabel}</p>
      <div className="mt-2 space-y-1.5">
        <div className="flex items-center justify-between gap-6">
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: REVENUE_COLOR }}
              aria-hidden
            />
            Revenue
          </span>
          <span className="font-semibold tabular-nums text-foreground">
            {formatFinancialReportCurrency(row.totalRevenue)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: EXPENSE_COLOR }}
              aria-hidden
            />
            Expenses
          </span>
          <span className="font-semibold tabular-nums text-foreground">
            {formatFinancialReportCurrency(row.totalExpenses)}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Show labels for tiny revenue bars that would otherwise be invisible next to expenses. */
function revenueLabelFormatter(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return "";
  return formatNairaCompact(n);
}

type CompanyFinancialReportByEstateChartProps = Readonly<{
  byEstate: CompanyGenerateFinancialReportByEstate[];
  loading?: boolean;
  error?: string | null;
  onRetry: () => void;
  className?: string;
}>;

export function CompanyFinancialReportByEstateChart({
  byEstate,
  loading = false,
  error = null,
  onRetry,
  className,
}: CompanyFinancialReportByEstateChartProps) {
  const rows = useMemo<EstateBarRow[]>(
    () =>
      byEstate.map((e) => ({
        estateName: e.estateName || "Unnamed",
        totalRevenue: Number(e.totalRevenue) || 0,
        totalExpenses: Number(e.totalExpenses) || 0,
        activityLabel: getEstateActivityLabel(e),
      })),
    [byEstate],
  );

  const showError = Boolean(error) && rows.length === 0 && !loading;
  const showEmpty = !loading && !error && rows.length === 0;

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Revenue vs expenses by estate
        </h3>
        <p className="text-xs text-muted-foreground">
          Grouped bars per estate. Tooltips and labels keep tiny revenue readable.
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
          className={cn("relative h-[320px] w-full", loading && "opacity-60")}
        >
          {loading ? (
            <ChartSkeleton className="absolute inset-0 z-10 bg-card/50" />
          ) : null}
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rows}
              margin={{ top: 24, right: 8, left: 0, bottom: 8 }}
            >
              <defs>
                <linearGradient
                  id={REVENUE_GRADIENT_ID}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#34D399" stopOpacity={1} />
                  <stop
                    offset="100%"
                    stopColor={REVENUE_COLOR_DEEP}
                    stopOpacity={1}
                  />
                </linearGradient>
                <linearGradient
                  id={EXPENSE_GRADIENT_ID}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#FB7185" stopOpacity={1} />
                  <stop
                    offset="100%"
                    stopColor={EXPENSE_COLOR_DEEP}
                    stopOpacity={1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                className="stroke-border/60"
              />
              <XAxis
                dataKey="estateName"
                tickLine={false}
                axisLine={false}
                interval={0}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                tickFormatter={(v: number) => formatNairaCompact(v)}
                width={56}
              />
              <Tooltip
                cursor={{ fill: "rgba(16, 185, 129, 0.08)" }}
                content={<ChartTooltip />}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                formatter={(value) =>
                  value === "totalRevenue" ? "Revenue" : "Expenses"
                }
              />
              <Bar
                dataKey="totalRevenue"
                name="totalRevenue"
                fill={`url(#${REVENUE_GRADIENT_ID})`}
                radius={[8, 8, 0, 0]}
                maxBarSize={40}
                isAnimationActive={!loading}
              >
                <LabelList
                  dataKey="totalRevenue"
                  position="top"
                  formatter={revenueLabelFormatter}
                  className="fill-emerald-700 text-[10px] font-medium"
                />
              </Bar>
              <Bar
                dataKey="totalExpenses"
                name="totalExpenses"
                fill={`url(#${EXPENSE_GRADIENT_ID})`}
                radius={[8, 8, 0, 0]}
                maxBarSize={40}
                isAnimationActive={!loading}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-[240px] flex-col items-center justify-center gap-2 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-muted">
        <BarChart3 className="h-5 w-5 text-muted-foreground" aria-hidden />
      </div>
      <p className="text-sm font-medium text-foreground">No estate totals</p>
      <p className="text-xs text-muted-foreground">
        Try a different date range or estate filter.
      </p>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: Readonly<{ message: string | null; onRetry: () => void }>) {
  return (
    <div className="flex h-[240px] flex-col items-center justify-center gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" aria-hidden />
      <p className="font-medium text-foreground">Couldn&apos;t load estate chart</p>
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
        "flex h-[240px] w-full items-end gap-3 px-2 py-6",
        className,
      )}
      aria-hidden
    >
      {[45, 70, 55, 85, 60].map((h, i) => (
        <div
          key={`estate-sk-${h}-${i}`}
          className="flex-1 animate-pulse rounded-t-lg bg-emerald-200/50 dark:bg-emerald-500/20"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

export default CompanyFinancialReportByEstateChart;
