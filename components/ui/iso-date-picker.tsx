"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
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

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const PAST_YEAR_SPAN = 30;
const FUTURE_YEAR_SPAN = 30;
const YEAR_PAGE_SIZE = 12;

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
  const month = date.getMonth();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [openPanel, setOpenPanel] = useState<"month" | "year" | null>(null);
  const selectedPage = Math.max(
    0,
    Math.floor(Math.max(0, years.indexOf(year)) / YEAR_PAGE_SIZE) *
      YEAR_PAGE_SIZE,
  );
  const [pageIndex, setPageIndex] = useState(selectedPage);

  useEffect(() => {
    if (openPanel === "year") setPageIndex(selectedPage);
  }, [openPanel, selectedPage]);

  useEffect(() => {
    if (!openPanel) return;
    const onDoc = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpenPanel(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [openPanel]);

  const pageYears = years.slice(pageIndex, pageIndex + YEAR_PAGE_SIZE);
  const canPrev = pageIndex > 0;
  const canNext = pageIndex + YEAR_PAGE_SIZE < years.length;
  const rangeLabel = pageYears.length
    ? `${pageYears[0]}–${pageYears[pageYears.length - 1]}`
    : "";

  return (
    <div
      className="iso-datepicker-custom-header relative flex items-center justify-between gap-1 px-0.5 pb-2 sm:gap-2"
      ref={wrapRef}
    >
      <button
        type="button"
        className="iso-datepicker-nav-btn"
        onClick={decreaseMonth}
        disabled={prevMonthButtonDisabled}
        aria-label="Previous month"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="flex min-w-0 flex-1 items-center justify-center gap-1 sm:gap-1.5">
        <button
          type="button"
          aria-label="Month"
          aria-haspopup="listbox"
          aria-expanded={openPanel === "month"}
          className="iso-datepicker-month-trigger"
          onMouseDown={(event) => event.stopPropagation()}
          onClick={() =>
            setOpenPanel((value) => (value === "month" ? null : "month"))
          }
        >
          <span>{MONTHS_SHORT[month]}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
        </button>
        <button
          type="button"
          aria-label="Year"
          aria-haspopup="listbox"
          aria-expanded={openPanel === "year"}
          className="iso-datepicker-year-trigger"
          onMouseDown={(event) => event.stopPropagation()}
          onClick={() =>
            setOpenPanel((value) => (value === "year" ? null : "year"))
          }
        >
          <span>{year}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
        </button>
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

      {openPanel === "month" ? (
        <div
          className="iso-datepicker-year-panel"
          role="listbox"
          aria-label="Choose month"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="grid grid-cols-3 gap-1">
            {MONTHS_SHORT.map((label, index) => {
              const allowed = monthAllowed(year, index, minDate, maxDate);
              return (
                <button
                  key={MONTHS[index]}
                  type="button"
                  role="option"
                  aria-selected={index === month}
                  disabled={!allowed}
                  className={cn(
                    "iso-datepicker-year-option",
                    index === month && "is-selected",
                  )}
                  onClick={() => {
                    changeMonth(index);
                    setOpenPanel(null);
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {openPanel === "year" ? (
        <div
          className="iso-datepicker-year-panel"
          role="listbox"
          aria-label="Choose year"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="mb-2 flex items-center justify-between gap-1">
            <button
              type="button"
              className="iso-datepicker-nav-btn"
              onClick={() =>
                setPageIndex((index) => Math.max(0, index - YEAR_PAGE_SIZE))
              }
              disabled={!canPrev}
              aria-label="Earlier years"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="min-w-0 truncate text-xs font-medium text-foreground">
              {rangeLabel}
            </p>
            <button
              type="button"
              className="iso-datepicker-nav-btn"
              onClick={() =>
                setPageIndex((index) =>
                  Math.min(
                    Math.max(0, years.length - YEAR_PAGE_SIZE),
                    index + YEAR_PAGE_SIZE,
                  ),
                )
              }
              disabled={!canNext}
              aria-label="Later years"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {pageYears.map((option) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={option === year}
                className={cn(
                  "iso-datepicker-year-option",
                  option === year && "is-selected",
                )}
                onClick={() => {
                  changeYear(option);
                  setOpenPanel(null);
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function sharedPickerProps(
  minDate?: Date | null,
  maxDate?: Date | null,
  hasValue = false,
  withPortal = true,
) {
  return {
    dateFormat: DISPLAY_DATE_FORMAT,
    showPopperArrow: false,
    // Empty: calendar icon. Selected: clear (X) only — never both at once.
    showIcon: !hasValue,
    toggleCalendarOnIconClick: true,
    icon: datePickerIcon,
    withPortal,
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
  /** When false, the calendar opens next to the input instead of a page overlay. */
  withPortal?: boolean;
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
  withPortal = true,
}: Readonly<IsoDatePickerProps>) {
  const selected = parseIsoToDate(value);
  const min = useMemo(() => parseIsoToDate(minDate), [minDate]);
  const max = useMemo(() => parseIsoToDate(maxDate), [maxDate]);
  const openTo = selected ?? min ?? startOfDay(new Date());

  return (
    <DatePicker
      {...sharedPickerProps(min, max, Boolean(selected), withPortal)}
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
  withPortal?: boolean;
};

/** Start half of a linked range (pair with `IsoLinkedRangeEnd`). */
export function IsoLinkedRangeStart({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  id,
  ariaLabel,
  placeholder = "Start date",
  minDate,
  disabled,
  className,
  withPortal = true,
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
      {...sharedPickerProps(min, e, Boolean(s), withPortal)}
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
  placeholder = "End date",
  disabled,
  className,
  withPortal = true,
}: Omit<LinkedRangeBase, "onStartChange"> & {
  id?: string;
  ariaLabel?: string;
  placeholder?: string;
}) {
  const s = parseIsoToDate(startDate);
  const e = parseIsoToDate(endDate);
  return (
    <DatePicker
      {...sharedPickerProps(s, null, Boolean(e), withPortal)}
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
