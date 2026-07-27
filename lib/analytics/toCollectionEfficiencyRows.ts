import type {
  CollectionEfficiencyCategory,
  CollectionEfficiencyData,
} from "@/types/analytics";

export type CollectionEfficiencyRowKey = "bills" | "rent";

export type CollectionEfficiencyRow = {
  key: CollectionEfficiencyRowKey;
  category: string;
  expected: number;
  collected: number;
  efficiencyPercent: number;
  isApplicable: boolean;
};

const CATEGORY_DEFS: ReadonlyArray<{
  key: CollectionEfficiencyRowKey;
  category: string;
}> = [
  { key: "bills", category: "Bills" },
  { key: "rent", category: "Rent" },
];

function normalizeCategory(
  entry: CollectionEfficiencyCategory | undefined,
): CollectionEfficiencyCategory {
  return {
    expected: Math.max(0, Number(entry?.expected ?? 0)),
    collected: Math.max(0, Number(entry?.collected ?? 0)),
    efficiencyPercent: Number(entry?.efficiencyPercent ?? 0),
  };
}

/**
 * Flatten bills/rent into grouped-bar rows.
 * `isApplicable` is false when expected === 0 (N/A, not a failing 0%).
 */
export function toCollectionEfficiencyRows(
  data: CollectionEfficiencyData | null | undefined,
): CollectionEfficiencyRow[] {
  if (!data) return [];

  return CATEGORY_DEFS.map(({ key, category }) => {
    const entry = normalizeCategory(data[key]);
    return {
      key,
      category,
      expected: entry.expected,
      collected: entry.collected,
      efficiencyPercent: entry.efficiencyPercent,
      isApplicable: entry.expected > 0,
    };
  });
}
