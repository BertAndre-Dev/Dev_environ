export interface TransactionSummaryData {
  totalTransactions: number;
  totalDebits: number;
  totalCredits: number;
  netFlow: number;
  creditTransactions: number;
  debitTransactions: number;
  paidTransactions: number;
}

export interface TransactionSummaryBarPoint {
  label: string;
  value: number;
  count: number;
  highlighted?: boolean;
}

export const EMPTY_TRANSACTION_SUMMARY: TransactionSummaryData = {
  totalTransactions: 0,
  totalDebits: 0,
  totalCredits: 0,
  netFlow: 0,
  creditTransactions: 0,
  debitTransactions: 0,
  paidTransactions: 0,
};

export function formatTransactionAmount(amount: number): string {
  return `₦${Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatTransactionAmountCompact(amount: number): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "₦0";
  if (value >= 1_000_000) {
    return `₦${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `₦${(value / 1_000).toFixed(1)}K`;
  }
  return formatTransactionAmount(value);
}

export function mapTransactionSummaryToBarChart(
  data: TransactionSummaryData,
): TransactionSummaryBarPoint[] {
  const credit = Math.max(0, data.totalCredits);
  const debit = Math.max(0, data.totalDebits);
  if (credit === 0 && debit === 0) return [];

  return [
    {
      label: "Inflow",
      value: credit,
      count: data.creditTransactions,
      highlighted: true,
    },
    {
      label: "Outflow",
      value: debit,
      count: data.debitTransactions,
      highlighted: false,
    },
  ];
}

export function hasTransactionSummaryData(data: TransactionSummaryData): boolean {
  return (
    data.totalTransactions > 0 ||
    data.totalCredits > 0 ||
    data.totalDebits > 0 ||
    data.creditTransactions > 0 ||
    data.debitTransactions > 0
  );
}
