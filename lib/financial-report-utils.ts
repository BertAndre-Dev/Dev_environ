export type FinancialReportRevenueByHead = {
  headName: string;
  value: number;
};

export type FinancialReportRevenue = {
  vendingRevenue?: number;
  billPaymentRevenue?: number;
  byHead?: FinancialReportRevenueByHead[];
  totalRevenue?: number;
};

export type FinancialReportExpenseHead = {
  _id: string;
  headName: string;
  totalAmount: number;
  entryCount?: number;
  estateId?: string;
};

export type FinancialReportData = {
  estateId?: string;
  estateName?: string;
  companyId?: string | null;
  walletRouting?: string;
  note?: string;
  reportPeriod?: { startDate: string; endDate: string };
  revenue?: FinancialReportRevenue;
  expenses?: {
    totalExpenses?: number;
    byHead?: FinancialReportExpenseHead[];
  };
  summary?: {
    totalRevenue?: number;
    totalExpenses?: number;
    netProfitLoss?: number;
    profitMargin?: string;
    status?: string;
  };
};

export type FinancialReportTableRow = {
  key: string;
  label: string;
  amount: number;
};

export function revenueHeadFilterKey(headName: string): string {
  return `head:${headName}`;
}

export function buildRevenueTableRows(
  revenue: FinancialReportRevenue | undefined,
  filter: string,
): FinancialReportTableRow[] {
  const rows: FinancialReportTableRow[] = [
    {
      key: "bills",
      label: "Bills",
      amount: Number(revenue?.billPaymentRevenue ?? 0),
    },
    {
      key: "vending",
      label: "Vending",
      amount: Number(revenue?.vendingRevenue ?? 0),
    },
    ...(revenue?.byHead ?? []).map((h) => ({
      key: revenueHeadFilterKey(h.headName),
      label: h.headName,
      amount: Number(h.value ?? 0),
    })),
  ];

  if (filter === "all") return rows;
  return rows.filter((r) => r.key === filter);
}

export function buildRevenueFilterOptions(
  revenue: FinancialReportRevenue | undefined,
): Array<{ label: string; value: string }> {
  return [
    { label: "Category", value: "all" },
    { label: "Bills", value: "bills" },
    { label: "Vending", value: "vending" },
    ...(revenue?.byHead ?? []).map((h) => ({
      label: h.headName,
      value: revenueHeadFilterKey(h.headName),
    })),
  ];
}
