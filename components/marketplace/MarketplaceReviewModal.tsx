"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { MARKETPLACE_PRESS } from "@/lib/marketplace";

const PRESS = MARKETPLACE_PRESS;

type Props = Readonly<{
  mode: "approve" | "reject";
  loading?: boolean;
  onCancel: () => void;
  onConfirm: (value: string) => void;
}>;

export function MarketplaceReviewModal({
  mode,
  loading = false,
  onCancel,
  onConfirm,
}: Props) {
  const [value, setValue] = useState("");
  const requiresReason = mode === "reject";
  const canSubmit = !loading && (!requiresReason || value.trim().length > 2);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit) return;
        onConfirm(value.trim());
      }}
    >
      <div>
        <h2 className="text-lg font-semibold tracking-[-0.02em]">
          {mode === "approve" ? "Approve listing" : "Reject listing"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "approve"
            ? "It will appear in matching estates during its date window."
            : "The creator will see this reason on their ads."}
        </p>
      </div>
      <div>
        <Label htmlFor="review-note">
          {mode === "approve" ? "Notes" : "Reason"}
        </Label>
        <textarea
          id="review-note"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={3}
          required={requiresReason}
          className="mt-1 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={!canSubmit}
          className={cn("h-11 flex-1 rounded-xl", PRESS)}
        >
          {loading ? "Saving…" : mode === "approve" ? "Approve" : "Reject"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className={cn("h-11 rounded-xl", PRESS)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
