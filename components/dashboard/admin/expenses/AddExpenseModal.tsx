"use client";

import React, { useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IsoDatePicker } from "@/components/ui/iso-date-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fileToBase64 } from "@/lib/file-to-base64";
import { getApiErrorMessage } from "@/lib/api-error";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_ATTACHMENTS = 5;
const FILE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,application/pdf";

export type ExpenseDraftAttachment = {
  name: string;
  dataUrl: string;
};

export interface AddExpenseDraftEntry {
  id: string;
  description: string;
  amount: string;
  documentNumber: string;
  attachments: ExpenseDraftAttachment[];
}

export interface AddExpenseModalProps {
  open: boolean;
  saving: boolean;
  headName: string;
  drafts: AddExpenseDraftEntry[];
  onOpenChange: (open: boolean) => void;
  onDraftChange: (
    id: string,
    field: "description" | "amount" | "documentNumber",
    value: string,
  ) => void;
  onAttachmentsChange: (id: string, attachments: ExpenseDraftAttachment[]) => void;
  onAddDraft: () => void;
  onRemoveDraft: (id: string) => void;
  onSubmit: () => void;
  showDateAndUpload?: boolean;
  date?: string;
  onDateChange?: (value: string) => void;
}

function DraftAttachmentsPicker({
  attachments,
  disabled,
  onChange,
}: Readonly<{
  attachments: ExpenseDraftAttachment[];
  disabled: boolean;
  onChange: (next: ExpenseDraftAttachment[]) => void;
}>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState(false);

  const handleFilesSelected = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remaining = MAX_ATTACHMENTS - attachments.length;
    if (remaining <= 0) {
      toast.error(`You can attach up to ${MAX_ATTACHMENTS} files per entry.`);
      e.target.value = "";
      return;
    }

    const selected = files.slice(0, remaining);
    setReading(true);
    try {
      const next: ExpenseDraftAttachment[] = [];
      for (const file of selected) {
        if (file.size > MAX_FILE_BYTES) {
          toast.error(`${file.name} exceeds 10MB.`);
          continue;
        }
        const dataUrl = await fileToBase64(file);
        next.push({ name: file.name, dataUrl });
      }
      if (next.length) onChange([...attachments, ...next]);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err) || "Failed to read file.";
      toast.error(message);
    } finally {
      setReading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Attachments</p>
      {attachments.length > 0 ? (
        <ul className="space-y-1.5">
          {attachments.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2 truncate">
                <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{file.name}</span>
              </span>
              <button
                type="button"
                onClick={() =>
                  onChange(attachments.filter((_, i) => i !== index))
                }
                disabled={disabled}
                className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept={FILE_ACCEPT}
        multiple
        className="hidden"
        onChange={handleFilesSelected}
        disabled={disabled || attachments.length >= MAX_ATTACHMENTS}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || attachments.length >= MAX_ATTACHMENTS}
        onClick={() => inputRef.current?.click()}
      >
        <Paperclip className="mr-2 h-4 w-4" />
        {reading ? "Reading files..." : "Add files"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Optional. Up to {MAX_ATTACHMENTS} receipts or invoices, 10MB each.
      </p>
    </div>
  );
}

export function AddExpenseModal({
  open,
  saving,
  headName,
  drafts,
  onOpenChange,
  onDraftChange,
  onAttachmentsChange,
  onAddDraft,
  onRemoveDraft,
  onSubmit,
  showDateAndUpload = true,
  date = "",
  onDateChange,
}: Readonly<AddExpenseModalProps>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] min-h-[30vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="add-expense-head">
              Expense Head
            </label>
            <Input id="add-expense-head" value={headName} disabled />
          </div>

          {showDateAndUpload ? (
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="add-expense-date">
                Date
              </label>
              <IsoDatePicker
                id="add-expense-date"
                value={date}
                onChange={(iso) => onDateChange?.(iso)}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ) : null}

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Expenses</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAddDraft}
              >
                + Add another
              </Button>
            </div>

            {drafts.map((row, idx) => (
              <div
                key={row.id}
                className="space-y-3 rounded-md border border-border/60 p-3"
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium"
                      htmlFor={`add-expense-desc-${idx}`}
                    >
                      Description
                    </label>
                    <Input
                      id={`add-expense-desc-${idx}`}
                      value={row.description}
                      onChange={(e) =>
                        onDraftChange(row.id, "description", e.target.value)
                      }
                      placeholder="fixing of generator"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium"
                      htmlFor={`add-expense-amount-${idx}`}
                    >
                      Amount
                    </label>
                    <Input
                      id={`add-expense-amount-${idx}`}
                      inputMode="numeric"
                      value={row.amount}
                      onChange={(e) =>
                        onDraftChange(row.id, "amount", e.target.value)
                      }
                      placeholder="20000"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium"
                      htmlFor={`add-expense-ref-${idx}`}
                    >
                      Reference Number
                    </label>
                    <Input
                      id={`add-expense-ref-${idx}`}
                      value={row.documentNumber}
                      onChange={(e) =>
                        onDraftChange(row.id, "documentNumber", e.target.value)
                      }
                      placeholder="INV/001"
                    />
                  </div>
                </div>

                <DraftAttachmentsPicker
                  attachments={row.attachments}
                  disabled={saving}
                  onChange={(next) => onAttachmentsChange(row.id, next)}
                />

                {drafts.length > 1 && (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onRemoveDraft(row.id)}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="button" onClick={onSubmit} disabled={saving}>
              {saving ? "Saving..." : "Add Expense"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
