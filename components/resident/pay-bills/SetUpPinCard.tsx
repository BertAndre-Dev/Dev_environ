"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  description?: string;
  submitLabel?: string;
  onSubmitPin?: (pin: string) => Promise<void> | void;
};

const PIN_LENGTH = 4;
const EMPTY_PIN = (): string[] => Array(PIN_LENGTH).fill("");

const STEP_SPRING = { type: "spring" as const, bounce: 0, duration: 0.35 };

export interface PinInputRowProps {
  label: string;
  digits: string[];
  onChange: (next: string[]) => void;
  hasError?: boolean;
  autoFocusFirst?: boolean;
  /** Omit the label row (e.g. authorise-PIN step where the parent shows the title). */
  hideLabel?: boolean;
  disabled?: boolean;
}

export function PinInputRow({
  label,
  digits,
  onChange,
  hasError = false,
  autoFocusFirst = false,
  hideLabel = false,
  disabled = false,
}: PinInputRowProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!autoFocusFirst || disabled) return;
    const t = requestAnimationFrame(() => refs.current[0]?.focus());
    return () => cancelAnimationFrame(t);
  }, [autoFocusFirst, disabled]);

  function focusAt(idx: number) {
    refs.current[Math.max(0, Math.min(PIN_LENGTH - 1, idx))]?.focus();
  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number,
  ) {
    if (disabled) return;

    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[idx]) {
        const next = [...digits];
        next[idx] = "";
        onChange(next);
      } else {
        const prev = idx - 1;
        if (prev >= 0) {
          const next = [...digits];
          next[prev] = "";
          onChange(next);
          focusAt(prev);
        }
      }
      return;
    }

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusAt(idx - 1);
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      focusAt(idx + 1);
      return;
    }

    if (/^\d$/.test(e.key)) {
      e.preventDefault();
      const next = [...digits];
      next[idx] = e.key;
      onChange(next);
      focusAt(idx + 1);
      return;
    }

    if (e.key.length === 1) e.preventDefault();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>, idx: number) {
    if (disabled) return;
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) return;

    if (raw.length > 1) {
      const chars = raw.slice(0, PIN_LENGTH - idx).split("");
      const next = [...digits];
      chars.forEach((ch, i) => {
        if (idx + i < PIN_LENGTH) next[idx + i] = ch;
      });
      onChange(next);
      focusAt(Math.min(idx + chars.length, PIN_LENGTH - 1));
      return;
    }

    const next = [...digits];
    next[idx] = raw;
    onChange(next);
    focusAt(idx + 1);
  }

  function handlePaste(
    e: React.ClipboardEvent<HTMLInputElement>,
    startIdx: number,
  ) {
    if (disabled) return;
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, PIN_LENGTH);
    if (!pasted) return;
    const next = [...digits];
    pasted.split("").forEach((ch, i) => {
      if (startIdx + i < PIN_LENGTH) next[startIdx + i] = ch;
    });
    onChange(next);
    focusAt(Math.min(startIdx + pasted.length, PIN_LENGTH - 1));
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.target.select();
  }

  return (
    <div className="space-y-3">
      {!hideLabel ? (
        <p className="text-sm font-medium text-foreground">{label}</p>
      ) : null}
      <div className="flex justify-center gap-2.5 sm:gap-3">
        {digits.map((d, idx) => {
          const filled = Boolean(d);
          return (
            <input
              key={idx}
              ref={(el) => {
                refs.current[idx] = el;
              }}
              type="password"
              inputMode="numeric"
              value={d}
              maxLength={2}
              disabled={disabled}
              aria-invalid={hasError}
              aria-label={`${label} digit ${idx + 1}`}
              autoComplete="off"
              spellCheck={false}
              className={cn(
                "size-14 sm:size-16 rounded-2xl border text-center text-xl font-semibold",
                "outline-none caret-transparent select-none",
                "transition-[transform,background-color,border-color,box-shadow] duration-100 ease-out",
                "active:scale-[0.97]",
                "disabled:pointer-events-none disabled:opacity-60",
                "motion-reduce:transition-none motion-reduce:active:scale-100",
                hasError
                  ? "border-red-400 bg-red-50 text-red-600 focus:ring-2 focus:ring-red-300/80 dark:bg-red-950/40 dark:border-red-500/70"
                  : filled
                    ? "border-primary/35 bg-primary/8 text-foreground focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/25"
                    : "border-border bg-muted/50 text-foreground focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/25",
              )}
              onChange={(e) => handleChange(e, idx)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              onPaste={(e) => handlePaste(e, idx)}
              onFocus={handleFocus}
            />
          );
        })}
      </div>
    </div>
  );
}

type SetupStep = "create" | "confirm";

export function SetUpPinCard({
  title = "Create your PIN",
  description = "You’ll use this 4-digit PIN whenever you pay a bill.",
  submitLabel = "Set PIN",
  onSubmitPin,
}: Readonly<Props>) {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState<SetupStep>("create");
  const [pin, setPin] = useState<string[]>(EMPTY_PIN());
  const [confirmPin, setConfirmPin] = useState<string[]>(EMPTY_PIN());
  const [submitting, setSubmitting] = useState(false);
  const [mismatch, setMismatch] = useState(false);
  const [rowKey, setRowKey] = useState(0);
  const submittingRef = useRef(false);

  const pinValue = pin.join("");
  const confirmValue = confirmPin.join("");
  const pinComplete = pin.every(Boolean);
  const confirmComplete = confirmPin.every(Boolean);
  const canSubmit =
    step === "confirm" &&
    pinComplete &&
    confirmComplete &&
    !mismatch &&
    !submitting;

  useEffect(() => {
    if (!mismatch) return;
    const t = window.setTimeout(() => {
      setConfirmPin(EMPTY_PIN());
      setMismatch(false);
      setRowKey((key) => key + 1);
    }, 520);
    return () => window.clearTimeout(t);
  }, [mismatch]);

  async function commitPin(value: string) {
    if (!onSubmitPin || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await onSubmitPin(value);
      setPin(EMPTY_PIN());
      setConfirmPin(EMPTY_PIN());
      setMismatch(false);
      setStep("create");
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
      setConfirmPin(EMPTY_PIN());
      setRowKey((key) => key + 1);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  function handleCreateChange(next: string[]) {
    setPin(next);
    if (next.every(Boolean)) {
      setConfirmPin(EMPTY_PIN());
      setMismatch(false);
      setStep("confirm");
    }
  }

  function handleConfirmChange(next: string[]) {
    setConfirmPin(next);
    if (mismatch) setMismatch(false);
    if (!next.every(Boolean)) return;

    if (next.join("") === pinValue) {
      void commitPin(next.join(""));
      return;
    }
    setMismatch(true);
  }

  function handleStartOver() {
    if (submitting) return;
    setStep("create");
    setPin(EMPTY_PIN());
    setConfirmPin(EMPTY_PIN());
    setMismatch(false);
    setRowKey((key) => key + 1);
  }

  const heading = step === "create" ? title : "Confirm your PIN";
  const body =
    step === "create"
      ? description
      : "Enter the same PIN once more so we know it’s right.";

  return (
    <Card className="w-full overflow-y-auto px-6 py-8 sm:p-8">
      <div className="mx-auto w-full max-w-sm text-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, x: step === "confirm" ? 28 : -28 }
            }
            animate={{ opacity: 1, x: 0 }}
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, x: step === "confirm" ? -28 : 28 }
            }
            transition={STEP_SPRING}
            className="will-change-transform"
          >
            <h2 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
              {heading}
            </h2>
            <p className="mx-auto mt-2 max-w-[20rem] text-[15px] leading-relaxed text-muted-foreground">
              {body}
            </p>

            <motion.div
              className="mt-8"
              animate={
                mismatch && !reduceMotion
                  ? { x: [0, -10, 10, -7, 7, -3, 3, 0] }
                  : { x: 0 }
              }
              transition={{ duration: 0.42, ease: "easeOut" }}
            >
              {step === "create" ? (
                <PinInputRow
                  key={`create-${rowKey}`}
                  label="New PIN"
                  hideLabel
                  digits={pin}
                  onChange={handleCreateChange}
                  autoFocusFirst
                  disabled={submitting}
                />
              ) : (
                <PinInputRow
                  key={`confirm-${rowKey}`}
                  label="Confirm PIN"
                  hideLabel
                  digits={confirmPin}
                  onChange={handleConfirmChange}
                  hasError={mismatch}
                  autoFocusFirst
                  disabled={submitting}
                />
              )}
            </motion.div>

            <p
              className={cn(
                "mt-3 min-h-5 text-sm text-red-600 dark:text-red-400",
                mismatch ? "opacity-100" : "opacity-0",
              )}
              aria-live="polite"
            >
              Those PINs didn’t match. Try again.
            </p>

            {step === "confirm" ? (
              <div className="mt-6 space-y-3">
                <Button
                  type="button"
                  className="h-12 w-full text-sm font-medium active:scale-[0.97] motion-reduce:active:scale-100"
                  disabled={!canSubmit}
                  onClick={() => void commitPin(confirmValue)}
                >
                  {submitting ? "Saving PIN…" : submitLabel}
                </Button>
                <button
                  type="button"
                  className="text-sm font-medium text-primary transition-opacity duration-100 hover:opacity-80 active:scale-[0.97] disabled:opacity-50"
                  onClick={handleStartOver}
                  disabled={submitting}
                >
                  Use a different PIN
                </button>
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted-foreground">
                Enter all 4 digits to continue.
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Card>
  );
}
