"use client";

import { AlertCircle, ChevronDown, Gauge, RefreshCw, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { resolveEstateName } from "@/lib/analytics/resolveEstateName";
import type { CustomerMeterSummaryFilter } from "@/redux/slice/super-admin/customer-meter-summary/customer-meter-summary";
import type {
  AnalyticsScope,
  CustomerMeterSummaryData,
} from "@/types/analytics";

export type FilterOption = {
  label: string;
  value: string;
};

type FilterMode = CustomerMeterSummaryFilter["mode"];

type RatioTone = "green" | "amber" | "red";

/** Same thresholds as CollectionEfficiencyChart efficiencyColor. */
function ratioTone(percent: number): RatioTone {
  if (percent >= 70) return "green";
  if (percent >= 40) return "amber";
  return "red";
}

const BADGE_STYLES: Record<RatioTone, string> = {
  green:
    "bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200",
  amber:
    "bg-amber-500/15 text-amber-900 dark:bg-amber-500/20 dark:text-amber-100",
  red: "bg-red-500/15 text-red-800 dark:bg-red-500/20 dark:text-red-200",
};

const TILE_STYLES: Record<
  "meters" | "residents",
  { panel: string; label: string; value: string }
> = {
  meters: {
    panel:
      "border-teal-200/70 bg-gradient-to-br from-white to-teal-50 dark:border-teal-500/25 dark:from-teal-950/50 dark:to-teal-900/20",
    label: "text-teal-700/80 dark:text-teal-300",
    value: "text-teal-900 dark:text-teal-100",
  },
  residents: {
    panel:
      "border-amber-200/70 bg-gradient-to-br from-white to-amber-50 dark:border-amber-500/25 dark:from-amber-950/50 dark:to-amber-900/20",
    label: "text-amber-700/80 dark:text-amber-300",
    value: "text-amber-900 dark:text-amber-100",
  },
};

function activePercent(active: number, total: number): number {
  if (total <= 0) return 0;
  return (active / total) * 100;
}

function formatPeriodRange(startDate: string, endDate: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  };
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "—";
  }
  return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
}

function resolveTitle(
  filter: CustomerMeterSummaryFilter,
  scope: AnalyticsScope | null,
  estateOptions: ReadonlyArray<FilterOption>,
  companyOptions: ReadonlyArray<FilterOption>,
): string {
  if (filter.mode === "estate") {
    if (!filter.estateId) return "Select estate";
    const fromScope = scope?.estates?.find((e) => e.id === filter.estateId);
    if (fromScope?.name?.trim()) return fromScope.name.trim();
    const fromOptions = estateOptions.find((o) => o.value === filter.estateId);
    if (fromOptions?.label) return fromOptions.label;
    return resolveEstateName(filter.estateId, scope?.estates ?? []);
  }

  if (!filter.companyId) return "Select company";
  const fromOptions = companyOptions.find((o) => o.value === filter.companyId);
  if (fromOptions?.label) return fromOptions.label;
  return filter.companyId;
}

type CustomerMeterSummaryCardProps = Readonly<{
  data: CustomerMeterSummaryData | null;
  scope: AnalyticsScope | null;
  loading?: boolean;
  error?: string | null;
  onRetry: () => void;
  filter: CustomerMeterSummaryFilter;
  onFilterChange: (filter: CustomerMeterSummaryFilter) => void;
  estateOptions: ReadonlyArray<FilterOption>;
  companyOptions: ReadonlyArray<FilterOption>;
  className?: string;
}>;

export function CustomerMeterSummaryCard({
  data,
  scope,
  loading = false,
  error = null,
  onRetry,
  filter,
  onFilterChange,
  estateOptions,
  companyOptions,
  className,
}: CustomerMeterSummaryCardProps) {
  const showError = Boolean(error) && !data && !loading;
  const isEmpty =
    !loading &&
    !error &&
    data != null &&
    Number(data.totalMeters ?? 0) === 0 &&
    Number(data.totalResidents ?? 0) === 0;

  const title = resolveTitle(filter, scope, estateOptions, companyOptions);
  const isEstateMode = filter.mode === "estate";

  const selectOptions = isEstateMode
    ? [
        { label: "Select estate", value: "" },
        ...estateOptions,
      ]
    : [
        { label: "Select company", value: "" },
        ...companyOptions,
      ];

  const selectValue = isEstateMode ? filter.estateId : filter.companyId;

  const handleModeChange = (mode: FilterMode) => {
    if (mode === filter.mode) return;
    if (mode === "estate") {
      onFilterChange({
        mode: "estate",
        estateId: estateOptions[0]?.value ?? "",
      });
      return;
    }
    onFilterChange({
      mode: "company",
      companyId: companyOptions[0]?.value ?? "",
    });
  };

  const handleSelectChange = (raw: string) => {
    const id = raw.trim();
    if (isEstateMode) {
      onFilterChange({ mode: "estate", estateId: id });
      return;
    }
    onFilterChange({ mode: "company", companyId: id });
  };

  return (
    <Card
      className={cn(
        "mt-0 gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-sm",
        className,
      )}
    >
      <div className="flex flex-col gap-4 px-4 pt-4 sm:px-5 sm:pt-5 lg:flex-row lg:items-start lg:justify-between lg:gap-6 lg:px-6 lg:pt-6">
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-base font-bold tracking-tight break-words text-foreground sm:text-lg md:text-xl">
            <span className="block sm:inline">Customer & meter summary</span>
            <span className="hidden text-muted-foreground sm:inline"> — </span>
            <span className="mt-0.5 block text-sm font-semibold text-muted-foreground sm:mt-0 sm:inline sm:text-inherit sm:font-bold sm:text-foreground">
              {title}
            </span>
          </h2>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            {loading && !data
              ? "Loading…"
              : `Active meters and residents for ${title}`}
          </p>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row sm:items-center lg:w-auto lg:max-w-md">
          <ModeSegmentedControl
            value={filter.mode}
            onChange={handleModeChange}
            disabled={loading}
            className="w-full sm:w-auto"
          />
          <div className="relative flex min-w-0 flex-1 items-center lg:min-w-[200px]">
            <Select
              aria-label={isEstateMode ? "Filter by estate" : "Filter by company"}
              options={selectOptions.map((o) => ({
                ...o,
                value: String(o.value),
              }))}
              value={selectValue}
              disabled={loading}
              onChange={(e) => handleSelectChange(e.target.value)}
              className="h-9 w-full appearance-none truncate pr-8"
            />
            <ChevronDown
              className="pointer-events-none absolute right-2.5 h-4 w-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
          </div>
        </div>
      </div>

      <div className="space-y-3 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
        <CardBody
          showError={showError}
          showEmpty={isEmpty}
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

function ModeSegmentedControl({
  value,
  onChange,
  disabled,
  className,
}: Readonly<{
  value: FilterMode;
  onChange: (mode: FilterMode) => void;
  disabled?: boolean;
  className?: string;
}>) {
  const options: ReadonlyArray<{ value: FilterMode; label: string }> = [
    { value: "estate", label: "Estate" },
    { value: "company", label: "Company" },
  ];

  return (
    <div
      aria-label="Filter by estate or company"
      className={cn(
        "inline-flex shrink-0 rounded-xl bg-muted/70 p-1",
        className,
      )}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        if (active) {
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              aria-pressed="true"
              onClick={() => onChange(opt.value)}
              className={cn(
                "flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors sm:flex-none sm:px-3.5",
                "bg-card text-foreground shadow-sm",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              {opt.label}
            </button>
          );
        }
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            aria-pressed="false"
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors sm:flex-none sm:px-3.5",
              "text-muted-foreground hover:text-foreground",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
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
  data: CustomerMeterSummaryData | null;
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

  const totalMeters = Number(data.totalMeters ?? 0);
  const activeMeters = Number(data.activeMeters ?? 0);
  const assignedActiveMeters = Number(data.assignedActiveMeters ?? 0);
  const totalResidents = Number(data.totalResidents ?? 0);
  const activeResidents = Number(data.activeResidents ?? 0);

  const metersPct = activePercent(activeMeters, totalMeters);
  const residentsPct = activePercent(activeResidents, totalResidents);
  const unassignedActive = activeMeters - assignedActiveMeters;
  const periodLabel =
    data.period?.startDate && data.period?.endDate
      ? formatPeriodRange(data.period.startDate, data.period.endDate)
      : null;

  return (
    <div className={cn("space-y-4", loading && "opacity-60")}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SummaryTile
          variant="meters"
          label="Meters"
          active={activeMeters}
          total={totalMeters}
          percent={metersPct}
          icon={Gauge}
          footnote={
            assignedActiveMeters !== activeMeters
              ? `${Math.abs(unassignedActive).toLocaleString()} active meters unassigned`
              : null
          }
        />
        <SummaryTile
          variant="residents"
          label="Residents"
          active={activeResidents}
          total={totalResidents}
          percent={residentsPct}
          icon={Users}
        />
      </div>

      {periodLabel ? (
        <p className="inline-flex rounded-full bg-muted/80 px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {periodLabel}
        </p>
      ) : null}
    </div>
  );
}

function SummaryTile({
  variant,
  label,
  active,
  total,
  percent,
  icon: Icon,
  footnote,
}: Readonly<{
  variant: "meters" | "residents";
  label: string;
  active: number;
  total: number;
  percent: number;
  icon: typeof Gauge;
  footnote?: string | null;
}>) {
  const tone = ratioTone(percent);
  const styles = TILE_STYLES[variant];

  return (
    <div className={cn("rounded-2xl border px-4 py-3.5 shadow-sm", styles.panel)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-xl",
              variant === "meters"
                ? "bg-teal-500/15 text-teal-700 dark:text-teal-300"
                : "bg-amber-500/15 text-amber-700 dark:text-amber-300",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <p className={cn("text-sm font-medium", styles.label)}>{label}</p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums",
            BADGE_STYLES[tone],
          )}
        >
          {percent.toFixed(1)}%
        </span>
      </div>
      <p
        className={cn(
          "mt-2 font-heading text-2xl font-bold tabular-nums tracking-tight sm:text-3xl",
          styles.value,
        )}
      >
        {active.toLocaleString()}
        <span className="ml-1.5 text-base font-semibold text-muted-foreground sm:text-lg">
          / {total.toLocaleString()}
        </span>
      </p>
      {footnote ? (
        <p className="mt-1.5 text-xs text-muted-foreground">{footnote}</p>
      ) : null}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-[220px] flex-col items-center justify-center gap-2 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-muted">
        <Users className="h-5 w-5 text-muted-foreground" aria-hidden />
      </div>
      <p className="text-sm font-medium text-foreground">
        No customer or meter data
      </p>
      <p className="text-xs text-muted-foreground">
        Summary counts will appear when meters and residents are onboarded.
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
        Couldn’t load customer & meter summary
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="h-28 animate-pulse rounded-2xl bg-teal-200/40 dark:bg-teal-500/15" />
        <div className="h-28 animate-pulse rounded-2xl bg-amber-200/40 dark:bg-amber-500/15" />
      </div>
    </div>
  );
}

export default CustomerMeterSummaryCard;
