"use client";

import { useMemo } from "react";
import { RefreshCw } from "lucide-react";

import { PowerUsageCard } from "@/components/charts/power-usage-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ESTATE_ENERGY_USAGE_RANGE_OPTIONS,
  formatEstateUsageDateRange,
  mapEstateEnergyUsageToPowerUsage,
  type EstateEnergyUsageData,
  type EstateEnergyUsageRange,
} from "@/lib/estate-energy-usage-chart";

export type { EstateEnergyUsageRange };

export interface EstatePowerUsageSectionProps {
  readonly data: EstateEnergyUsageData | null;
  readonly loading?: boolean;
  readonly progress?: number | null;
  readonly range: EstateEnergyUsageRange;
  readonly onRangeChange: (range: EstateEnergyUsageRange) => void;
  readonly onRefresh?: () => void;
  readonly refreshing?: boolean;
  readonly emptyMessage?: string | null;
  readonly className?: string;
}

function PeriodSegmentedControl({
  value,
  onChange,
  disabled,
}: Readonly<{
  value: EstateEnergyUsageRange;
  onChange: (range: EstateEnergyUsageRange) => void;
  disabled?: boolean;
}>) {
  return (
    <div className="inline-flex flex-wrap rounded-full border border-input bg-muted/30 p-1">
      {ESTATE_ENERGY_USAGE_RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-full px-2 py-1.5 text-sm font-medium transition-colors cursor-pointer",
            disabled && "cursor-not-allowed opacity-60",
            value === opt.value
              ? "bg-[#0150AC] text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function EstatePowerUsageSection({
  data,
  loading = false,
  progress = null,
  range,
  onRangeChange,
  onRefresh,
  refreshing = false,
  emptyMessage,
  className,
}: EstatePowerUsageSectionProps) {
  const powerUsage = useMemo(
    () => mapEstateEnergyUsageToPowerUsage(data),
    [data],
  );
  const dateRangeLabel = formatEstateUsageDateRange(data?.from, data?.to);
  const showProgress = loading && typeof progress === "number";

  const headerActions = (
    <>
      <PeriodSegmentedControl
        value={range}
        onChange={onRangeChange}
        disabled={loading}
      />
      {onRefresh ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading || refreshing}
          onClick={onRefresh}
          className="shrink-0"
        >
          <RefreshCw
            className={cn("size-4", refreshing && "animate-spin")}
          />
        </Button>
      ) : null}
    </>
  );

  const loadingContent = showProgress ? (
    <div className="flex flex-col items-center gap-2">
      <span>Aggregating estate usage… {Math.round(progress)}%</span>
      <div className="h-1.5 w-48 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-[#0150AC] transition-all duration-300"
          style={{
            width: `${Math.min(100, Math.max(0, progress))}%`,
          }}
        />
      </div>
    </div>
  ) : undefined;

  return (
    <PowerUsageCard
      className={className}
      title="Power Usage"
      data={powerUsage.points}
      totalUsageKwh={powerUsage.totalKwh}
      loading={loading}
      loadingContent={loadingContent}
      subtitle={!loading && dateRangeLabel ? dateRangeLabel : undefined}
      headerActions={headerActions}
      emptyMessage={emptyMessage ?? "No power usage data for this period."}
    />
  );
}

export default EstatePowerUsageSection;
