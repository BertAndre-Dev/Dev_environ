import type { RevenueChartPoint } from "@/redux/slice/estate-admin/revenue-chart/revenue-chart";

export type RevenueChartSegmentKey = "vending" | "bills" | string;

export type RevenueChartSeriesPoint = {
  key: string;
  label: string;
  value: number;
  segments: Record<string, number>;
};

const FIXED_SEGMENTS: Array<{ key: "vending" | "bills"; label: string }> = [
  { key: "vending", label: "Vending" },
  { key: "bills", label: "Bills" },
];

export function buildRevenueChartSeries(
  chartData: RevenueChartPoint[],
): RevenueChartSeriesPoint[] {
  return chartData.map((p) => {
    const vending = Number(p.vending ?? 0);
    const bills = Number(p.bills ?? 0);
    const value = Number(p.value ?? 0);

    const segments: Record<string, number> = {
      vending,
      bills,
    };

    for (const head of p.byHead ?? []) {
      const name = String(head.headName ?? "").trim() || "Other";
      segments[name] = (segments[name] ?? 0) + Number(head.value ?? 0);
    }

    const byHeadTotal = (p.byHead ?? []).reduce(
      (sum, h) => sum + Number(h.value ?? 0),
      0,
    );
    const residual = Math.max(0, value - vending - bills - byHeadTotal);
    if (residual > 0) {
      segments.Other = (segments.Other ?? 0) + residual;
    }

    return {
      key: p.key,
      label: p.label,
      value,
      segments,
    };
  });
}

export function getActiveSegmentKeys(
  series: RevenueChartSeriesPoint[],
): Array<{ key: string; label: string }> {
  const totals = new Map<string, number>();

  for (const point of series) {
    for (const [key, amount] of Object.entries(point.segments)) {
      totals.set(key, (totals.get(key) ?? 0) + Number(amount ?? 0));
    }
  }

  const active: Array<{ key: string; label: string }> = [];

  for (const { key, label } of FIXED_SEGMENTS) {
    if ((totals.get(key) ?? 0) > 0) {
      active.push({ key, label });
    }
  }

  const headKeys = [...totals.keys()]
    .filter((k) => k !== "vending" && k !== "bills" && (totals.get(k) ?? 0) > 0)
    .sort((a, b) => a.localeCompare(b));

  for (const key of headKeys) {
    active.push({ key, label: key });
  }

  return active;
}

export function seriesHasRevenue(series: RevenueChartSeriesPoint[]): boolean {
  return series.some((p) => p.value > 0);
}
