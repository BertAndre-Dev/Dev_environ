"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { AlertCircle, RefreshCw, UsersRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  normalizeRoleStats,
  type RoleBreakdownData,
} from "@/redux/slice/admin/user-analytics/user-analytics";

type ChartSlice = {
  key: string;
  name: string;
  value: number;
  active: number;
  fill: string;
};

const ROLE_COLORS = [
  "#0150AC",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#14B8A6",
  "#EC4899",
  "#64748B",
] as const;

const ROLE_LABELS: Record<string, string> = {
  "super admin": "Super admin",
  admin: "Admin",
  resident: "Resident",
  security: "Security",
  "estate admin": "Estate admin",
  staff: "Staff",
  company: "Company",
  "energy provider": "Energy provider",
};

function formatRoleLabel(role: string): string {
  const key = role.toLowerCase().trim();
  if (ROLE_LABELS[key]) return ROLE_LABELS[key];
  return role
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Super admin is estate-scoped noise for admin UI — never show it. */
function isHiddenRole(role: string): boolean {
  return role.toLowerCase().trim() === "super admin";
}

function withoutHiddenRoles(data: RoleBreakdownData): RoleBreakdownData {
  return Object.fromEntries(
    Object.entries(data).filter(([role]) => !isHiddenRole(role)),
  );
}

function buildChartSlices(data: RoleBreakdownData): ChartSlice[] {
  return Object.entries(withoutHiddenRoles(data))
    .map(([role, entry], index) => {
      const stats = normalizeRoleStats(entry);
      return {
        key: role,
        name: formatRoleLabel(role),
        value: stats.total,
        active: stats.active,
        fill: ROLE_COLORS[index % ROLE_COLORS.length],
      };
    })
    .filter((slice) => slice.value > 0)
    .sort((a, b) => b.value - a.value);
}

function totalUsers(data: RoleBreakdownData): number {
  return Object.values(withoutHiddenRoles(data)).reduce<number>(
    (sum, entry) => sum + normalizeRoleStats(entry).total,
    0,
  );
}

function totalActive(data: RoleBreakdownData): number {
  return Object.values(withoutHiddenRoles(data)).reduce<number>(
    (sum, entry) => sum + normalizeRoleStats(entry).active,
    0,
  );
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
    segmentTotal > 0 ? ((item.value / segmentTotal) * 100).toFixed(1) : "0.0";

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
      <p className="mt-0.5 text-xs text-muted-foreground">
        {item.active.toLocaleString()} active
      </p>
    </div>
  );
}

type RoleBreakdownChartProps = Readonly<{
  data: RoleBreakdownData | null;
  loading?: boolean;
  error?: string | null;
  onRetry: () => void;
  className?: string;
}>;

export function RoleBreakdownChart({
  data,
  loading = false,
  error = null,
  onRetry,
  className,
}: RoleBreakdownChartProps) {
  const slices = useMemo(() => (data ? buildChartSlices(data) : []), [data]);
  const sum = data ? totalUsers(data) : 0;
  const activeSum = data ? totalActive(data) : 0;

  const showError = Boolean(error) && !data && !loading;
  const showEmpty = !loading && !error && sum === 0;

  let subtitle = `${sum.toLocaleString()} total users`;
  if (loading && !data) {
    subtitle = "Loading…";
  } else if (sum === 1) {
    subtitle = "1 total user";
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
          Users by role
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="space-y-4 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
        <ChartBody
          showError={showError}
          showEmpty={showEmpty}
          loading={loading}
          hasData={Boolean(data)}
          data={data}
          slices={slices}
          segmentTotal={sum}
          activeTotal={activeSum}
          error={error}
          onRetry={onRetry}
        />
      </div>
    </Card>
  );
}

function ChartBody({
  showError,
  showEmpty,
  loading,
  hasData,
  data,
  slices,
  segmentTotal,
  activeTotal,
  error,
  onRetry,
}: Readonly<{
  showError: boolean;
  showEmpty: boolean;
  loading: boolean;
  hasData: boolean;
  data: RoleBreakdownData | null;
  slices: ChartSlice[];
  segmentTotal: number;
  activeTotal: number;
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
    return <ChartSkeleton />;
  }
  if (!data) {
    return <EmptyState />;
  }

  const legendRows = Object.entries(withoutHiddenRoles(data))
    .map(([role, entry]) => {
      const stats = normalizeRoleStats(entry);
      const slice = slices.find((s) => s.key === role);
      return {
        key: role,
        label: formatRoleLabel(role),
        total: stats.total,
        active: stats.active,
        fill: slice?.fill ?? "#94A3B8",
      };
    })
    .sort((a, b) => b.total - a.total);

  const activeRatio = segmentTotal > 0 ? activeTotal / segmentTotal : 0;
  const activeLow = segmentTotal > 0 && activeRatio < 0.5;

  return (
    <div className={cn("space-y-4", loading && "opacity-60")}>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <div className="relative h-[220px] w-full max-w-[220px] shrink-0">
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
              <Tooltip content={<ChartTooltip segmentTotal={segmentTotal} />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="font-heading text-2xl font-bold tabular-nums text-foreground">
              {segmentTotal.toLocaleString()}
            </p>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              total
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-1">
          {legendRows.map(({ key, label, total, active, fill }) => (
            <div
              key={key}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: fill }}
                  aria-hidden
                />
                <span className="truncate text-sm text-muted-foreground">
                  {label}
                </span>
              </div>
              <span className="shrink-0 text-right text-sm font-semibold tabular-nums text-foreground">
                {total.toLocaleString()}
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  ({active.toLocaleString()} active)
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3.5 py-3",
          activeLow
            ? "border-amber-300/80 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-100"
            : "border-border bg-muted/30 text-muted-foreground",
        )}
      >
        <div className="min-w-0">
          <p
            className={cn(
              "text-sm font-semibold",
              activeLow
                ? "text-amber-900 dark:text-amber-100"
                : "text-foreground",
            )}
          >
            Active across roles
          </p>
          <p className="mt-0.5 text-xs">
            {activeLow
              ? "Fewer than half of users are currently active."
              : "Users marked active in each role."}
          </p>
        </div>
        <p
          className={cn(
            "shrink-0 text-sm font-bold tabular-nums",
            activeLow
              ? "text-destructive dark:text-red-300"
              : "text-foreground",
          )}
        >
          {activeTotal.toLocaleString()} / {segmentTotal.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-[280px] flex-col items-center justify-center gap-2 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-muted">
        <UsersRound className="h-5 w-5 text-muted-foreground" aria-hidden />
      </div>
      <p className="text-sm font-medium text-foreground">No role data</p>
      <p className="text-xs text-muted-foreground">
        Role breakdown will appear when users are registered.
      </p>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: Readonly<{ message: string | null; onRetry: () => void }>) {
  return (
    <div className="flex h-[280px] flex-col items-center justify-center gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" aria-hidden />
      <p className="font-medium text-foreground">
        Couldn’t load users by role
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

function ChartSkeleton({ className }: Readonly<{ className?: string }>) {
  return (
    <div
      className={cn(
        "flex h-[280px] w-full flex-col items-center gap-6 sm:flex-row",
        className,
      )}
      aria-hidden
    >
      <div className="relative h-[180px] w-[180px] shrink-0">
        <div className="absolute inset-0 animate-pulse rounded-full border-[18px] border-muted" />
        <div className="absolute inset-[36%] animate-pulse rounded-full bg-muted/50" />
      </div>
      <div className="flex w-full flex-1 flex-col gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={`sk-role-leg-${i}`}
            className="h-10 animate-pulse rounded-lg bg-muted/70"
          />
        ))}
      </div>
    </div>
  );
}

export default RoleBreakdownChart;
