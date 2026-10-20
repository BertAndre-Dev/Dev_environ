"use client";

import { Calendar } from "lucide-react";
import {
  IsoLinkedRangeEnd,
  IsoLinkedRangeStart,
} from "@/components/ui/iso-date-picker";
import { getDateRangePlaceholders } from "@/lib/date-range-placeholders";

const inputClassName =
  "w-full min-w-0 px-3 py-2 border rounded-lg text-sm cursor-pointer";

const fieldClassName =
  "min-w-0 w-full @min-[24rem]/date-range:w-auto @min-[24rem]/date-range:min-w-36 @min-[24rem]/date-range:max-w-48 @min-[24rem]/date-range:flex-1 md:w-40 md:max-w-none md:flex-none";

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
    <div className="w-full min-w-0 md:w-fit">
      <div className="@container/date-range w-full md:contents">
        <div className="flex w-full min-w-0 flex-col gap-2 @min-[24rem]/date-range:flex-row @min-[24rem]/date-range:items-center md:w-auto md:flex-row md:items-center">
          <Calendar
            className="hidden h-4 w-4 shrink-0 text-muted-foreground @min-[24rem]/date-range:block md:block"
            aria-hidden
          />
          <div className={fieldClassName}>
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
          </div>
          <span className="text-sm text-muted-foreground">to</span>
          <div className={fieldClassName}>
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
        </div>
      </div>
    </div>
  );
}
