"use client";

import React, { useEffect, useMemo, useRef } from "react";

import { Card } from "@/components/ui/card";
import { getDateRangePlaceholders } from "@/lib/date-range-placeholders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  IsoLinkedRangeEnd,
  IsoLinkedRangeStart,
} from "@/components/ui/iso-date-picker";

export interface RevenueFiltersBarProps {
  startDate: string;
  endDate: string;
  search: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onResetDates: () => void;
  onSearchChange: (value: string) => void;
  defaultDateRangeDays?: number;
}

export function RevenueFiltersBar({
  startDate,
  endDate,
  search,
  onStartDateChange,
  onEndDateChange,
  onResetDates,
  onSearchChange,
  defaultDateRangeDays = 30,
}: Readonly<RevenueFiltersBarProps>) {
  const didInitDefaultRangeRef = useRef(false);
  const exampleDateRange = useMemo(() => getDateRangePlaceholders(), []);
  const showExamplePlaceholders = !defaultDateRangeDays;

  useEffect(() => {
    if (!defaultDateRangeDays) return;
    if (didInitDefaultRangeRef.current) return;
    if (startDate || endDate) return;

    didInitDefaultRangeRef.current = true;

    const now = new Date();
    const end = new Date(now);
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() - defaultDateRangeDays);

    const toIso = (d: Date) =>
      new Date(
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
      )
        .toISOString()
        .slice(0, 10);

    onStartDateChange(toIso(start));
    onEndDateChange(toIso(end));
  }, [
    defaultDateRangeDays,
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
  ]);

  return (
    <Card className="mt-0 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground" htmlFor="rh-start-date">
              From
            </label>
            <IsoLinkedRangeStart
              id="rh-start-date"
              startDate={startDate}
              endDate={endDate}
              onStartChange={onStartDateChange}
              placeholder={
                showExamplePlaceholders ? exampleDateRange.start : undefined
              }
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground" htmlFor="rh-end-date">
              To
            </label>
            <IsoLinkedRangeEnd
              id="rh-end-date"
              startDate={startDate}
              endDate={endDate}
              onEndChange={onEndDateChange}
              placeholder={
                showExamplePlaceholders ? exampleDateRange.end : undefined
              }
            />
          </div>
          {startDate && endDate && (
            <Button type="button" size="sm" variant="outline" onClick={onResetDates}>
              Reset
            </Button>
          )}
        </div>

        <div className="w-full lg:w-[250px] xl:w-[300px]">
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search revenue heads by name"
          />
        </div>
      </div>
    </Card>
  );
}

