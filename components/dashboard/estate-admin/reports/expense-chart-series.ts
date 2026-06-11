import type { ExpenseChartPoint } from "@/redux/slice/estate-admin/expense-chart/expense-chart";

export type ExpenseChartSeriesPoint = {
  key: string;
  label: string;
  value: number;
  count: number;
};

export function buildExpenseChartSeries(
  chartData: ExpenseChartPoint[],
): ExpenseChartSeriesPoint[] {
  return chartData.map((p) => ({
    key: p.key,
    label: p.label,
    value: Number(p.value ?? 0),
    count: Number(p.count ?? 0),
  }));
}

export function seriesHasExpenses(series: ExpenseChartSeriesPoint[]): boolean {
  return series.some((p) => p.value > 0);
}
