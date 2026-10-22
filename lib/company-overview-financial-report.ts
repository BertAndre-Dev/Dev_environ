import type {
  CompanyGenerateFinancialReportByEstate,
  CompanyGenerateFinancialReportData,
  CompanyGenerateFinancialReportExpenseHead,
} from "@/types/analytics";
import { formatTransactionAmount } from "@/lib/transaction-summary-chart";

/** Currency is not specified by the API; match the rest of the app (NGN / ₦). */
export const FINANCIAL_REPORT_CURRENCY_CODE = "NGN" as const;

export function formatFinancialReportCurrency(amount: number): string {
  return formatTransactionAmount(amount);
}

/** Display-only: round wallet floating-point noise (e.g. 85.51999999999998). */
export function formatWalletBalance(amount: number): string {
  const rounded = Math.round((Number(amount) + Number.EPSILON) * 100) / 100;
  return formatFinancialReportCurrency(rounded);
}

/**
 * profitMargin arrives as a STRING and can be extreme (e.g. -26445.45)
 * when revenue is tiny against expenses. Parse safely and clamp display.
 */
export function formatProfitMarginDisplay(raw: string | null | undefined): string {
  if (raw == null || String(raw).trim() === "") return "—";
  const parsed = Number.parseFloat(String(raw).replaceAll("%", "").trim());
  if (!Number.isFinite(parsed)) return "—";
  if (parsed < -999) return "< -999%";
  if (parsed > 999) return "> 999%";
  // Avoid trailing zeros without a backtracking regex (e.g. -12.50 → -12.5)
  const fixed = parsed.toFixed(2);
  const [intPart, frac = ""] = fixed.split(".");
  const fracTrimmed = frac.replace(/0+$/, "");
  return fracTrimmed ? `${intPart}.${fracTrimmed}%` : `${intPart}%`;
}

/**
 * Estates with zero revenue and zero expenses come back with status "Profit".
 * Surface them as "No activity" instead of implying a real profit.
 */
export function getEstateActivityLabel(
  estate: Pick<
    CompanyGenerateFinancialReportByEstate,
    "totalRevenue" | "totalExpenses" | "status"
  >,
): "No activity" | "Profit" | "Loss" {
  if (estate.totalRevenue === 0 && estate.totalExpenses === 0) {
    return "No activity";
  }
  return estate.status;
}

export type AggregatedExpenseByHead = {
  headName: string;
  totalAmount: number;
  /** estateId → amount for tooltip breakdown */
  byEstate: { estateId: string; amount: number }[];
};

/** Aggregate expenses.byHead by headName (same head appears once per estate). */
export function aggregateExpensesByHead(
  byHead: CompanyGenerateFinancialReportExpenseHead[],
): AggregatedExpenseByHead[] {
  const map = new Map<string, AggregatedExpenseByHead>();
  for (const row of byHead) {
    const key = row.headName || "Unknown";
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        headName: key,
        totalAmount: Number(row.totalAmount) || 0,
        byEstate: [
          {
            estateId: row.estateId,
            amount: Number(row.totalAmount) || 0,
          },
        ],
      });
      continue;
    }
    existing.totalAmount += Number(row.totalAmount) || 0;
    existing.byEstate.push({
      estateId: row.estateId,
      amount: Number(row.totalAmount) || 0,
    });
  }
  return [...map.values()].sort((a, b) => b.totalAmount - a.totalAmount);
}

const TOTALS_EPSILON = 0.01;

/** Flag when byEstate rollups do not match summary totals (data-quality warning). */
export function checkByEstateTotalsMismatch(
  report: CompanyGenerateFinancialReportData,
): boolean {
  const sumRevenue = report.byEstate.reduce(
    (s, e) => s + (Number(e.totalRevenue) || 0),
    0,
  );
  const sumExpenses = report.byEstate.reduce(
    (s, e) => s + (Number(e.totalExpenses) || 0),
    0,
  );
  const summaryRevenue = Number(report.summary.totalRevenue) || 0;
  const summaryExpenses = Number(report.summary.totalExpenses) || 0;
  return (
    Math.abs(sumRevenue - summaryRevenue) > TOTALS_EPSILON ||
    Math.abs(sumExpenses - summaryExpenses) > TOTALS_EPSILON
  );
}

export function yearToDateRange(now = new Date()): {
  startDate: string;
  endDate: string;
} {
  const y = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return {
    startDate: `${y}-01-01`,
    endDate: `${y}-${month}-${day}`,
  };
}
