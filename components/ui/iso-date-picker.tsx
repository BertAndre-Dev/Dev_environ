"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const DISPLAY_DATE_FORMAT = "MMM d, yyyy";
const DISPLAY_DATETIME_FORMAT = "MMM d, yyyy h:mm aa";
const TIME_INTERVALS_MINUTES = 15;

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
  "h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary w-full max-w-full cursor-pointer placeholder:text-muted-foreground";

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

function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Round up to the next time-interval boundary (e.g. 15 min). */
function ceilToInterval(d: Date, intervalMinutes = TIME_INTERVALS_MINUTES) {
  const ms = intervalMinutes * 60 * 1000;
  return new Date(Math.ceil(d.getTime() / ms) * ms);
}

function withTimeOfDay(day: Date, hours: number, minutes: number) {
  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    hours,
    minutes,
    0,
    0,
  );
}

/**
 * Earliest selectable instant for a datetime field.
 * When `floor` is set (e.g. range start), the result is max(now, floor).
 */
export function earliestSelectableDateTime(floor?: Date | null): Date {
  const nowCeil = ceilToInterval(new Date());
  if (!floor) return nowCeil;
  return floor.getTime() > nowCeil.getTime() ? floor : nowCeil;
}

/** Keep a picked datetime at or after `minBound`; bump midnight→next slot when needed. */
function clampDateTime(d: Date, minBound: Date | null): Date {
  if (!minBound) return d;
  if (d.getTime() >= minBound.getTime()) return d;
  if (isSameLocalDay(d, minBound)) return new Date(minBound);
  // Picked a past calendar day — shouldn't happen with minDate, but snap forward.
  return new Date(minBound);
}

function timeBoundsForDay(day: Date, minBound: Date | null) {
  const dayStart = withTimeOfDay(day, 0, 0);
  const dayEnd = withTimeOfDay(day, 23, 45);
  if (!minBound || !isSameLocalDay(day, minBound)) {
    return { minTime: dayStart, maxTime: dayEnd };
  }
  const minTime =
    minBound.getTime() > dayEnd.getTime() ? dayEnd : minBound;
  return { minTime, maxTime: dayEnd };
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

type SharedPickerOptions = {
  minDate?: Date | null;
  maxDate?: Date | null;
  hasValue?: boolean;
  withPortal?: boolean;
  includeTime?: boolean;
  /** Absolute earliest selectable moment (filters past times on that day). */
  minDateTime?: Date | null;
  /** Day currently shown/selected — drives which times are listed. */
  selectedDay?: Date | null;
  open?: boolean;
  onCalendarOpen?: () => void;
  onCalendarClose?: () => void;
  onInputClick?: () => void;
};

function DatetimeDoneFooter({ onDone }: Readonly<{ onDone: () => void }>) {
  return (
    <div className="iso-datepicker-time-footer">
      <p className="iso-datepicker-time-hint">Pick a time to finish</p>
      <button
        type="button"
        className="iso-datepicker-done-btn"
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onClick={onDone}
      >
        Done
      </button>
    </div>
  );
}

/** Stable calendar shell — avoids remounting (which was clearing the value). */
function DatetimeCalendarContainer({
  className,
  children,
  onDone,
}: Readonly<{
  className?: string;
  children?: ReactNode;
  onDone: () => void;
}>) {
  return (
    <div className={className}>
      {children}
      <DatetimeDoneFooter onDone={onDone} />
    </div>
  );
}

/** Event shape passed by react-datepicker onChange (typed for strict builds). */
type DatePickerSelectEvent = { target?: EventTarget | null } | undefined;

/** True when the change came from clicking a time slot (not a calendar day). */
function isTimeListSelection(event?: DatePickerSelectEvent) {
  const target = event?.target;
  if (!target || !(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      ".react-datepicker__time-list-item, .react-datepicker__time-container",
    ),
  );
}

function usePickerOpenState(includeTime: boolean) {
  const [open, setOpen] = useState(false);
  const pendingRef = useRef<Date | null>(null);
  const onDoneRef = useRef<() => void>(() => setOpen(false));

  const close = useCallback(() => setOpen(false), []);
  const openCalendar = useCallback(() => setOpen(true), []);

  const calendarContainer = useMemo(() => {
    if (!includeTime) return undefined;
    function CalendarContainer({
      className,
      children,
    }: {
      className?: string;
      children?: ReactNode;
    }) {
      return (
        <DatetimeCalendarContainer
          className={className}
          onDone={() => onDoneRef.current()}
        >
          {children}
        </DatetimeCalendarContainer>
      );
    }
    return CalendarContainer;
  }, [includeTime]);

  return {
    open,
    setOpen,
    close,
    openCalendar,
    pendingRef,
    onDoneRef,
    calendarContainer,
  };
}

function sharedPickerProps({
  minDate,
  maxDate,
  hasValue = false,
  withPortal = true,
  includeTime = false,
  minDateTime = null,
  selectedDay = null,
  open,
  onCalendarOpen,
  onCalendarClose,
  onInputClick,
}: SharedPickerOptions) {
  const dayForBounds = selectedDay ?? minDateTime ?? new Date();
  const { minTime, maxTime } = includeTime
    ? timeBoundsForDay(dayForBounds, minDateTime)
    : { minTime: undefined, maxTime: undefined };

  return {
    dateFormat: includeTime ? DISPLAY_DATETIME_FORMAT : DISPLAY_DATE_FORMAT,
    showPopperArrow: false,
    showIcon: !hasValue,
    toggleCalendarOnIconClick: true,
    icon: datePickerIcon,
    withPortal,
    shouldCloseOnSelect: !includeTime,
    isClearable: hasValue,
    fixedHeight: !includeTime,
    showTimeSelect: includeTime,
    timeIntervals: includeTime ? TIME_INTERVALS_MINUTES : undefined,
    timeCaption: includeTime ? "Time" : undefined,
    timeFormat: includeTime ? "h:mm aa" : undefined,
    ...(includeTime && minTime && maxTime
      ? {
          minTime,
          maxTime,
          filterTime: (time: Date) => {
            if (!minDateTime) return true;
            return time.getTime() >= minDateTime.getTime();
          },
        }
      : {}),
    open,
    onCalendarOpen,
    onCalendarClose,
    onInputClick,
    popperClassName: "iso-datepicker-popper",
    calendarClassName: cn(
      "iso-datepicker-calendar",
      includeTime && "iso-datepicker-calendar-time",
    ),
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
  const trimmed = String(value).trim();
  const local = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(
    trimmed,
  );
  if (local) {
    const dt = new Date(
      Number(local[1]),
      Number(local[2]) - 1,
      Number(local[3]),
      Number(local[4] ?? 0),
      Number(local[5] ?? 0),
      Number(local[6] ?? 0),
    );
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  // Absolute ISO (e.g. from API) — convert into a local Date for the picker.
  if (trimmed.includes("T")) {
    const dt = new Date(trimmed);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  return null;
}

export function dateToIsoString(d: Date | null): string {
  if (!d) return "";
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

/** Local date+time as `YYYY-MM-DDTHH:mm` for datetime pickers. */
export function dateToIsoDateTimeString(d: Date | null): string {
  if (!d) return "";
  const h = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dateToIsoString(d)}T${h}:${mi}`;
}

/** Local calendar date for “today” as YYYY-MM-DD. */
export function todayIsoString() {
  return dateToIsoString(startOfDay(new Date()));
}

/** Convert a picker value (`YYYY-MM-DD` or `YYYY-MM-DDTHH:mm`) to API ISO UTC. */
export function localPickerValueToApiIso(value: string): string | null {
  const d = parseIsoToDate(value);
  if (!d) return null;
  return d.toISOString();
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
  /** When true, value is `YYYY-MM-DDTHH:mm` and the calendar includes a time list. */
  includeTime?: boolean;
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
  includeTime = false,
}: Readonly<IsoDatePickerProps>) {
  const selected = parseIsoToDate(value);
  const min = useMemo(() => parseIsoToDate(minDate), [minDate]);
  const max = useMemo(() => parseIsoToDate(maxDate), [maxDate]);
  const minDateTime = includeTime ? earliestSelectableDateTime(min) : null;
  const {
    open,
    setOpen,
    openCalendar,
    pendingRef,
    onDoneRef,
    calendarContainer,
  } = usePickerOpenState(includeTime);

  const commit = useCallback(
    (d: Date | null) => {
      if (!d) {
        onChange("");
        pendingRef.current = null;
        return;
      }
      const next = includeTime ? clampDateTime(d, minDateTime) : d;
      pendingRef.current = next;
      onChange(
        includeTime ? dateToIsoDateTimeString(next) : dateToIsoString(next),
      );
    },
    [includeTime, minDateTime, onChange, pendingRef],
  );

  onDoneRef.current = () => {
    if (pendingRef.current) commit(pendingRef.current);
    else if (selected) commit(selected);
    setOpen(false);
  };

  const dayForBounds = selected ?? minDateTime ?? new Date();
  const openTo =
    selected ??
    minDateTime ??
    (includeTime ? new Date() : startOfDay(new Date()));

  return (
    <DatePicker
      {...sharedPickerProps({
        minDate: min,
        maxDate: max,
        hasValue: Boolean(selected),
        withPortal,
        includeTime,
        minDateTime,
        selectedDay: dayForBounds,
        open,
        onCalendarOpen: openCalendar,
        onCalendarClose: () => setOpen(false),
        onInputClick: openCalendar,
      })}
      id={id}
      selected={selected}
      onChange={(d: Date | null, event: DatePickerSelectEvent) => {
        // Ignore spurious nulls while open (remount / internal resets).
        if (!d) {
          if (open) return;
          commit(null);
          return;
        }
        commit(d);
        if (!includeTime || isTimeListSelection(event)) setOpen(false);
      }}
      placeholderText={placeholder}
      minDate={
        includeTime && minDateTime
          ? startOfDay(minDateTime)
          : (min ?? undefined)
      }
      maxDate={max ?? undefined}
      openToDate={openTo}
      disabled={disabled}
      className={cn(inputClassName, className)}
      ariaLabel={ariaLabel}
      autoComplete="off"
      calendarContainer={calendarContainer}
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
  includeTime = false,
}: Omit<LinkedRangeBase, "onEndChange"> & {
  onEndChange?: (iso: string) => void;
  id?: string;
  ariaLabel?: string;
  placeholder?: string;
  minDate?: string;
  includeTime?: boolean;
}) {
  const s = parseIsoToDate(startDate);
  const e = parseIsoToDate(endDate);
  const min = parseIsoToDate(minDate);
  const minDateTime = includeTime ? earliestSelectableDateTime(min) : null;
  const format = includeTime ? dateToIsoDateTimeString : dateToIsoString;
  const {
    open,
    setOpen,
    openCalendar,
    pendingRef,
    onDoneRef,
    calendarContainer,
  } = usePickerOpenState(includeTime);

  const commit = useCallback(
    (d: Date | null) => {
      if (!d) {
        onStartChange("");
        pendingRef.current = null;
        return;
      }
      const next = includeTime ? clampDateTime(d, minDateTime) : d;
      pendingRef.current = next;
      onStartChange(format(next));
      if (e && next > e) onEndChange?.("");
    },
    [e, format, includeTime, minDateTime, onEndChange, onStartChange, pendingRef],
  );

  onDoneRef.current = () => {
    if (pendingRef.current) commit(pendingRef.current);
    else if (s) commit(s);
    setOpen(false);
  };

  const dayForBounds = s ?? minDateTime ?? new Date();

  return (
    <DatePicker
      {...sharedPickerProps({
        minDate: minDateTime ? startOfDay(minDateTime) : min,
        maxDate: e,
        hasValue: Boolean(s),
        withPortal,
        includeTime,
        minDateTime,
        selectedDay: dayForBounds,
        open,
        onCalendarOpen: openCalendar,
        onCalendarClose: () => setOpen(false),
        onInputClick: openCalendar,
      })}
      id={id}
      selected={s}
      onChange={(d: Date | null, event: DatePickerSelectEvent) => {
        if (!d) {
          if (open) return;
          commit(null);
          return;
        }
        commit(d);
        if (!includeTime || isTimeListSelection(event)) setOpen(false);
      }}
      selectsStart
      startDate={s}
      endDate={e}
      minDate={
        includeTime && minDateTime
          ? startOfDay(minDateTime)
          : (min ?? undefined)
      }
      openToDate={
        s ?? minDateTime ?? (includeTime ? new Date() : startOfDay(new Date()))
      }
      placeholderText={placeholder}
      disabled={disabled}
      className={cn(inputClassName, className)}
      ariaLabel={ariaLabel}
      autoComplete="off"
      calendarContainer={calendarContainer}
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
  includeTime = false,
}: Omit<LinkedRangeBase, "onStartChange"> & {
  id?: string;
  ariaLabel?: string;
  placeholder?: string;
  includeTime?: boolean;
}) {
  const s = parseIsoToDate(startDate);
  const e = parseIsoToDate(endDate);
  const minDateTime = includeTime ? earliestSelectableDateTime(s) : null;
  const format = includeTime ? dateToIsoDateTimeString : dateToIsoString;
  const {
    open,
    setOpen,
    openCalendar,
    pendingRef,
    onDoneRef,
    calendarContainer,
  } = usePickerOpenState(includeTime);

  const commit = useCallback(
    (d: Date | null) => {
      if (!d) {
        onEndChange("");
        pendingRef.current = null;
        return;
      }
      const next = includeTime ? clampDateTime(d, minDateTime) : d;
      pendingRef.current = next;
      onEndChange(format(next));
    },
    [format, includeTime, minDateTime, onEndChange, pendingRef],
  );

  onDoneRef.current = () => {
    if (pendingRef.current) commit(pendingRef.current);
    else if (e) commit(e);
    setOpen(false);
  };

  const dayForBounds = e ?? s ?? minDateTime ?? new Date();

  return (
    <DatePicker
      {...sharedPickerProps({
        minDate: includeTime && minDateTime ? startOfDay(minDateTime) : s,
        maxDate: null,
        hasValue: Boolean(e),
        withPortal,
        includeTime,
        minDateTime,
        selectedDay: dayForBounds,
        open,
        onCalendarOpen: openCalendar,
        onCalendarClose: () => setOpen(false),
        onInputClick: openCalendar,
      })}
      id={id}
      selected={e}
      onChange={(d: Date | null, event: DatePickerSelectEvent) => {
        if (!d) {
          if (open) return;
          commit(null);
          return;
        }
        commit(d);
        if (!includeTime || isTimeListSelection(event)) setOpen(false);
      }}
      selectsEnd
      startDate={s}
      endDate={e}
      minDate={
        includeTime && minDateTime
          ? startOfDay(minDateTime)
          : (s ?? undefined)
      }
      openToDate={
        e ?? s ?? (includeTime ? new Date() : startOfDay(new Date()))
      }
      placeholderText={placeholder}
      disabled={disabled}
      className={cn(inputClassName, className)}
      ariaLabel={ariaLabel}
      autoComplete="off"
      calendarContainer={calendarContainer}
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
