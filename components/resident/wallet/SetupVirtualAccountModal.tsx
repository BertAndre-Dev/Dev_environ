"use client";

import React, { useState } from "react";
import Modal from "@/components/modal/page";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
// import { useDispatch, useSelector } from "react-redux";
// import type { AppDispatch, RootState } from "@/redux/store";
// import {
//   initiateFlutterwaveBvn,
//   saveBvnConsentSession,
// } from "@/redux/slice/resident/virtual-accounts/flutterwave-va";

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
  // const dispatch = useDispatch<AppDispatch>();
  // const { initiateBvnState } = useSelector(
  //   (state: RootState) => state.residentFlutterwaveVa,
  // );

  const [phonenumber, setPhonenumber] = useState("");
  const [bvn, setBvn] = useState("");

  // const submitting = initiateBvnState === "isLoading";
  const submitting = false;

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

    // Payment VA implementation commented out — UI only
    toast.info("Virtual account setup is temporarily unavailable.");
    return;

    // const phone = phonenumber.trim();
    //
    // try {
    //   const redirectUrl = `${window.location.origin}/dashboard/resident/transaction?bvn_return=1`;
    //   const result = await dispatch(
    //     initiateFlutterwaveBvn({
    //       bvn: bvn.trim(),
    //       redirectUrl,
    //     }),
    //   ).unwrap();
    //
    //   const reference = result.reference;
    //   if (!reference) {
    //     toast.error("No consent reference received. Please try again.");
    //     return;
    //   }
    //
    //   saveBvnConsentSession({
    //     reference,
    //     bvn: bvn.trim(),
    //     phonenumber: phone,
    //   });
    //
    //   if (result.consentUrl) {
    //     toast.info("Redirecting to complete BVN consent…");
    //     window.location.assign(result.consentUrl);
    //     return;
    //   }
    //
    //   toast.warning(
    //     "Consent URL was not returned. If you already completed consent, return to this page to finish setup.",
    //   );
    // } catch (err: unknown) {
    //   const msg =
    //     (err as { message?: string })?.message ||
    //     "Failed to set up virtual account.";
    //   toast.error(msg);
    // }
  };

  return (
    <Modal visible={visible} onClose={handleClose} contentClassName="max-w-md">
      <div className="space-y-4 pt-2">
        <div>
          <h2 className="text-lg font-semibold">Set up virtual account</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Verify your BVN once to create your funding account.
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="va-phone">Phone number</Label>
            <Input
              id="va-phone"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="08100000000"
              value={phonenumber}
              disabled={submitting}
              maxLength={11}
              onChange={(e) =>
                setPhonenumber(e.target.value.replace(/\D/g, "").slice(0, 11))
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="va-bvn">BVN</Label>
            <Input
              id="va-bvn"
              inputMode="numeric"
              placeholder="11-digit BVN"
              value={bvn}
              disabled={submitting}
              maxLength={11}
              onChange={(e) =>
                setBvn(e.target.value.replace(/\D/g, "").slice(0, 11))
              }
            />
            <p className="text-xs text-muted-foreground">
              You will be redirected to complete NIBSS iGree consent.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleContinue} disabled={submitting}>
            {submitting ? "Please wait…" : "Continue"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
