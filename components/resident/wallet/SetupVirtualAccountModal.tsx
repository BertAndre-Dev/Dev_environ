"use client";

import React, { useState } from "react";
import { Shield } from "lucide-react";
import Modal from "@/components/modal/page";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import {
  createFlutterwaveVirtualAccount,
  getFlutterwaveVirtualAccount,
} from "@/redux/slice/resident/virtual-accounts/flutterwave-va";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";

type Props = {
  visible: boolean;
  onClose: () => void;
};

const PHONE_RE = /^0[789][01]\d{8}$/;
const NIN_RE = /^\d{11}$/;

export default function SetupVirtualAccountModal({
  visible,
  onClose,
}: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();
  const { createVirtualAccountState } = useSelector(
    (state: RootState) => state.residentFlutterwaveVa,
  );

  const [phonenumber, setPhonenumber] = useState("");
  const [nin, setNin] = useState("");

  const submitting = createVirtualAccountState === "isLoading";

  const resetForm = () => {
    setPhonenumber("");
    setNin("");
  };

  const handleClose = () => {
    if (submitting) return;
    resetForm();
    onClose();
  };

  const validate = (): string | null => {
    if (!PHONE_RE.test(phonenumber.trim())) {
      return "Enter a valid Nigerian phone number (e.g. 08100000000).";
    }
    if (!NIN_RE.test(nin.trim())) {
      return "NIN must be exactly 11 digits.";
    }
    return null;
  };

  const handleContinue = async () => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    try {
      await dispatch(
        createFlutterwaveVirtualAccount({
          nin: nin.trim(),
          phonenumber: phonenumber.trim(),
        }),
      ).unwrap();

      await dispatch(getFlutterwaveVirtualAccount());
      toast.success("Virtual account created successfully.");
      resetForm();
      onClose();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      toast.error(message || "Failed to set up virtual account.");
    }
  };

  const phoneLen = phonenumber.length;
  const ninLen = nin.length;
  const phoneReady = PHONE_RE.test(phonenumber.trim());
  const ninReady = NIN_RE.test(nin.trim());

  return (
    <Modal visible={visible} onClose={handleClose} contentClassName="max-w-md">
      <div className="space-y-6 pt-1 pr-6">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            One-time setup
          </p>
          <h2 className="mt-1 text-[1.35rem] font-semibold tracking-tight text-foreground">
            Set up virtual account
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Verify your NIN once. You’ll get a permanent NGN account for wallet
            funding.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <Label htmlFor="va-phone" className="text-sm font-medium">
                Phone number
              </Label>
              <span
                className={cn(
                  "tabular-nums text-[11px]",
                  phoneReady ? "text-emerald-600" : "text-muted-foreground",
                )}
                aria-hidden
              >
                {phoneLen}/11
              </span>
            </div>
            <Input
              id="va-phone"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="08100000000"
              value={phonenumber}
              disabled={submitting}
              maxLength={11}
              className={cn(
                "h-11 rounded-xl text-base tracking-wide tabular-nums",
                "transition-[box-shadow,border-color] duration-150",
              )}
              onChange={(e) =>
                setPhonenumber(e.target.value.replace(/\D/g, "").slice(0, 11))
              }
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <Label htmlFor="va-nin" className="text-sm font-medium">
                NIN
              </Label>
              <span
                className={cn(
                  "tabular-nums text-[11px]",
                  ninReady ? "text-emerald-600" : "text-muted-foreground",
                )}
                aria-hidden
              >
                {ninLen}/11
              </span>
            </div>
            <Input
              id="va-nin"
              inputMode="numeric"
              placeholder="11-digit NIN"
              value={nin}
              disabled={submitting}
              maxLength={11}
              className={cn(
                "h-11 rounded-xl text-base tracking-wide tabular-nums",
                "transition-[box-shadow,border-color] duration-150",
              )}
              onChange={(e) =>
                setNin(e.target.value.replace(/\D/g, "").slice(0, 11))
              }
            />
          </div>

          <div
            className={cn(
              "flex gap-2.5 rounded-xl border border-black/5 bg-slate-50/80 p-3",
              "text-xs leading-relaxed text-muted-foreground",
            )}
          >
            <Shield
              className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <p>
              Your NIN is used once to create the account and isn’t stored in
              this form after you continue.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-black/5 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={submitting}
            className="rounded-full transition-transform duration-100 ease-out active:scale-[0.97]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleContinue}
            disabled={submitting}
            className="rounded-full px-5 transition-transform duration-100 ease-out active:scale-[0.97]"
          >
            {submitting ? "Please wait…" : "Create account"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
