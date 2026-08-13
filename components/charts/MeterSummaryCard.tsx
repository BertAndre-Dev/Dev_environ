"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { AlertCircle, Gauge, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MeterSummaryData } from "@/types/analytics";

const ASSIGNED_COLOR = "#0150AC";
const UNASSIGNED_COLOR = "#CBD5E1";
/** When one segment exceeds this share, prefer KPI-only (donut is uninformative). */
const LOPSIDED_RATIO = 0.95;

type ChartSlice = {
  key: "assigned" | "unassigned";
  name: string;
  value: number;
  fill: string;
};

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

type MeterSummaryCardProps = Readonly<{
  data: MeterSummaryData | null;
  loading?: boolean;
  error?: string | null;
  onRetry: () => void;
  /** Optional estate name for the subtitle (admin estate is fixed from signed-in user). */
  estateName?: string;
  className?: string;
}>;

export function MeterSummaryCard({
  data,
  loading = false,
  error = null,
  onRetry,
  estateName,
  className,
}: MeterSummaryCardProps) {
  const totalMeters = Number(data?.totalMeters ?? 0);
  const showError = Boolean(error) && !data && !loading;
  const showEmpty = !loading && !error && Boolean(data) && totalMeters === 0;

  let subtitle = "Assigned vs unassigned meters";
  if (loading && !data) {
    subtitle = "Loading…";
  } else if (estateName) {
    subtitle = `Assignment status for ${estateName}`;
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
          Meter summary
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
  data: MeterSummaryData | null;
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

  const totalMeters = Math.max(0, Number(data.totalMeters ?? 0));
  const activeMeters = Math.max(0, Number(data.activeMeters ?? 0));
  const assignedMeters = Math.max(0, Number(data.assignedMeters ?? 0));
  const unassignedMeters = Math.max(0, Number(data.unassignedMeters ?? 0));

  const assignedPct =
    totalMeters > 0 ? Math.round((assignedMeters / totalMeters) * 100) : 0;
  const unassignedPct =
    totalMeters > 0 ? Math.round((unassignedMeters / totalMeters) * 100) : 0;

  const slices: ChartSlice[] = (
    [
      {
        key: "assigned" as const,
        name: "Assigned",
        value: assignedMeters,
        fill: ASSIGNED_COLOR,
      },
      {
        key: "unassigned" as const,
        name: "Unassigned",
        value: unassignedMeters,
        fill: UNASSIGNED_COLOR,
      },
    ] satisfies ChartSlice[]
  ).filter((s) => s.value > 0);

  const maxShare =
    totalMeters > 0
      ? Math.max(assignedMeters, unassignedMeters) / totalMeters
      : 0;
  const showDonut = totalMeters > 0 && maxShare < LOPSIDED_RATIO;

  return (
    <div className={cn("space-y-4", loading && "opacity-60")}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricTile label="Total meters" value={totalMeters} />
        <MetricTile label="Active" value={activeMeters} />
        <MetricTile label="Unassigned" value={unassignedMeters} />
      </div>

      <div
        className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"
        aria-label={`Assigned ${assignedMeters} (${assignedPct}%), Unassigned ${unassignedMeters} (${unassignedPct}%)`}
      >
        <LegendItem
          color={ASSIGNED_COLOR}
          label={`Assigned ${assignedMeters.toLocaleString()} (${assignedPct}%)`}
        />
        <LegendItem
          color={UNASSIGNED_COLOR}
          label={`Unassigned ${unassignedMeters.toLocaleString()} (${unassignedPct}%)`}
        />
      </div>

      {showDonut ? (
        <div
          className="relative mx-auto h-[220px] w-full max-w-[220px]"
          role="img"
          aria-label={`Meter assignment donut: ${assignedPct}% assigned, ${unassignedPct}% unassigned of ${totalMeters.toLocaleString()} meters`}
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
              <Tooltip content={<ChartTooltip segmentTotal={totalMeters} />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="font-heading text-2xl font-bold tabular-nums text-foreground">
              {totalMeters.toLocaleString()}
            </p>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              total
            </p>
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-border bg-muted/30 px-3.5 py-3 text-center text-xs text-muted-foreground">
          Assignment is heavily skewed ({Math.round(maxShare * 100)}% in one
          segment), so the donut is hidden. KPI cards above show the counts.
        </p>
      )}
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
        <Gauge className="h-5 w-5 text-muted-foreground" aria-hidden />
      </div>
      <p className="text-sm font-medium text-foreground">No meters yet</p>
      <p className="text-xs text-muted-foreground">
        Meter counts for this estate will appear here.
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
      <p className="font-medium text-foreground">Couldn’t load meter summary</p>
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
            key={`sk-meter-kpi-${i}`}
            className="h-[72px] animate-pulse rounded-xl bg-muted/70"
          />
        ))}
      </div>
      <div className="h-4 w-2/3 animate-pulse rounded bg-muted/60" />
      <div className="mx-auto h-[180px] w-[180px] animate-pulse rounded-full border-[18px] border-muted" />
    </div>
  );
}

export default MeterSummaryCard;
