export type MaintenanceRecurringFields = {
  recurring: boolean;
  recurringSpanMonths: number;
  recurringSpanYears: number;
};

export const DEFAULT_RECURRING_FIELDS: MaintenanceRecurringFields = {
  recurring: false,
  recurringSpanMonths: 0,
  recurringSpanYears: 0,
};

export function isValidRecurringSpan(
  recurring: boolean,
  months: number,
  years: number,
): boolean {
  if (!recurring) return true;
  return months >= 0 && years >= 0 && (months > 0 || years > 0);
}

export function formatRecurringSpan(
  recurring?: boolean,
  months?: number,
  years?: number,
): string {
  if (!recurring) return "No";
  const parts: string[] = [];
  if (years != null && years > 0) {
    parts.push(`${years} year${years === 1 ? "" : "s"}`);
  }
  if (months != null && months > 0) {
    parts.push(`${months} month${months === 1 ? "" : "s"}`);
  }
  return parts.length ? parts.join(", ") : "Yes";
}

export function toCreateRecurringPayload(fields: MaintenanceRecurringFields) {
  return {
    recurring: fields.recurring,
    recurringSpanMonths: fields.recurring ? fields.recurringSpanMonths : 0,
    recurringSpanYears: fields.recurring ? fields.recurringSpanYears : 0,
  };
}
