"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  IsoLinkedRangeEnd,
  IsoLinkedRangeStart,
} from "@/components/ui/iso-date-picker";
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

const dateInputClassName =
  "h-9 min-w-[9.25rem] w-[9.25rem] border-0 bg-transparent px-2.5 pr-9 text-[13px] shadow-none ring-0 focus:ring-0";

const selectClassName =
  "h-9 w-full min-w-42 appearance-none border-0 bg-transparent pr-8 text-[13px] shadow-none ring-0 focus:ring-0 active:scale-[0.99] motion-reduce:active:scale-100";

const wellClassName = "flex flex-wrap items-center gap-4 rounded-xl bg-black/4 p-1 dark:bg-white/6";

export function PlatformFeeFilters({
  filters,
  onFiltersChange,
  estateOptions,
  companyOptions,
  estatesLoading = false,
  companiesLoading = false,
}: PlatformFeeFiltersProps) {
  const [draftStartDate, setDraftStartDate] = useState(filters.startDate);
  const [draftEndDate, setDraftEndDate] = useState(filters.endDate);

  useEffect(() => {
    setDraftStartDate(filters.startDate);
    setDraftEndDate(filters.endDate);
  }, [filters.startDate, filters.endDate]);

  const datesDirty =
    draftStartDate !== filters.startDate || draftEndDate !== filters.endDate;
  const canApply = Boolean(draftStartDate && draftEndDate) && datesDirty;

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

  const handleApplyDates = () => {
    if (!canApply) return;
    onFiltersChange({
      ...filters,
      startDate: draftStartDate,
      endDate: draftEndDate,
    });
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/50 bg-white/65 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_8px_24px_rgba(15,23,42,0.04)] backdrop-blur-xl backdrop-saturate-150",
        "dark:border-white/10 dark:bg-black/35 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
        "motion-reduce:backdrop-blur-none motion-reduce:bg-card",
        "[@media(prefers-reduced-transparency:reduce)]:bg-card [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none [@media(prefers-reduced-transparency:reduce)]:backdrop-saturate-100",
      )}
    >
      <div className="flex flex-col gap-3 lg:gap-6">
        <fieldset className="min-w-0">
          <legend className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Period
          </legend>
          <div className={wellClassName}>
            <IsoLinkedRangeStart
              startDate={draftStartDate}
              endDate={draftEndDate}
              onStartChange={setDraftStartDate}
              onEndChange={setDraftEndDate}
              ariaLabel="Start date"
              className={dateInputClassName}
              withPortal={false}
            />
            <span
              className="px-0.5 text-[13px] text-muted-foreground/50"
              aria-hidden
            >
              –
            </span>
            <IsoLinkedRangeEnd
              startDate={draftStartDate}
              endDate={draftEndDate}
              onEndChange={setDraftEndDate}
              ariaLabel="End date"
              className={dateInputClassName}
              withPortal={false}
            />
            <Button
              type="button"
              size="sm"
              onClick={handleApplyDates}
              disabled={!canApply}
              className={cn(
                "ml-0.5 h-8 rounded-lg px-3 text-[13px] font-medium",
                "transition-[transform,opacity] duration-100 ease-out",
                "active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100",
                canApply ? "opacity-100" : "opacity-40",
              )}
            >
              Apply
            </Button>
          </div>
        </fieldset>

        <fieldset className="min-w-0">
          <legend className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Scope
          </legend>
          <div className={wellClassName}>
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
    <div className="relative min-w-42 flex-1">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
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
  );
}

export default PlatformFeeFilters;
