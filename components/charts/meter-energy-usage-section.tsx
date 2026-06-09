"use client";

import { useMemo } from "react";

import { PowerUsageCard } from "@/components/charts/power-usage-card";
import { EnergyUsagePeriodControl } from "@/components/charts/energy-usage-period-control";
import { formatEstateUsageDateRange } from "@/lib/estate-energy-usage-chart";
import { mapMeterUsageToPowerUsage } from "@/lib/power-usage-chart";
import type { MeterUsageData, MeterUsageRange } from "@/redux/slice/resident/meter-mgt/meter-mgt";

export interface MeterEnergyUsageSectionProps {
  readonly data: MeterUsageData | null | undefined;
  readonly loading?: boolean;
  readonly range: MeterUsageRange;
  readonly onRangeChange: (range: MeterUsageRange) => void;
  readonly emptyMessage?: string | null;
  readonly className?: string;
  readonly showPeriodFilter?: boolean;
}

export function MeterEnergyUsageSection({
  data,
  loading = false,
  range,
  onRangeChange,
  emptyMessage,
  className,
  showPeriodFilter = true,
}: MeterEnergyUsageSectionProps) {
  const energyUsage = useMemo(() => mapMeterUsageToPowerUsage(data), [data]);
  const dateRangeLabel = formatEstateUsageDateRange(data?.from, data?.to);

  const headerActions = showPeriodFilter ? (
    <EnergyUsagePeriodControl
      value={range as "daily" | "weekly" | "monthly" | "yearly"}
      onChange={(next) => onRangeChange(next)}
      disabled={loading}
    />
  ) : undefined;

  return (
    <PowerUsageCard
      className={className}
      title="Energy Usage"
      data={energyUsage.points}
      totalUsageKwh={energyUsage.totalKwh}
      loading={loading}
      subtitle={!loading && dateRangeLabel ? dateRangeLabel : undefined}
      headerActions={headerActions}
      emptyMessage={
        emptyMessage ?? "No energy usage data for this period."
      }
    />
  );
}

export default MeterEnergyUsageSection;
