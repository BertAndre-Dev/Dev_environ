"use client";

import { Calendar } from "lucide-react";
import {
  IsoLinkedRangeEnd,
  IsoLinkedRangeStart,
} from "@/components/ui/iso-date-picker";
import { getDateRangePlaceholders } from "@/lib/date-range-placeholders";

const inputClassName =
  "px-3 py-2 border rounded-lg text-sm cursor-pointer min-w-[140px]";

type DateRangeFilterProps = {
  startDate: string;
  endDate: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  startPlaceholder?: string;
  endPlaceholder?: string;
  startId?: string;
  endId?: string;
};

/** Same From / to / To control used on super-admin transactions. */
export function DateRangeFilter({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  startPlaceholder,
  endPlaceholder,
  startId,
  endId,
}: Readonly<DateRangeFilterProps>) {
  const examples = getDateRangePlaceholders();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Calendar
        className="h-4 w-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
      <IsoLinkedRangeStart
        id={startId}
        startDate={startDate}
        endDate={endDate}
        onStartChange={onStartChange}
        onEndChange={onEndChange}
        className={inputClassName}
        ariaLabel="From Date"
        placeholder={startPlaceholder ?? examples.start}
      />
      <span className="text-sm text-muted-foreground">to</span>
      <IsoLinkedRangeEnd
        id={endId}
        startDate={startDate}
        endDate={endDate}
        onEndChange={onEndChange}
        className={inputClassName}
        ariaLabel="To Date"
        placeholder={endPlaceholder ?? examples.end}
      />
    </div>
  );
}
