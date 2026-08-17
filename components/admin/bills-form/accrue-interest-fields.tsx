"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type AccrueInterestFieldsProps = {
  accrueInterest: boolean;
  interestRatePercent: string;
  onAccrueInterestChange: (value: boolean) => void;
  onInterestRateChange: (value: string) => void;
  disabled?: boolean;
  idPrefix: string;
};

export function AccrueInterestFields({
  accrueInterest,
  interestRatePercent,
  onAccrueInterestChange,
  onInterestRateChange,
  disabled = false,
  idPrefix,
}: AccrueInterestFieldsProps) {
  const toggleId = `${idPrefix}-accrue-interest`;
  const rateId = `${idPrefix}-interest-rate`;

  return (
    <div className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={toggleId} className="font-medium">
          Accrue interest
        </Label>
        <button
          id={toggleId}
          type="button"
          role="switch"
          aria-checked={accrueInterest}
          aria-label="Accrue interest"
          disabled={disabled}
          onClick={() => onAccrueInterestChange(!accrueInterest)}
          className={cn(
            "relative inline-flex h-7 w-[44px] shrink-0 cursor-pointer items-center rounded-full p-0.5",
            "transition-colors duration-150 ease-out active:scale-[0.97]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0150AC]/40",
            "disabled:cursor-not-allowed disabled:opacity-50",
            accrueInterest ? "bg-[#0150AC]" : "bg-black/15",
          )}
        >
          <span
            className={cn(
              "block size-6 rounded-full bg-white shadow-sm transition-transform duration-150",
              accrueInterest ? "translate-x-4" : "translate-x-0",
            )}
          />
        </button>
      </div>
      <p className="text-sm text-red-500 font-medium">
        When enabled, overdue bills will accrue interest at the percentage you
        set below. The interest rate is applied monthly, rather than annually.
      </p>
      <div>
        <Label htmlFor={rateId}>Interest rate (%)</Label>
        <Input
          id={rateId}
          type="text"
          inputMode="decimal"
          value={interestRatePercent}
          onChange={(e) => onInterestRateChange(e.target.value)}
          placeholder="2.5"
          disabled={disabled || !accrueInterest}
          required={accrueInterest}
          className="mt-1"
        />
      </div>
    </div>
  );
}
