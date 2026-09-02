export const EXPENSE_ENTRY_BULK_MAX = 100;

export type ExpenseEntryWriteItem = {
  headId: string;
  description: string;
  documentNumber: string;
  amount: number;
  /** Hosted https:// file URLs from POST /api/v1/uploads. Omitted when empty. */
  attachments?: string[];
};

export type ExpenseEntryUpdateArg = ExpenseEntryWriteItem & { id: string };

function normalizedAttachments(urls: string[] | undefined): string[] {
  return (urls ?? []).map((url) => url.trim()).filter(Boolean);
}

export function toExpenseEntryBulkBody(entries: ExpenseEntryWriteItem[]) {
  return {
    entries: entries.map(({ attachments, ...rest }) => {
      const urls = normalizedAttachments(attachments);
      return urls.length ? { ...rest, attachments: urls } : rest;
    }),
  };
}

/** PUT body. Always includes `attachments` so removals persist. */
export function toExpenseEntryUpdateBody(item: ExpenseEntryWriteItem) {
  return {
    headId: item.headId,
    description: item.description,
    documentNumber: item.documentNumber,
    amount: item.amount,
    attachments: normalizedAttachments(item.attachments),
  };
}

export function parseExpenseAttachments(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (url): url is string => typeof url === "string" && url.trim().length > 0,
  );
}
