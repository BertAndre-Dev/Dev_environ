"use client";

import { cn } from "@/lib/utils";
import {
  ESTATE_ENERGY_USAGE_RANGE_OPTIONS,
  type EstateEnergyUsageRange,
} from "@/lib/estate-energy-usage-chart";

export type EnergyUsageRange = EstateEnergyUsageRange;

export interface EnergyUsagePeriodControlProps {
  readonly value: EnergyUsageRange;
  readonly onChange: (range: EnergyUsageRange) => void;
  readonly disabled?: boolean;
}

export function EnergyUsagePeriodControl({
  value,
  onChange,
  disabled,
}: EnergyUsagePeriodControlProps) {
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
