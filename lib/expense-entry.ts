export const EXPENSE_ENTRY_BULK_MAX = 100;

export type ExpenseEntryWriteItem = {
  headId: string;
  description: string;
  documentNumber: string;
  amount: number;
  /** File/image URLs or data URLs. Omitted when empty. */
  attachments?: string[];
};

export function toExpenseEntryBulkBody(entries: ExpenseEntryWriteItem[]) {
  return {
    entries: entries.map(({ attachments, ...rest }) => {
      const urls = (attachments ?? []).map((url) => url.trim()).filter(Boolean);
      return urls.length ? { ...rest, attachments: urls } : rest;
    }),
  };
}

export function parseExpenseAttachments(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (url): url is string => typeof url === "string" && url.trim().length > 0,
  );
}
