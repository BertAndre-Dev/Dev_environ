"use client";

import { useMemo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const DISPLAY_DATE_FORMAT = "MMM d, yyyy";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const PAST_YEAR_SPAN = 30;
const FUTURE_YEAR_SPAN = 30;

const inputClassName =
  "h-10 rounded-md border border-border bg-background px-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary w-full max-w-full cursor-pointer placeholder:text-muted-foreground";

/** Shown next to every date field for consistent affordance. */
const datePickerIcon = (
  <Calendar
    className="h-4 w-4 shrink-0 text-muted-foreground cursor-pointer"
    aria-hidden
  />
);

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function buildYearOptions(
  viewYear: number,
  minDate?: Date | null,
  maxDate?: Date | null,
) {
  const nowYear = new Date().getFullYear();
  let start = Math.min(viewYear, nowYear) - PAST_YEAR_SPAN;
  let end = Math.max(viewYear, nowYear) + FUTURE_YEAR_SPAN;

  if (minDate) start = Math.min(start, minDate.getFullYear());
  if (maxDate) end = Math.max(end, maxDate.getFullYear());
  if (minDate) start = Math.max(start, minDate.getFullYear());
  if (maxDate) end = Math.min(end, maxDate.getFullYear());
  if (end < start) end = start;

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function monthAllowed(
  year: number,
  month: number,
  minDate?: Date | null,
  maxDate?: Date | null,
) {
  if (minDate) {
    const minBound = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    if (new Date(year, month, 1) < minBound) return false;
  }
  if (maxDate) {
    const maxBound = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);
    if (new Date(year, month, 1) > maxBound) return false;
  }
  return true;
}

type CustomHeaderProps = {
  date: Date;
  changeYear: (year: number) => void;
  changeMonth: (month: number) => void;
  decreaseMonth: () => void;
  increaseMonth: () => void;
  prevMonthButtonDisabled: boolean;
  nextMonthButtonDisabled: boolean;
  minDate?: Date | null;
  maxDate?: Date | null;
};

function DatePickerHeader({
  date,
  changeYear,
  changeMonth,
  decreaseMonth,
  increaseMonth,
  prevMonthButtonDisabled,
  nextMonthButtonDisabled,
  minDate,
  maxDate,
}: Readonly<CustomHeaderProps>) {
  const years = buildYearOptions(date.getFullYear(), minDate, maxDate);
  const year = date.getFullYear();

  return (
    <div className="iso-datepicker-custom-header flex items-center justify-between gap-2 px-1 pb-2">
      <button
        type="button"
        className="iso-datepicker-nav-btn"
        onClick={decreaseMonth}
        disabled={prevMonthButtonDisabled}
        aria-label="Previous month"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5">
        <select
          aria-label="Month"
          className="iso-datepicker-select"
          value={date.getMonth()}
          onChange={(e) => changeMonth(Number(e.target.value))}
        >
          {MONTHS.map((month, index) => (
            <option
              key={month}
              value={index}
              disabled={!monthAllowed(year, index, minDate, maxDate)}
            >
              {month}
            </option>
          ))}
        </select>
        <select
          aria-label="Year"
          className="iso-datepicker-select iso-datepicker-select-year"
          value={year}
          onChange={(e) => changeYear(Number(e.target.value))}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        className="iso-datepicker-nav-btn"
        onClick={increaseMonth}
        disabled={nextMonthButtonDisabled}
        aria-label="Next month"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function sharedPickerProps(
  minDate?: Date | null,
  maxDate?: Date | null,
  hasValue = false,
) {
  return {
    dateFormat: DISPLAY_DATE_FORMAT,
    showPopperArrow: false,
    // Empty: calendar icon. Selected: clear (X) only — never both at once.
    showIcon: !hasValue,
    toggleCalendarOnIconClick: true,
    icon: datePickerIcon,
    todayButton: "Jump to today",
    withPortal: true,
    shouldCloseOnSelect: true,
    isClearable: hasValue,
    fixedHeight: true,
    popperClassName: "iso-datepicker-popper",
    calendarClassName: "iso-datepicker-calendar",
    wrapperClassName: cn(
      "w-full iso-datepicker-wrapper",
      hasValue ? "iso-datepicker-has-value" : "iso-datepicker-empty",
    ),
    renderCustomHeader: (props: CustomHeaderProps) => (
      <DatePickerHeader {...props} minDate={minDate} maxDate={maxDate} />
    ),
  };
}

export function parseIsoToDate(value: string | undefined | null): Date | null {
  if (value == null || String(value).trim() === "") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value).trim());
  if (!m) return null;
  const y = Number(m[1]);
  const month = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, month, d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

export function dateToIsoString(d: Date | null): string {
  if (!d) return "";
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

/** Local calendar date for “today” as YYYY-MM-DD. */
export function todayIsoString() {
  return dateToIsoString(startOfDay(new Date()));
}

export type IsoDatePickerProps = {
  id?: string;
  value: string;
  onChange: (iso: string) => void;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
};

export function IsoDatePicker({
  id,
  value,
  onChange,
  placeholder = "Select a date",
  minDate,
  maxDate,
  disabled,
  className,
  ariaLabel,
}: Readonly<IsoDatePickerProps>) {
  const selected = parseIsoToDate(value);
  const min = useMemo(() => parseIsoToDate(minDate), [minDate]);
  const max = useMemo(() => parseIsoToDate(maxDate), [maxDate]);
  const openTo = selected ?? min ?? startOfDay(new Date());

  return (
    <DatePicker
      {...sharedPickerProps(min, max, Boolean(selected))}
      id={id}
      selected={selected}
      onChange={(d: Date | null) => onChange(dateToIsoString(d))}
      placeholderText={placeholder}
      minDate={min ?? undefined}
      maxDate={max ?? undefined}
      openToDate={openTo}
      disabled={disabled}
      className={cn(inputClassName, className)}
      ariaLabel={ariaLabel}
      autoComplete="off"
    />
  );
}

export type IsoDateRangePickerProps = {
  startDate: string;
  endDate: string;
  onStartChange: (iso: string) => void;
  onEndChange: (iso: string) => void;
  startId?: string;
  endId?: string;
  startAriaLabel?: string;
  endAriaLabel?: string;
  startPlaceholder?: string;
  endPlaceholder?: string;
  disabled?: boolean;
  className?: string;
};

type LinkedRangeBase = {
  startDate: string;
  endDate: string;
  onStartChange: (iso: string) => void;
  onEndChange: (iso: string) => void;
  disabled?: boolean;
  className?: string;
};

/** Start half of a linked range (pair with `IsoLinkedRangeEnd`). */
export function IsoLinkedRangeStart({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  id,
  ariaLabel,
  placeholder = "Select start date",
  minDate,
  disabled,
  className,
}: Omit<LinkedRangeBase, "onEndChange"> & {
  onEndChange?: (iso: string) => void;
  id?: string;
  ariaLabel?: string;
  placeholder?: string;
  minDate?: string;
}) {
  const s = parseIsoToDate(startDate);
  const e = parseIsoToDate(endDate);
  const min = parseIsoToDate(minDate);
  return (
    <DatePicker
      {...sharedPickerProps(min, e, Boolean(s))}
      id={id}
      selected={s}
      onChange={(d: Date | null) => {
        const next = dateToIsoString(d);
        onStartChange(next);
        // If new start is after current end, clear end so the range stays valid.
        if (d && e && d > e) {
          onEndChange?.("");
        }
      }}
      selectsStart
      startDate={s}
      endDate={e}
      minDate={min ?? undefined}
      openToDate={s ?? min ?? startOfDay(new Date())}
      placeholderText={placeholder}
      disabled={disabled}
      className={cn(inputClassName, className)}
      ariaLabel={ariaLabel}
      autoComplete="off"
    />
  );
}

/** End half of a linked range (pair with `IsoLinkedRangeStart`). */
export function IsoLinkedRangeEnd({
  startDate,
  endDate,
  onEndChange,
  id,
  ariaLabel,
  placeholder = "Select end date",
  disabled,
  className,
}: Omit<LinkedRangeBase, "onStartChange"> & {
  id?: string;
  ariaLabel?: string;
  placeholder?: string;
}) {
  const s = parseIsoToDate(startDate);
  const e = parseIsoToDate(endDate);
  return (
    <DatePicker
      {...sharedPickerProps(s, null, Boolean(e))}
      id={id}
      selected={e}
      onChange={(d: Date | null) => onEndChange(dateToIsoString(d))}
      selectsEnd
      startDate={s}
      endDate={e}
      minDate={s ?? undefined}
      openToDate={e ?? s ?? startOfDay(new Date())}
      placeholderText={placeholder}
      disabled={disabled}
      className={cn(inputClassName, className)}
      ariaLabel={ariaLabel}
      autoComplete="off"
    />
  );
}

/** Linked start/end pickers (`selectsStart` / `selectsEnd`). State remains YYYY-MM-DD strings at the boundary. */
export function IsoDateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  startId,
  endId,
  startAriaLabel,
  endAriaLabel,
  startPlaceholder,
  endPlaceholder,
  disabled,
  className,
}: Readonly<IsoDateRangePickerProps>) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <IsoLinkedRangeStart
        id={startId}
        startDate={startDate}
        endDate={endDate}
        onStartChange={onStartChange}
        onEndChange={onEndChange}
        ariaLabel={startAriaLabel}
        placeholder={startPlaceholder}
        disabled={disabled}
        className={className}
      />
      <IsoLinkedRangeEnd
        id={endId}
        startDate={startDate}
        endDate={endDate}
        onEndChange={onEndChange}
        ariaLabel={endAriaLabel}
        placeholder={endPlaceholder}
        disabled={disabled}
        className={className}
      />
    </div>
  );
}
