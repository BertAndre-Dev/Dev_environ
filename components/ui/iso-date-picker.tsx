"use client";

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

const YEAR_RANGE = 40;

const inputClassName =
  "h-9 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary w-full max-w-full cursor-pointer placeholder:text-muted-foreground";

/** Shown next to every date field for consistent affordance. */
const datePickerIcon = (
  <Calendar
    className="h-4 w-4 shrink-0 text-muted-foreground cursor-pointer"
    aria-hidden
  />
);

function buildYearOptions(centerYear: number) {
  const start = centerYear - Math.floor(YEAR_RANGE / 2);
  return Array.from({ length: YEAR_RANGE }, (_, i) => start + i);
}

type CustomHeaderProps = {
  date: Date;
  changeYear: (year: number) => void;
  changeMonth: (month: number) => void;
  decreaseMonth: () => void;
  increaseMonth: () => void;
  prevMonthButtonDisabled: boolean;
  nextMonthButtonDisabled: boolean;
};

function DatePickerHeader({
  date,
  changeYear,
  changeMonth,
  decreaseMonth,
  increaseMonth,
  prevMonthButtonDisabled,
  nextMonthButtonDisabled,
}: Readonly<CustomHeaderProps>) {
  const years = buildYearOptions(date.getFullYear());

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
            <option key={month} value={index}>
              {month}
            </option>
          ))}
        </select>
        <select
          aria-label="Year"
          className="iso-datepicker-select"
          value={date.getFullYear()}
          onChange={(e) => changeYear(Number(e.target.value))}
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
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

const sharedPickerProps = {
  dateFormat: DISPLAY_DATE_FORMAT,
  showPopperArrow: false,
  showIcon: true,
  toggleCalendarOnIconClick: true,
  icon: datePickerIcon,
  todayButton: "Today",
  withPortal: true,
  shouldCloseOnSelect: true,
  isClearable: true,
  fixedHeight: true,
  popperClassName: "iso-datepicker-popper",
  calendarClassName: "iso-datepicker-calendar",
  renderCustomHeader: (props: CustomHeaderProps) => (
    <DatePickerHeader {...props} />
  ),
};

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
  placeholder = "Select date",
  minDate,
  maxDate,
  disabled,
  className,
  ariaLabel,
}: Readonly<IsoDatePickerProps>) {
  const selected = parseIsoToDate(value);
  return (
    <DatePicker
      {...sharedPickerProps}
      id={id}
      selected={selected}
      onChange={(d: Date | null) => onChange(dateToIsoString(d))}
      placeholderText={placeholder}
      minDate={parseIsoToDate(minDate) ?? undefined}
      maxDate={parseIsoToDate(maxDate) ?? undefined}
      openToDate={selected ?? undefined}
      disabled={disabled}
      className={cn(inputClassName, className)}
      wrapperClassName="w-full"
      ariaLabel={ariaLabel}
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
  disabled,
  className,
}: Omit<LinkedRangeBase, "onEndChange"> & {
  onEndChange?: (iso: string) => void;
  id?: string;
  ariaLabel?: string;
  placeholder?: string;
}) {
  const s = parseIsoToDate(startDate);
  const e = parseIsoToDate(endDate);
  return (
    <DatePicker
      {...sharedPickerProps}
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
      openToDate={s ?? new Date()}
      placeholderText={placeholder}
      disabled={disabled}
      className={cn(inputClassName, className)}
      wrapperClassName="w-full"
      ariaLabel={ariaLabel}
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
      {...sharedPickerProps}
      id={id}
      selected={e}
      onChange={(d: Date | null) => onEndChange(dateToIsoString(d))}
      selectsEnd
      startDate={s}
      endDate={e}
      minDate={s ?? undefined}
      openToDate={e ?? s ?? new Date()}
      placeholderText={placeholder}
      disabled={disabled}
      className={cn(inputClassName, className)}
      wrapperClassName="w-full"
      ariaLabel={ariaLabel}
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
