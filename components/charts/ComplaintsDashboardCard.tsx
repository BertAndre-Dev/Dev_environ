"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { AlertCircle, MessagesSquare, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ComplaintsDashboardData } from "@/types/analytics";

const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  resolved: "#10B981",
  closed: "#64748B",
  in_progress: "#0150AC",
  "in progress": "#0150AC",
  rejected: "#EF4444",
};

const FALLBACK_COLORS = [
  "#0150AC",
  "#8B5CF6",
  "#14B8A6",
  "#EC4899",
  "#94A3B8",
] as const;

const LOPSIDED_RATIO = 0.95;

type ChartSlice = {
  key: string;
  name: string;
  value: number;
  fill: string;
};

function formatStatusLabel(status: string): string {
  return status
    .split(/[_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function colorForStatus(status: string, index: number): string {
  const key = status.toLowerCase().trim();
  return STATUS_COLORS[key] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

function buildStatusSlices(
  breakdown: Record<string, number> | undefined,
): ChartSlice[] {
  if (!breakdown) return [];
  return Object.entries(breakdown)
    .map(([status, count], index) => ({
      key: status,
      name: formatStatusLabel(status),
      value: Math.max(0, Number(count) || 0),
      fill: colorForStatus(status, index),
    }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value);
}

type TooltipProps = Readonly<{
  active?: boolean;
  payload?: ReadonlyArray<{
    name?: string;
    value?: number;
    payload?: ChartSlice;
  }>;
  segmentTotal: number;
}>;

function ChartTooltip({ active, payload, segmentTotal }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;
  const pct =
    segmentTotal > 0 ? Math.round((item.value / segmentTotal) * 100) : 0;

  return (
    <div className="min-w-[140px] rounded-xl border border-border/80 bg-white px-3.5 py-3 text-sm shadow-lg dark:bg-card">
      <p className="inline-flex items-center gap-2 font-medium text-foreground">
        <span
          className="size-2 rounded-full"
          style={{ backgroundColor: item.fill }}
          aria-hidden
        />
        {item.name}
      </p>
      <p className="mt-1.5 tabular-nums text-muted-foreground">
        {item.value.toLocaleString()}{" "}
        <span className="text-foreground">({pct}%)</span>
      </p>
    </div>
  );
}

type ComplaintsDashboardCardProps = Readonly<{
  data: ComplaintsDashboardData | null;
  loading?: boolean;
  error?: string | null;
  onRetry: () => void;
  estateName?: string;
  className?: string;
}>;

export function ComplaintsDashboardCard({
  data,
  loading = false,
  error = null,
  onRetry,
  estateName,
  className,
}: ComplaintsDashboardCardProps) {
  const total = Number(data?.summary?.totalComplaints ?? 0);
  const showError = Boolean(error) && !data && !loading;
  const showEmpty = !loading && !error && Boolean(data) && total === 0;

  let subtitle = "Status and resolution overview";
  if (loading && !data) {
    subtitle = "Loading…";
  } else if (estateName) {
    subtitle = `Complaint analytics for ${estateName}`;
  }

  return (
    <Card
      className={cn(
        "mt-0 gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-sm",
        className,
      )}
    >
      <div className="px-5 pt-5 sm:px-6 sm:pt-6">
        <h2 className="font-heading text-lg font-bold tracking-tight text-foreground sm:text-xl">
          Complaints dashboard
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="space-y-4 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
        <CardBody
          showError={showError}
          showEmpty={showEmpty}
          loading={loading}
          hasData={Boolean(data)}
          data={data}
          error={error}
          onRetry={onRetry}
        />
      </div>
    </Card>
  );
}

function CardBody({
  showError,
  showEmpty,
  loading,
  hasData,
  data,
  error,
  onRetry,
}: Readonly<{
  showError: boolean;
  showEmpty: boolean;
  loading: boolean;
  hasData: boolean;
  data: ComplaintsDashboardData | null;
  error: string | null;
  onRetry: () => void;
}>) {
  if (showError) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }
  if (showEmpty) {
    return <EmptyState />;
  }
  if (loading && !hasData) {
    return <CardSkeleton />;
  }
  if (!data) {
    return <EmptyState />;
  }

  const totalComplaints = Math.max(
    0,
    Number(data.summary?.totalComplaints ?? 0),
  );
  const pendingCount = Math.max(
    0,
    Number(data.resolutionRate?.pendingComplaints ?? 0),
  );
  const resolvedCount = Math.max(
    0,
    Number(data.resolutionRate?.resolvedComplaints ?? 0),
  );
  const resolutionRatePct = Math.max(
    0,
    Number(data.resolutionRate?.resolutionRate ?? 0),
  );
  const avgDays = Number(
    data.averageResolutionTime?.averageResolutionDays ?? 0,
  );

  const slices = buildStatusSlices(data.statusBreakdown);
  const statusTotal = slices.reduce((sum, s) => sum + s.value, 0);
  const maxShare =
    statusTotal > 0
      ? Math.max(...slices.map((s) => s.value)) / statusTotal
      : 0;
  const showDonut = statusTotal > 0 && maxShare < LOPSIDED_RATIO;

  const topCategory = data.categoryBreakdown?.[0];
  const oldest = data.oldestUnresolvedComplaints?.[0];

  return (
    <div className={cn("space-y-4", loading && "opacity-60")}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricTile label="Total complaints" value={totalComplaints} />
        <MetricTile label="Pending" value={pendingCount} />
        <MetricTile label="Resolved" value={resolvedCount} />
      </div>

      <div
        className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"
        aria-label="Complaint status breakdown"
      >
        {slices.map((slice) => {
          const pct =
            statusTotal > 0
              ? Math.round((slice.value / statusTotal) * 100)
              : 0;
          return (
            <LegendItem
              key={slice.key}
              color={slice.fill}
              label={`${slice.name} ${slice.value.toLocaleString()} (${pct}%)`}
            />
          );
        })}
      </div>

      {showDonut ? (
        <div
          className="relative mx-auto h-[220px] w-full max-w-[220px]"
          role="img"
          aria-label={`Complaints by status for ${totalComplaints.toLocaleString()} complaints`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                cx="50%"
                cy="50%"
                dataKey="value"
                nameKey="name"
                innerRadius="58%"
                outerRadius="88%"
                paddingAngle={slices.length > 1 ? 3 : 0}
                stroke="#ffffff"
                strokeWidth={2}
                isAnimationActive={!loading}
              >
                {slices.map((entry) => (
                  <Cell key={entry.key} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip segmentTotal={statusTotal} />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="font-heading text-2xl font-bold tabular-nums text-foreground">
              {totalComplaints.toLocaleString()}
            </p>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              total
            </p>
          </div>
        </div>
      ) : statusTotal > 0 ? (
        <p className="rounded-xl border border-border bg-muted/30 px-3.5 py-3 text-center text-xs text-muted-foreground">
          Status is heavily skewed ({Math.round(maxShare * 100)}% in one
          segment), so the donut is hidden. KPI cards above show the counts.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-muted/20 px-3.5 py-3">
          <p className="text-xs text-muted-foreground">Resolution rate</p>
          <p className="mt-1 font-heading text-xl font-bold tabular-nums text-foreground">
            {resolutionRatePct.toLocaleString()}%
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Avg resolution {avgDays.toFixed(1)} days
          </p>
        </div>
        <div className="rounded-xl border border-border bg-muted/20 px-3.5 py-3">
          <p className="text-xs text-muted-foreground">Top category</p>
          <p className="mt-1 font-heading text-xl font-bold tracking-tight text-foreground">
            {topCategory?.category
              ? formatStatusLabel(topCategory.category)
              : "—"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {topCategory
              ? `${Number(topCategory.count).toLocaleString()} complaint${Number(topCategory.count) === 1 ? "" : "s"}`
              : "No category data"}
          </p>
        </div>
      </div>

      {oldest ? (
        <div className="rounded-xl border border-amber-300/80 bg-amber-50 px-3.5 py-3 text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-100">
          <p className="text-sm font-semibold">Oldest unresolved</p>
          <p className="mt-0.5 truncate text-sm">{oldest.title}</p>
          <p className="mt-0.5 text-xs opacity-80">
            {formatStatusLabel(oldest.category)} ·{" "}
            {Math.round(Number(oldest.daysOpen ?? 0))} days open
          </p>
        </div>
      ) : null}
    </div>
  );
}

function MetricTile({
  label,
  value,
}: Readonly<{ label: string; value: number }>) {
  return (
    <div className="rounded-xl border border-border bg-card px-3.5 py-3 shadow-sm">
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-2xl font-bold tabular-nums tracking-tight text-foreground">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function LegendItem({
  color,
  label,
}: Readonly<{ color: string; label: string }>) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="size-2.5 shrink-0 rounded-sm"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span>{label}</span>
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex h-[220px] flex-col items-center justify-center gap-2 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-muted">
        <MessagesSquare className="h-5 w-5 text-muted-foreground" aria-hidden />
      </div>
      <p className="text-sm font-medium text-foreground">No complaints yet</p>
      <p className="text-xs text-muted-foreground">
        Complaint analytics for this estate will appear here.
      </p>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: Readonly<{ message: string | null; onRetry: () => void }>) {
  return (
    <div className="flex h-[220px] flex-col items-center justify-center gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" aria-hidden />
      <p className="font-medium text-foreground">
        Couldn’t load complaints dashboard
      </p>
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

function CardSkeleton({ className }: Readonly<{ className?: string }>) {
  return (
    <div className={cn("space-y-4", className)} aria-hidden>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={`sk-comp-kpi-${i}`}
            className="h-[72px] animate-pulse rounded-xl bg-muted/70"
          />
        ))}
      </div>
      <div className="h-4 w-2/3 animate-pulse rounded bg-muted/60" />
      <div className="mx-auto h-[180px] w-[180px] animate-pulse rounded-full border-[18px] border-muted" />
    </div>
  );
}

export default ComplaintsDashboardCard;
