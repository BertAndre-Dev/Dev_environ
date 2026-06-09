"use client";

import { useId, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  computeNiceAxisMax,
  formatAmountNairaCompact,
  formatEnergyTooltipDate,
  type EnergyConsumptionDataPoint,
  type EnergyConsumptionPeriod,
} from "@/lib/energy-consumption-chart";

export type { EnergyConsumptionDataPoint, EnergyConsumptionPeriod };

const UNITS_COLOR = "#0150AC";
const AMOUNT_COLOR = "#F472B6";

const PERIOD_OPTIONS: { label: string; value: EnergyConsumptionPeriod }[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

export interface EnergyConsumptionOverTimeCardProps {
  readonly title?: string;
  readonly data: EnergyConsumptionDataPoint[];
  readonly loading?: boolean;
  readonly emptyMessage?: string;
  readonly className?: string;
  readonly period?: EnergyConsumptionPeriod;
  readonly onPeriodChange?: (period: EnergyConsumptionPeriod) => void;
  readonly showAddressFilter?: boolean;
  readonly addressOptions?: readonly { label: string; value: string }[];
  readonly addressValue?: string;
  readonly onAddressChange?: (value: string) => void;
  readonly addressFilterLabel?: string;
  readonly addressFilterLoading?: boolean;
  /** @deprecated Use addressOptions */
  readonly apartmentOptions?: readonly { label: string; value: string }[];
  readonly blockOptions?: readonly { label: string; value: string }[];
  readonly blockValue?: string;
  /** @deprecated Use addressValue */
  readonly apartmentValue?: string;
  readonly onBlockChange?: (value: string) => void;
  /** @deprecated Use onAddressChange */
  readonly onApartmentChange?: (value: string) => void;
}

function formatUnitsAxisTick(value: number): string {
  return String(value);
}

function formatAmountAxisTick(value: number): string {
  if (value >= 1_000) return `${Math.round(value / 1_000).toLocaleString()},000`;
  return value.toLocaleString();
}

type ChartTooltipProps = Readonly<{
  active?: boolean;
  payload?: ReadonlyArray<{
    dataKey?: string;
    value?: number;
    color?: string;
    payload?: EnergyConsumptionDataPoint;
  }>;
}>;

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  const unitsEntry = payload.find((p) => p.dataKey === "unitsKwh");
  const amountEntry = payload.find((p) => p.dataKey === "amountNaira");

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-lg">
      <p className="mb-2 font-medium text-foreground">
        {formatEnergyTooltipDate(point.date)}
      </p>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="size-2 shrink-0 rounded-full bg-[#0150AC]" />
          <span className="text-muted-foreground">Units Vended (kWh)</span>
          <span className="ml-auto font-semibold tabular-nums text-foreground">
            {unitsEntry?.value ?? point.unitsKwh} kWh
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2 shrink-0 rounded-full bg-[#F472B6]" />
          <span className="text-muted-foreground">Amount Vended (₦)</span>
          <span className="ml-auto font-semibold tabular-nums text-foreground">
            {formatAmountNairaCompact(amountEntry?.value ?? point.amountNaira)}
          </span>
        </div>
      </div>
    </div>
  );
}

function PeriodSegmentedControl({
  value,
  onChange,
}: Readonly<{
  value: EnergyConsumptionPeriod;
  onChange: (period: EnergyConsumptionPeriod) => void;
}>) {
  return (
    <div className="inline-flex rounded-full border border-input bg-muted/30">
      {PERIOD_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer hover:cursor-pointer",
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

function FilterSelect({
  label,
  options,
  value,
  onChange,
  id,
  disabled = false,
}: Readonly<{
  label: string;
  options: readonly { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  id: string;
  disabled?: boolean;
}>) {
  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <Select
          id={id}
          aria-label={label}
          options={options}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-[120px] max-w-[120px] shrink-0 appearance-none rounded-full border-input px-2 pr-7 text-xs sm:text-sm cursor-pointer hover:cursor-pointer"
        />
        <ChevronDown
          className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground hover:cursor-pointer"
          aria-hidden
        />
      </div>
    </div>
  );
}

export function EnergyConsumptionOverTimeCard({
  title = "Vending Over Time",
  data,
  loading = false,
  emptyMessage = "No vending data to display",
  className,
  period: controlledPeriod,
  onPeriodChange,
  showAddressFilter = false,
  addressOptions,
  addressValue,
  onAddressChange,
  addressFilterLabel = "Address",
  addressFilterLoading = false,
  blockOptions,
  apartmentOptions,
  blockValue,
  apartmentValue,
  onBlockChange,
  onApartmentChange,
}: EnergyConsumptionOverTimeCardProps) {
  const resolvedAddressOptions = addressOptions ?? apartmentOptions;
  const resolvedAddressValue = addressValue ?? apartmentValue ?? "all";
  const resolvedOnAddressChange = onAddressChange ?? onApartmentChange;
  const [internalPeriod, setInternalPeriod] =
    useState<EnergyConsumptionPeriod>("weekly");
  const period = controlledPeriod ?? internalPeriod;

  const handlePeriodChange = (next: EnergyConsumptionPeriod) => {
    if (controlledPeriod === undefined) setInternalPeriod(next);
    onPeriodChange?.(next);
  };

  const unitsGradientId = useId().replaceAll(":", "");
  const amountGradientId = useId().replaceAll(":", "");

  const unitsMax = useMemo(
    () => computeNiceAxisMax(data.map((d) => d.unitsKwh), 20, 100),
    [data],
  );
  const amountMax = useMemo(
    () => computeNiceAxisMax(data.map((d) => d.amountNaira), 2000, 10000),
    [data],
  );

  const unitsTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let v = 0; v <= unitsMax; v += unitsMax / 5) {
      ticks.push(Math.round(v));
    }
    return ticks;
  }, [unitsMax]);

  const amountTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let v = 0; v <= amountMax; v += amountMax / 5) {
      ticks.push(Math.round(v));
    }
    return ticks;
  }, [amountMax]);

  const showBlockFilter = (blockOptions?.length ?? 0) > 0;
  const showAddressFilterControl =
    showAddressFilter ||
    Boolean(resolvedOnAddressChange && (resolvedAddressOptions?.length ?? 0) > 0);
  const addressSelectOptions = useMemo(() => {
    if (addressFilterLoading) {
      return [{ label: "Loading addresses…", value: "all" }];
    }
    if (resolvedAddressOptions?.length) return resolvedAddressOptions;
    return [{ label: "All addresses", value: "all" }];
  }, [addressFilterLoading, resolvedAddressOptions]);
  const hasChartData = data.length > 0;

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-sm",
        className,
      )}
    >
      <div className="flex flex-col gap-4 border-b border-border px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
              {title}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-[#0150AC]" />
                <span className="text-muted-foreground">Units Vended (kWh)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-[#F472B6]" />
                <span className="text-muted-foreground">Amount Vended (₦)</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {showBlockFilter && blockOptions && onBlockChange ? (
              <FilterSelect
                id="energy-consumption-block"
                label="Block"
                options={blockOptions}
                value={blockValue ?? String(blockOptions[0]?.value ?? "")}
                onChange={onBlockChange}
              />
            ) : null}
            {showAddressFilterControl && resolvedOnAddressChange ? (
              <FilterSelect
                id="energy-consumption-address"
                label={addressFilterLabel}
                options={addressSelectOptions}
                value={resolvedAddressValue}
                disabled={addressFilterLoading}
                onChange={resolvedOnAddressChange}
              />
            ) : null}
            <PeriodSegmentedControl
              value={period}
              onChange={handlePeriodChange}
            />
          </div>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6 sm:py-6">
        {loading ? (
          <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : hasChartData ? (
          <div className="relative h-[320px] w-full">
            <div className="pointer-events-none absolute left-0 top-0 z-10 text-xs font-medium text-muted-foreground">
              Units (kWh)
            </div>
            <div className="pointer-events-none absolute right-0 top-0 z-10 text-xs font-medium text-muted-foreground">
              Amount (N)
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data}
                margin={{ top: 28, right: 8, left: 4, bottom: 8 }}
              >
                <defs>
                  <linearGradient
                    id={unitsGradientId}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={UNITS_COLOR}
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="100%"
                      stopColor={UNITS_COLOR}
                      stopOpacity={0.04}
                    />
                  </linearGradient>
                  <linearGradient
                    id={amountGradientId}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={AMOUNT_COLOR}
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="100%"
                      stopColor={AMOUNT_COLOR}
                      stopOpacity={0.04}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="#e2e8f0"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                />
                <YAxis
                  yAxisId="units"
                  orientation="left"
                  ticks={unitsTicks}
                  domain={[0, unitsMax]}
                  tickFormatter={formatUnitsAxisTick}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <YAxis
                  yAxisId="amount"
                  orientation="right"
                  ticks={amountTicks}
                  domain={[0, amountMax]}
                  tickFormatter={formatAmountAxisTick}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  width={52}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ stroke: UNITS_COLOR, strokeWidth: 1 }}
                />
                <Area
                  yAxisId="units"
                  type="monotone"
                  dataKey="unitsKwh"
                  stroke={UNITS_COLOR}
                  strokeWidth={2}
                  fill={`url(#${unitsGradientId})`}
                  dot={{
                    fill: UNITS_COLOR,
                    r: 3,
                    strokeWidth: 2,
                    stroke: "#ffffff",
                  }}
                  activeDot={{
                    r: 5,
                    fill: UNITS_COLOR,
                    stroke: "#ffffff",
                    strokeWidth: 2,
                  }}
                />
                <Area
                  yAxisId="amount"
                  type="monotone"
                  dataKey="amountNaira"
                  stroke={AMOUNT_COLOR}
                  strokeWidth={2}
                  fill={`url(#${amountGradientId})`}
                  dot={{
                    fill: AMOUNT_COLOR,
                    r: 3,
                    strokeWidth: 2,
                    stroke: "#ffffff",
                  }}
                  activeDot={{
                    r: 5,
                    fill: AMOUNT_COLOR,
                    stroke: "#ffffff",
                    strokeWidth: 2,
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        )}
      </div>
    </Card>
  );
}

export default EnergyConsumptionOverTimeCard;
