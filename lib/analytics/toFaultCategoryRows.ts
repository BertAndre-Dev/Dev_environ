import type { FaultBreakdownEntry } from "@/types/analytics";

export type FaultCategoryRow = Record<string, string | number> & {
  category: string;
  total: number;
};

export type FaultCategoryRowsResult = {
  statuses: string[];
  rows: FaultCategoryRow[];
};

/**
 * Flatten {category, status, count} into stacked-bar rows:
 * one row per unique category, one numeric field per status (0 if missing).
 */
export function toFaultCategoryRows(
  breakdown: FaultBreakdownEntry[],
): FaultCategoryRowsResult {
  const statuses: string[] = [];
  const statusSeen = new Set<string>();
  const categoryOrder: string[] = [];
  const categorySeen = new Set<string>();
  const counts = new Map<string, Map<string, number>>();

  for (const entry of breakdown) {
    const category = String(entry.category ?? "").trim() || "Unknown";
    const status = String(entry.status ?? "").trim() || "unknown";
    const count = Number(entry.count ?? 0);

    if (!statusSeen.has(status)) {
      statusSeen.add(status);
      statuses.push(status);
    }
    if (!categorySeen.has(category)) {
      categorySeen.add(category);
      categoryOrder.push(category);
      counts.set(category, new Map());
    }

    const byStatus = counts.get(category);
    if (!byStatus) continue;
    byStatus.set(status, (byStatus.get(status) ?? 0) + count);
  }

  const rows: FaultCategoryRow[] = categoryOrder.map((category) => {
    const byStatus = counts.get(category) ?? new Map();
    const row: FaultCategoryRow = { category, total: 0 };
    for (const status of statuses) {
      const value = byStatus.get(status) ?? 0;
      row[status] = value;
      row.total += value;
    }
    return row;
  });

  return { statuses, rows };
}
