"use client";

import { useMemo } from "react";
import { RefreshCw } from "lucide-react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  computeRealtimeSuccessRate,
  formatRealtimeTimestamp,
  mapRealtimeToGaugePoints,
  mapRealtimeToMeterPieData,
  type EstateRealtimeReadingsData,
} from "@/lib/estate-realtime-readings";

export interface EstateRealtimeReadingsCardProps {
  readonly title?: string;
  readonly data: EstateRealtimeReadingsData | null;
  readonly loading?: boolean;
  readonly progress?: number | null;
  readonly onRefresh?: () => void;
  readonly refreshing?: boolean;
  readonly emptyMessage?: string | null;
  readonly className?: string;
}

type PieTooltipProps = Readonly<{
  active?: boolean;
  payload?: ReadonlyArray<{
    name?: string;
    value?: number;
    payload?: { name?: string; value?: number };
  }>;
}>;

function PieTooltip({ active, payload }: PieTooltipProps) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-foreground">{entry?.name}</p>
      <p className="text-muted-foreground tabular-nums">
        {(entry?.value ?? 0).toLocaleString()} meters
      </p>
    </div>
  );
}

export function EstateRealtimeReadingsCard({
  title = "Realtime meter readings",
  data,
  loading = false,
  progress = null,
  onRefresh,
  refreshing = false,
  emptyMessage,
  className,
}: EstateRealtimeReadingsCardProps) {
  const gaugeData = useMemo(
    () => mapRealtimeToGaugePoints(data),
    [data],
  );
  const pieData = useMemo(() => mapRealtimeToMeterPieData(data), [data]);
  const successRate = useMemo(
    () => (data ? computeRealtimeSuccessRate(data) : 0),
    [data],
  );
  const timestampLabel = formatRealtimeTimestamp(data?.timestamp);
  const showProgress = loading && typeof progress === "number";
  const hasVisualData = Boolean(data && data.meterCount > 0);

  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden rounded-xl border border-border bg-card p-0 shadow-sm",
        className,
      )}
    >
      <div className="flex flex-col gap-4 border-b border-border px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-heading text-2xl font-bold text-foreground">
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Latest aggregated realtime energy across estate meters
          </p>
        </div>

        {onRefresh ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading || refreshing}
            onClick={onRefresh}
            className="shrink-0 self-start"
          >
            <RefreshCw
              className={cn("mr-2 size-4", refreshing && "animate-spin")}
            />
            Refresh
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 border-b border-border px-6 py-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Total energy (now)</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums">
            {loading
              ? "—"
              : `${(data?.totalEnergy ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh`}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Read success rate</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums">
            {loading ? "—" : `${successRate}%`}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Meters read</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums">
            {loading ? "—" : (data?.successCount ?? 0).toLocaleString()}
            {!loading && data ? (
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                / {data.meterCount.toLocaleString()}
              </span>
            ) : null}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Last updated</p>
          <p className="mt-0.5 text-sm font-medium">
            {loading ? "—" : (timestampLabel ?? "—")}
          </p>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6 sm:py-6">
        {loading ? (
          <div className="flex h-[320px] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>
              {showProgress
                ? `Aggregating realtime readings… ${Math.round(progress)}%`
                : "Loading realtime readings…"}
            </span>
            {showProgress ? (
              <div className="h-1.5 w-48 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-[#0150AC] transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.max(0, progress))}%`,
                  }}
                />
              </div>
            ) : null}
          </div>
        ) : hasVisualData ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="relative h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="68%"
                  outerRadius="100%"
                  barSize={14}
                  data={gaugeData}
                  startAngle={180}
                  endAngle={0}
                >
                  <RadialBar
                    dataKey="value"
                    cornerRadius={8}
                    max={100}
                    background={{ fill: "#E2E8F0" }}
                    fill="#0150AC"
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-10">
                <p className="text-3xl font-bold tabular-nums text-foreground">
                  {successRate}%
                </p>
                <p className="text-xs text-muted-foreground">read success</p>
              </div>
            </div>

            <div className="h-[280px]">
              <p className="mb-2 text-center text-sm font-medium text-muted-foreground">
                Meter read breakdown
              </p>
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : emptyMessage ? (
          <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

export default EstateRealtimeReadingsCard;
