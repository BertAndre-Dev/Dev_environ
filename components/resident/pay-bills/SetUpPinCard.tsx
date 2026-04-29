"use client";

import React, { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Props = {
  title?: string;
  description?: string;
  submitLabel?: string;
  onSubmitPin?: (pin: string) => Promise<void> | void;
};

const inputClass = [
  "w-[60px] h-[64px]",
  "rounded-xl border border-border",
  "bg-muted/50",
  "text-center text-xl font-medium text-foreground",
  "outline-none transition-all duration-150",
  "focus:border-blue-500 focus:bg-background focus:ring-2 focus:ring-blue-500/20",
  "caret-transparent",
].join(" ");

export function SetUpPinCard({
  title = "Set up your PIN",
  description = "Create a 4-digit transaction PIN to securely pay for airtime, data, and bills.",
  submitLabel = "Submit",
  onSubmitPin,
}: Readonly<Props>) {
  const [pin, setPin] = useState(["", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", ""]);

  const pinRefs = useRef<Array<HTMLInputElement | null>>([]);
  const confirmRefs = useRef<Array<HTMLInputElement | null>>([]);

  const pinComplete = pin.every((d) => d !== "");

  return (
    <Card className="p-8 w-full text-center">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="space-y-6 max-w-md mx-auto">
        {/* Enter PIN */}
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Enter PIN
          </p>
          <div className="flex gap-3">
            {pin.map((d, idx) => (
              <input
                key={idx}
                ref={(el) => { pinRefs.current[idx] = el; }}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={d}
                aria-label={`PIN digit ${idx + 1}`}
                className={inputClass}
                onChange={(e) => {
                  const val = e.target.value.slice(-1);
                  if (val && !/^\d$/.test(val)) return;
                  const next = [...pin];
                  next[idx] = val;
                  setPin(next);
                  if (val) pinRefs.current[idx + 1]?.focus();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace") {
                    if (pin[idx]) {
                      const next = [...pin];
                      next[idx] = "";
                      setPin(next);
                    } else {
                      pinRefs.current[idx - 1]?.focus();
                    }
                  }
                }}
              />
            ))}
          </div>
        </div>

        {/* Confirm PIN — only shown once all 4 PIN digits are entered */}
        {pinComplete && (
          <>
            <hr className="border-border" />

            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Confirm PIN
              </p>
              <div className="flex gap-3">
                {confirmPin.map((d, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      confirmRefs.current[idx] = el;
                      if (idx === 0 && el) setTimeout(() => el.focus(), 50);
                    }}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    aria-label={`Confirm PIN digit ${idx + 1}`}
                    className={inputClass}
                    onChange={(e) => {
                      const val = e.target.value.slice(-1);
                      if (val && !/^\d$/.test(val)) return;
                      const next = [...confirmPin];
                      next[idx] = val;
                      setConfirmPin(next);
                      if (val) confirmRefs.current[idx + 1]?.focus();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace") {
                        if (confirmPin[idx]) {
                          const next = [...confirmPin];
                          next[idx] = "";
                          setConfirmPin(next);
                        } else {
                          confirmRefs.current[idx - 1]?.focus();
                        }
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Submit — only shown once confirm PIN is visible */}
      {pinComplete && (
        <div className="mt-8 space-y-3 animate-in fade-in duration-200">
          <Button type="button" className="w-full h-12 text-sm font-medium">
            {submitLabel}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Your PIN is encrypted and never stored in plain text.
          </p>
        </div>
      )}
    </Card>
  );
}