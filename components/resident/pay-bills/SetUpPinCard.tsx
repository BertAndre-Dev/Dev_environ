"use client";

import React, { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  title?: string;
  description?: string;
  submitLabel?: string;
  onSubmitPin?: (pin: string) => Promise<void> | void;
};

const PIN_LENGTH = 4;
const EMPTY_PIN = (): string[] => Array(PIN_LENGTH).fill("");

// ─── Sub-component: PinInputRow ───────────────────────────────────────────────

interface PinInputRowProps {
  label: string;
  digits: string[];
  inputRefs: React.MutableRefObject<Array<HTMLInputElement | null>>;
  onDigitChange: (idx: number, val: string) => void;
  onDigitKeyDown: (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number,
  ) => void;
  hasError?: boolean;
  autoFocusFirst?: boolean;
}

function PinInputRow({
  label,
  digits,
  inputRefs,
  onDigitChange,
  onDigitKeyDown,
  hasError = false,
  autoFocusFirst = false,
}: PinInputRowProps) {
  const baseClass =
    "w-[60px] h-[64px] rounded-xl border text-center text-xl font-medium outline-none transition-all duration-150 caret-transparent";
  const normalClass =
    "border-border bg-muted/50 text-foreground focus:border-blue-500 focus:bg-background focus:ring-2 focus:ring-blue-500/20";
  const errorClass =
    "border-red-400 bg-red-50 text-red-600 focus:ring-2 focus:ring-red-300";

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="flex gap-3">
        {digits.map((d, idx) => (
          <input
            key={idx}
            ref={(el) => {
              inputRefs.current[idx] = el;
              // Auto-focus first box when the confirm row appears
              if (autoFocusFirst && idx === 0 && el) {
                setTimeout(() => el.focus(), 50);
              }
            }}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={d}
            aria-label={`${label} digit ${idx + 1}`}
            className={`${baseClass} ${hasError ? errorClass : normalClass}`}
            onChange={(e) => onDigitChange(idx, e.target.value)}
            onKeyDown={(e) => onDigitKeyDown(e, idx)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SetUpPinCard({
  title = "Set Up PIN",
  description = "Set up a transaction PIN to securely and seamlessly pay for airtime, data, and bills.",
  submitLabel = "Submit",
  onSubmitPin,
}: Readonly<Props>) {
  const [pin, setPin] = useState<string[]>(EMPTY_PIN());
  const [confirmPin, setConfirmPin] = useState<string[]>(EMPTY_PIN());
  const [submitting, setSubmitting] = useState(false);
  const [mismatch, setMismatch] = useState(false);

  const pinRefs = useRef<Array<HTMLInputElement | null>>([]);
  const confirmRefs = useRef<Array<HTMLInputElement | null>>([]);

  const pinValue = pin.join("");
  const confirmValue = confirmPin.join("");
  const pinComplete = pin.every(Boolean);
  const confirmComplete = confirmPin.every(Boolean);
  const canSubmit = pinComplete && confirmComplete && !mismatch && !submitting;

  // Only flag mismatch after confirm is fully filled to avoid premature red flash
  useEffect(() => {
    setMismatch(confirmComplete ? pinValue !== confirmValue : false);
  }, [pinValue, confirmValue, confirmComplete]);

  // ── PIN handlers — defined inline so they always close over fresh state ──

  function handlePinChange(idx: number, raw: string) {
    const val = raw.slice(-1);
    if (val && !/^\d$/.test(val)) return;
    const next = [...pin];
    next[idx] = val;
    setPin(next);
    if (val) pinRefs.current[idx + 1]?.focus();
  }

  function handlePinKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number,
  ) {
    if (e.key !== "Backspace") return;
    if (pin[idx]) {
      const next = [...pin];
      next[idx] = "";
      setPin(next);
    } else {
      pinRefs.current[idx - 1]?.focus();
    }
  }

  // ── Confirm handlers — same pattern, separate state ───────────────────────

  function handleConfirmChange(idx: number, raw: string) {
    const val = raw.slice(-1);
    if (val && !/^\d$/.test(val)) return;
    const next = [...confirmPin];
    next[idx] = val;
    setConfirmPin(next);
    if (val) confirmRefs.current[idx + 1]?.focus();
  }

  function handleConfirmKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number,
  ) {
    if (e.key !== "Backspace") return;
    if (confirmPin[idx]) {
      const next = [...confirmPin];
      next[idx] = "";
      setConfirmPin(next);
    } else {
      confirmRefs.current[idx - 1]?.focus();
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!onSubmitPin) return;
    if (!pinComplete) return void toast.error("Please enter your 4-digit PIN.");
    if (!confirmComplete) return void toast.error("Please confirm your PIN.");
    if (pinValue !== confirmValue)
      return void toast.error("PINs do not match. Please try again.");

    try {
      setSubmitting(true);
      await onSubmitPin(pinValue);
      setPin(EMPTY_PIN());
      setConfirmPin(EMPTY_PIN());
      setMismatch(false);
      pinRefs.current[0]?.focus();
    } catch (err: any) {
      toast.error(
        err?.message ?? err?.payload?.message ?? "Failed to set PIN.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-8 w-full text-center">
      <div className="mb-8 max-w-xs mx-auto">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="space-y-6 max-w-xs mx-auto">
        <PinInputRow
          label="Enter PIN"
          digits={pin}
          inputRefs={pinRefs}
          onDigitChange={handlePinChange}
          onDigitKeyDown={handlePinKeyDown}
        />

        {pinComplete && (
          <>
            <hr className="border-border" />

            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <PinInputRow
                label="Confirm PIN"
                digits={confirmPin}
                inputRefs={confirmRefs}
                onDigitChange={handleConfirmChange}
                onDigitKeyDown={handleConfirmKeyDown}
                hasError={mismatch}
                autoFocusFirst
              />

              {mismatch && (
                <p className="mt-2 text-xs text-red-500 animate-in fade-in duration-150">
                  PINs do not match. Please re-enter.
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {pinComplete && (
        <div className="mt-8 space-y-3 max-w-xs mx-auto animate-in fade-in duration-200">
          <Button
            type="button"
            className="w-full h-12 text-sm font-medium"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {submitting ? "Submitting..." : submitLabel}
          </Button>
        </div>
      )}
    </Card>
  );
}