"use client";

import { useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { Select } from "@/components/ui/select";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { cn } from "@/lib/utils";

export type PlatformFeeFilterState = {
  startDate: string;
  endDate: string;
  estateId: string | null;
  companyId: string | null;
};

export type FilterOption = {
  label: string;
  value: string;
};

type PlatformFeeFiltersProps = Readonly<{
  filters: PlatformFeeFilterState;
  onFiltersChange: (filters: PlatformFeeFilterState) => void;
  estateOptions: ReadonlyArray<FilterOption>;
  companyOptions: ReadonlyArray<FilterOption>;
  estatesLoading?: boolean;
  companiesLoading?: boolean;
}>;

const selectClassName =
  "h-9 w-full min-w-42 cursor-pointer appearance-none border-0 bg-transparent pr-8 text-[13px] shadow-none ring-0 focus:ring-0 active:scale-[0.99] motion-reduce:active:scale-100";

const scopeWellClassName =
  "grid grid-cols-1 gap-3 rounded-xl bg-black/4 p-2.5 sm:grid-cols-2 dark:bg-white/6";

export function PlatformFeeFilters({
  filters,
  onFiltersChange,
  estateOptions,
  companyOptions,
  estatesLoading = false,
  companiesLoading = false,
}: PlatformFeeFiltersProps) {
  const estateSelectOptions = useMemo(() => {
    if (estatesLoading) {
      return [{ label: "Loading…", value: "" }];
    }
    return [{ label: "All estates", value: "" }, ...estateOptions];
  }, [estateOptions, estatesLoading]);

  const companySelectOptions = useMemo(() => {
    if (companiesLoading) {
      return [{ label: "Loading…", value: "" }];
    }
    return [{ label: "All companies", value: "" }, ...companyOptions];
  }, [companyOptions, companiesLoading]);

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/50 bg-white/65 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_8px_24px_rgba(15,23,42,0.04)] backdrop-blur-xl backdrop-saturate-150",
        "dark:border-white/10 dark:bg-black/35 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
        "motion-reduce:backdrop-blur-none motion-reduce:bg-card",
        "[@media(prefers-reduced-transparency:reduce)]:bg-card [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none [@media(prefers-reduced-transparency:reduce)]:backdrop-saturate-100",
      )}
    >
      <div className="flex flex-col gap-4 lg:gap-5">
        <fieldset className="min-w-0">
          <legend className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Period
          </legend>
          <DateRangeFilter
            startId="platform-fee-start-date"
            endId="platform-fee-end-date"
            startDate={filters.startDate}
            endDate={filters.endDate}
            onStartChange={(startDate) =>
              onFiltersChange({ ...filters, startDate })
            }
            onEndChange={(endDate) => onFiltersChange({ ...filters, endDate })}
          />
        </fieldset>

        <fieldset className="min-w-0">
          <legend className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Scope
          </legend>
          <div className={scopeWellClassName}>
            <LabeledSelect
              id="platform-fee-estate"
              label="Estate"
              value={filters.estateId ?? ""}
              disabled={estatesLoading}
              options={estateSelectOptions}
              onChange={(value) =>
                onFiltersChange({
                  ...filters,
                  estateId: value || null,
                })
              }
            />
            <LabeledSelect
              id="platform-fee-company"
              label="Company"
              value={filters.companyId ?? ""}
              disabled={companiesLoading}
              options={companySelectOptions}
              onChange={(value) =>
                onFiltersChange({
                  ...filters,
                  companyId: value || null,
                })
              }
            />
          </div>
        </fieldset>
      </div>
    </div>
  );
}

function LabeledSelect({
  id,
  label,
  value,
  options,
  disabled,
  onChange,
}: Readonly<{
  id: string;
  label: string;
  value: string;
  options: ReadonlyArray<FilterOption>;
  disabled?: boolean;
  onChange: (value: string) => void;
}>) {
  return (
    <div className="min-w-0 flex-1">
      <label
        htmlFor={id}
        className="mb-1.5 block px-0.5 text-xs font-medium text-foreground"
      >
        {label}
      </label>
      <div className="relative">
        <Select
          id={id}
          aria-label={label}
          value={value}
          disabled={disabled}
          options={options}
          className={selectClassName}
          onChange={(event) => onChange(event.target.value.trim())}
        />
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
      </div>
    </div>
  );
}

export default PlatformFeeFilters;
