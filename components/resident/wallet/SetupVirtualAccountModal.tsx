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
  initiateFlutterwaveBvn,
  saveBvnConsentSession,
} from "@/redux/slice/resident/virtual-accounts/flutterwave-va";
import { cn } from "@/lib/utils";

type Props = {
  visible: boolean;
  onClose: () => void;
};

const PHONE_RE = /^0[789][01]\d{8}$/;
const BVN_RE = /^\d{11}$/;

export default function SetupVirtualAccountModal({
  visible,
  onClose,
}: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();
  const { initiateBvnState } = useSelector(
    (state: RootState) => state.residentFlutterwaveVa,
  );

  const [phonenumber, setPhonenumber] = useState("");
  const [bvn, setBvn] = useState("");

  const submitting = initiateBvnState === "isLoading";

  const resetForm = () => {
    setPhonenumber("");
    setBvn("");
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
    if (!BVN_RE.test(bvn.trim())) {
      return "BVN must be exactly 11 digits.";
    }
    return null;
  };

  const handleContinue = async () => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    const phone = phonenumber.trim();

    try {
      const redirectUrl = `${window.location.origin}/dashboard/resident/transaction?bvn_return=1`;
      const result = await dispatch(
        initiateFlutterwaveBvn({
          bvn: bvn.trim(),
          redirectUrl,
        }),
      ).unwrap();

      const reference = result.reference;
      if (!reference) {
        toast.error("No consent reference received. Please try again.");
        return;
      }

      saveBvnConsentSession({
        reference,
        bvn: bvn.trim(),
        phonenumber: phone,
      });

      if (result.consentUrl) {
        toast.info("Redirecting to complete BVN consent…");
        window.location.assign(result.consentUrl);
        return;
      }

      toast.warning(
        "Consent URL was not returned. If you already completed consent, return to this page to finish setup.",
      );
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ||
        "Failed to set up virtual account.";
      toast.error(msg);
    }
  };

  const phoneLen = phonenumber.length;
  const bvnLen = bvn.length;
  const phoneReady = PHONE_RE.test(phonenumber.trim());
  const bvnReady = BVN_RE.test(bvn.trim());

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
            Verify your BVN once. You’ll get a permanent NGN account for wallet
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
              <Label htmlFor="va-bvn" className="text-sm font-medium">
                BVN
              </Label>
              <span
                className={cn(
                  "tabular-nums text-[11px]",
                  bvnReady ? "text-emerald-600" : "text-muted-foreground",
                )}
                aria-hidden
              >
                {bvnLen}/11
              </span>
            </div>
            <Input
              id="va-bvn"
              inputMode="numeric"
              placeholder="11-digit BVN"
              value={bvn}
              disabled={submitting}
              maxLength={11}
              className={cn(
                "h-11 rounded-xl text-base tracking-wide tabular-nums",
                "transition-[box-shadow,border-color] duration-150",
              )}
              onChange={(e) =>
                setBvn(e.target.value.replace(/\D/g, "").slice(0, 11))
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
              Next you’ll complete NIBSS iGree consent securely. Your BVN isn’t
              stored in this form after you continue.
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
            {submitting ? "Please wait…" : "Continue"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
