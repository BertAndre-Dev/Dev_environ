export const EFFICIENCY_GREEN = "#10B981";
export const EFFICIENCY_AMBER = "#F59E0B";
export const EFFICIENCY_RED = "#EF4444";
export const EFFICIENCY_MUTED = "#94A3B8";

/** Thresholds mirrored by CustomerMeterSummaryCard ratioTone. */
export function efficiencyColorForPercent(
  percent: number,
  applicable = true,
): string {
  if (!applicable) return EFFICIENCY_MUTED;
  if (percent >= 70) return EFFICIENCY_GREEN;
  if (percent >= 40) return EFFICIENCY_AMBER;
  return EFFICIENCY_RED;
}

export function efficiencyToneClass(
  percent: number,
  applicable = true,
): string {
  if (!applicable) return "text-muted-foreground";
  if (percent >= 70) return "text-emerald-600 dark:text-emerald-400";
  if (percent >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-red-500 dark:text-red-400";
}
