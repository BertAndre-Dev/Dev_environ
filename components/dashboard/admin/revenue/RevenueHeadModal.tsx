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

export interface RevenueHeadModalValues {
  name: string;
  description: string;
}

export interface RevenueHeadModalProps {
  open: boolean;
  saving: boolean;
  title: string;
  submitLabel: string;
  values: RevenueHeadModalValues;
  onOpenChange: (open: boolean) => void;
  onChange: (values: RevenueHeadModalValues) => void;
  onSubmit: () => void;
}

export function RevenueHeadModal({
  open,
  saving,
  title,
  submitLabel,
  values,
  onOpenChange,
  onChange,
  onSubmit,
}: Readonly<RevenueHeadModalProps>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="rh-name">
              Revenue Head
            </label>
            <Input
              id="rh-name"
              value={values.name}
              onChange={(e) => onChange({ ...values, name: e.target.value })}
              placeholder="Maintenance"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="rh-desc">
              Description
            </label>
            <Input
              id="rh-desc"
              value={values.description}
              onChange={(e) =>
                onChange({ ...values, description: e.target.value })
              }
              placeholder="Description"
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
            <Button
              type="button"
              onClick={onSubmit}
              disabled={saving || !values.name.trim()}
            >
              {saving ? "Saving..." : submitLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

