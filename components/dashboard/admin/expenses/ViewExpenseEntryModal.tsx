"use client";

import React from "react";
import { Paperclip } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ExpenseEntry } from "@/redux/slice/admin/expense-entry/expense-entry";
import {
  downloadAttachment,
  getAttachmentFilename,
} from "@/lib/download-attachment";

export interface ViewExpenseEntryModalProps {
  open: boolean;
  loading: boolean;
  item: ExpenseEntry | null;
  onOpenChange: (open: boolean) => void;
}

export function ViewExpenseEntryModal({
  open,
  loading,
  item,
  onOpenChange,
}: Readonly<ViewExpenseEntryModalProps>) {
  const attachments = item?.attachments?.filter(Boolean) ?? [];
  let body: React.ReactNode = null;
  if (loading) {
    body = <p className="py-6 text-sm text-muted-foreground">Loading...</p>;
  } else if (item == null) {
    body = <p className="py-6 text-sm text-muted-foreground">No data.</p>;
  } else {
    body = (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="text-sm">
              {item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Amount</p>
            <p className="text-sm">
              ₦{Number(item.amount ?? 0).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Description</p>
          <p className="text-sm">{item.description || "—"}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Reference No</p>
          <p className="text-sm">{item.documentNumber || "—"}</p>
        </div>
        {attachments.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Attachments</p>
            <ul className="space-y-1.5">
              {attachments.map((url, index) => (
                <li key={`${url.slice(0, 24)}-${index}`}>
                  <button
                    type="button"
                    onClick={() =>
                      void downloadAttachment(
                        url,
                        getAttachmentFilename(url, index),
                      )
                    }
                    className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#2563EB] hover:underline"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    {getAttachmentFilename(url, index)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="flex justify-end pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Expense Entry Details</DialogTitle>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
