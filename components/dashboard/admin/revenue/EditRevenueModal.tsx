"use client";

import React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface EditRevenueModalProps {
  open: boolean;
  saving: boolean;
  headName: string;
  description: string;
  amount: string;
  documentNumber: string;
  onOpenChange: (open: boolean) => void;
  onDescriptionChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onDocumentNumberChange: (value: string) => void;
  onSubmit: () => void;
}

export function EditRevenueModal({
  open,
  saving,
  headName,
  description,
  amount,
  documentNumber,
  onOpenChange,
  onDescriptionChange,
  onAmountChange,
  onDocumentNumberChange,
  onSubmit,
}: Readonly<EditRevenueModalProps>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Revenue</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="edit-revenue-head">
              Revenue Headdss
            </label>
            <Input id="edit-revenue-head" value={headName} disabled />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="edit-revenue-desc">
              Description
            </label>
            <Input
              id="edit-revenue-desc"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="edit-revenue-amount">
              Amount
            </label>
            <Input
              id="edit-revenue-amount"
              inputMode="numeric"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="edit-revenue-ref">
              Reference Number
            </label>
            <Input
              id="edit-revenue-ref"
              value={documentNumber}
              onChange={(e) => onDocumentNumberChange(e.target.value)}
            />
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
              {saving ? "Saving..." : "Update"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

