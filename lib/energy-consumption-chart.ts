export type EnergyConsumptionPeriod =
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly";

export interface EnergyConsumptionDataPoint {
  label: string;
  date: string;
  unitsKwh: number;
  amountNaira: number;
}

type VendLike = {
  createdAt?: string;
  amount?: string | number;
  value?: string | number;
  units?: string | number;
  [key: string]: unknown;
};

function parseUnitsKwh(item: VendLike): number {
  const raw = item.value ?? item.units;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function parseAmountNaira(item: VendLike): number {
  const n = Number(item.amount);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function startOfWeekMonday(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function bucketKey(isoDate: string, period: EnergyConsumptionPeriod): string {
  if (period === "daily") return isoDate;
  if (period === "weekly") return startOfWeekMonday(isoDate);
  if (period === "monthly") return isoDate.slice(0, 7);
  return isoDate.slice(0, 4);
}

function normalizeChartDateKey(key: string): string {
  if (/^\d{4}$/.test(key)) return `${key}-01-01`;
  if (/^\d{4}-\d{2}$/.test(key)) return `${key}-01`;
  return key;
}

function formatAxisLabel(bucketKey: string, period: EnergyConsumptionPeriod): string {
  if (period === "yearly") return bucketKey;

  const dateStr =
    period === "monthly" ? `${bucketKey}-01` : bucketKey;
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return bucketKey;
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  return `${day} ${month}`;
}

export function formatEnergyTooltipDate(isoDate: string): string {
  const d = new Date(`${normalizeChartDateKey(isoDate)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatAmountNairaCompact(amount: number): string {
  if (amount >= 1_000_000) {
    return `N${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `N${Math.round(amount / 1_000)}K`;
  }
  return `N${Math.round(amount).toLocaleString()}`;
}

export function mapVendItemsToEnergyConsumption(
  items: VendLike[],
  period: EnergyConsumptionPeriod,
  maxPoints = 12,
): EnergyConsumptionDataPoint[] {
  const buckets: Record<string, { unitsKwh: number; amountNaira: number }> =
    {};

  for (const item of items) {
    const isoDate = (item.createdAt ?? "").slice(0, 10);
    if (!isoDate) continue;
    const key = bucketKey(isoDate, period);
    const existing = buckets[key] ?? { unitsKwh: 0, amountNaira: 0 };
    buckets[key] = {
      unitsKwh: existing.unitsKwh + parseUnitsKwh(item),
      amountNaira: existing.amountNaira + parseAmountNaira(item),
    };
  }

  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-maxPoints)
    .map(([date, totals]) => ({
      label: formatAxisLabel(date, period),
      date,
      unitsKwh: Math.round(totals.unitsKwh * 100) / 100,
      amountNaira: Math.round(totals.amountNaira),
    }));
}

export interface VendAnalyticsChartPoint {
  key: string;
  label: string;
  value: number;
  count: number;
}

export interface VendAnalyticsByAddress {
  addressId: string;
  label: string;
  chart: VendAnalyticsChartPoint[];
  total: number;
  count: number;
}

export interface VendAnalyticsChartResponse {
  success?: boolean;
  estateId?: string;
  period?: string;
  groupBy?: string;
  metric?: "value" | "unit";
  unit?: string;
  estate?: { chart?: VendAnalyticsChartPoint[] } | null;
  byAddress?: VendAnalyticsByAddress[];
}

export function pickAddressChartSeries(
  response: VendAnalyticsChartResponse | null | undefined,
  addressId: string,
): VendAnalyticsChartPoint[] {
  if (!response) return [];
  const byAddress = response.byAddress ?? [];
  const match = byAddress.find((a) => a.addressId === addressId);
  if (match?.chart?.length) return match.chart;
  if (byAddress[0]?.chart?.length) return byAddress[0].chart;
  return response.estate?.chart ?? [];
}

function aggregateByAddressCharts(
  addresses: VendAnalyticsByAddress[],
): VendAnalyticsChartPoint[] {
  const byKey = new Map<string, VendAnalyticsChartPoint>();
  for (const addr of addresses) {
    for (const point of addr.chart ?? []) {
      const existing = byKey.get(point.key);
      if (existing) {
        existing.value += Number(point.value) || 0;
        existing.count += Number(point.count) || 0;
      } else {
        byKey.set(point.key, {
          key: point.key,
          label: point.label,
          value: Number(point.value) || 0,
          count: Number(point.count) || 0,
        });
      }
    }
  }
  return [...byKey.values()].sort((a, b) => a.key.localeCompare(b.key));
}

/** Estate-wide series when no addressId is scoped. */
export function pickEstateChartSeries(
  response: VendAnalyticsChartResponse | null | undefined,
): VendAnalyticsChartPoint[] {
  if (!response) return [];
  if (response.estate?.chart?.length) return response.estate.chart;
  const byAddress = response.byAddress ?? [];
  if (byAddress.length === 0) return [];
  if (byAddress.length === 1) return byAddress[0].chart ?? [];
  return aggregateByAddressCharts(byAddress);
}

export function extractAddressFilterOptions(
  response: VendAnalyticsChartResponse | null | undefined,
): { label: string; value: string }[] {
  const items = response?.byAddress ?? [];
  if (items.length === 0) return [];
  return [
    { label: "All apartments", value: "all" },
    ...items.map((a) => ({
      label: a.label?.trim() || a.addressId,
      value: a.addressId,
    })),
  ];
}

function pickChartSeries(
  response: VendAnalyticsChartResponse | null | undefined,
  addressId?: string,
): VendAnalyticsChartPoint[] {
  if (addressId && addressId !== "all") {
    return pickAddressChartSeries(response, addressId);
  }
  return pickEstateChartSeries(response);
}

/** Merges amount (metric=value) and units (metric=unit) vend-analytics responses. */
export function mapVendAnalyticsToEnergyConsumption(
  amountResponse: VendAnalyticsChartResponse | null | undefined,
  unitsResponse: VendAnalyticsChartResponse | null | undefined,
  addressId?: string,
): EnergyConsumptionDataPoint[] {
  const amountPoints = pickChartSeries(amountResponse, addressId);
  const unitPoints = pickChartSeries(unitsResponse, addressId);

  const amountByKey = new Map(
    amountPoints.map((p) => [p.key, Number(p.value) || 0]),
  );
  const unitByKey = new Map(
    unitPoints.map((p) => [p.key, Number(p.value) || 0]),
  );
  const labelByKey = new Map<string, string>();
  for (const p of amountPoints) labelByKey.set(p.key, p.label);
  for (const p of unitPoints) {
    if (!labelByKey.has(p.key)) labelByKey.set(p.key, p.label);
  }

  const keys = [
    ...new Set([...amountByKey.keys(), ...unitByKey.keys()]),
  ].sort();

  return keys.map((key) => ({
    label: labelByKey.get(key) ?? key,
    date: key,
    unitsKwh: unitByKey.get(key) ?? 0,
    amountNaira: amountByKey.get(key) ?? 0,
  }));
}

export function computeNiceAxisMax(
  values: number[],
  step = 20,
  fallback = 100,
): number {
  const max = Math.max(0, ...values);
  if (max === 0) return fallback;
  return Math.ceil(max / step) * step;
}

/** Placeholder data until the energy consumption API is wired up. */
const MOCK_ENERGY_CONSUMPTION_BY_PERIOD: Record<
  EnergyConsumptionPeriod,
  EnergyConsumptionDataPoint[]
> = {
  daily: [
    { label: "01 JAN", date: "2026-01-01", unitsKwh: 42, amountNaira: 18_500 },
    { label: "02 JAN", date: "2026-01-02", unitsKwh: 58, amountNaira: 24_000 },
    { label: "03 JAN", date: "2026-01-03", unitsKwh: 35, amountNaira: 15_200 },
    { label: "04 JAN", date: "2026-01-04", unitsKwh: 72, amountNaira: 32_000 },
    { label: "05 JAN", date: "2026-01-05", unitsKwh: 48, amountNaira: 21_000 },
    { label: "06 JAN", date: "2026-01-06", unitsKwh: 234, amountNaira: 110_000 },
    { label: "07 JAN", date: "2026-01-07", unitsKwh: 65, amountNaira: 28_500 },
  ],
  weekly: [
    { label: "01 JAN", date: "2025-12-29", unitsKwh: 52, amountNaira: 22_000 },
    { label: "08 JAN", date: "2026-01-05", unitsKwh: 78, amountNaira: 34_000 },
    { label: "15 JAN", date: "2026-01-12", unitsKwh: 45, amountNaira: 19_500 },
    { label: "22 JAN", date: "2026-01-19", unitsKwh: 88, amountNaira: 38_000 },
    { label: "29 JAN", date: "2026-01-26", unitsKwh: 62, amountNaira: 27_000 },
    { label: "05 FEB", date: "2026-02-02", unitsKwh: 95, amountNaira: 42_000 },
    { label: "12 FEB", date: "2026-02-09", unitsKwh: 70, amountNaira: 30_500 },
  ],
  monthly: [
    { label: "01 AUG", date: "2025-08-01", unitsKwh: 320, amountNaira: 140_000 },
    { label: "01 SEP", date: "2025-09-01", unitsKwh: 285, amountNaira: 125_000 },
    { label: "01 OCT", date: "2025-10-01", unitsKwh: 410, amountNaira: 180_000 },
    { label: "01 NOV", date: "2025-11-01", unitsKwh: 360, amountNaira: 158_000 },
    { label: "01 DEC", date: "2025-12-01", unitsKwh: 395, amountNaira: 172_000 },
    { label: "01 JAN", date: "2026-01-01", unitsKwh: 450, amountNaira: 198_000 },
    { label: "01 FEB", date: "2026-02-01", unitsKwh: 380, amountNaira: 165_000 },
  ],
  yearly: [
    { label: "2021", date: "2021", unitsKwh: 2_800, amountNaira: 1_200_000 },
    { label: "2022", date: "2022", unitsKwh: 3_150, amountNaira: 1_380_000 },
    { label: "2023", date: "2023", unitsKwh: 3_420, amountNaira: 1_520_000 },
    { label: "2024", date: "2024", unitsKwh: 3_890, amountNaira: 1_740_000 },
    { label: "2025", date: "2025", unitsKwh: 4_120, amountNaira: 1_860_000 },
    { label: "2026", date: "2026", unitsKwh: 890, amountNaira: 410_000 },
  ],
};

export function getMockEnergyConsumptionData(
  period: EnergyConsumptionPeriod = "weekly",
): EnergyConsumptionDataPoint[] {
  return MOCK_ENERGY_CONSUMPTION_BY_PERIOD[period];
}
