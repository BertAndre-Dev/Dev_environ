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
  initiateFlutterwaveBvn,
  saveBvnConsentSession,
} from "@/redux/slice/resident/virtual-accounts/flutterwave-va";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";

type Props = {
  visible: boolean;
  onClose: () => void;
};

type IdTab = "bvn" | "nin";

const PHONE_RE = /^0[789][01]\d{8}$/;
const ID_RE = /^\d{11}$/;

export default function SetupVirtualAccountModal({
  visible,
  onClose,
}: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();
  const { initiateBvnState, createVirtualAccountState } = useSelector(
    (state: RootState) => state.residentFlutterwaveVa,
  );

  const [idTab, setIdTab] = useState<IdTab>("bvn");
  const [phonenumber, setPhonenumber] = useState("");
  const [identityNumber, setIdentityNumber] = useState("");

  const submitting =
    initiateBvnState === "isLoading" ||
    createVirtualAccountState === "isLoading";

  const selectTab = (tab: IdTab) => {
    if (tab === idTab || submitting) return;
    setIdTab(tab);
    setIdentityNumber("");
  };

  const resetForm = () => {
    setPhonenumber("");
    setIdentityNumber("");
    setIdTab("bvn");
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
    if (!ID_RE.test(identityNumber.trim())) {
      return idTab === "bvn"
        ? "BVN must be exactly 11 digits."
        : "NIN must be exactly 11 digits.";
    }
    return null;
  };

  const handleContinueWithBvn = async (phone: string) => {
    const bvn = identityNumber.trim();
    const redirectUrl = `${window.location.origin}/dashboard/resident/transaction?bvn_return=1`;
    const result = await dispatch(
      initiateFlutterwaveBvn({
        bvn,
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
      bvn,
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
  };

  const handleContinueWithNin = async (phone: string) => {
    await dispatch(
      createFlutterwaveVirtualAccount({
        nin: identityNumber.trim(),
        phonenumber: phone,
      }),
    ).unwrap();

    await dispatch(getFlutterwaveVirtualAccount());
    toast.success("Virtual account created successfully.");
    resetForm();
    onClose();
  };

  const handleContinue = async () => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    const phone = phonenumber.trim();

    try {
      if (idTab === "bvn") {
        await handleContinueWithBvn(phone);
        return;
      }
      await handleContinueWithNin(phone);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      toast.error(message || "Failed to set up virtual account.");
    }
  };

  const phoneLen = phonenumber.length;
  const idLen = identityNumber.length;
  const phoneReady = PHONE_RE.test(phonenumber.trim());
  const idReady = ID_RE.test(identityNumber.trim());

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
            Choose either BVN or NIN (not both). You’ll get a permanent NGN
            account for wallet funding.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Verify with BVN or NIN"
          className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100/90 p-1"
        >
          {(
            [
              { key: "bvn", label: "BVN" },
              { key: "nin", label: "NIN" },
            ] as const
          ).map((tab) => {
            const active = idTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                id={`va-tab-${tab.key}`}
                aria-controls="va-panel-identity"
                aria-selected={active}
                tabIndex={active ? 0 : -1}
                disabled={submitting}
                onClick={() => selectTab(tab.key)}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                  "active:scale-[0.98]",
                  active
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            );
          })}
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

          <div
            className="space-y-1.5"
            role="tabpanel"
            id="va-panel-identity"
            aria-labelledby={`va-tab-${idTab}`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <Label htmlFor="va-identity" className="text-sm font-medium">
                {idTab === "bvn" ? "BVN" : "NIN"}
              </Label>
              <span
                className={cn(
                  "tabular-nums text-[11px]",
                  idReady ? "text-emerald-600" : "text-muted-foreground",
                )}
                aria-hidden
              >
                {idLen}/11
              </span>
            </div>
            <Input
              id="va-identity"
              key={idTab}
              inputMode="numeric"
              placeholder={
                idTab === "bvn" ? "11-digit BVN" : "11-digit NIN"
              }
              value={identityNumber}
              disabled={submitting}
              maxLength={11}
              className={cn(
                "h-11 rounded-xl text-base tracking-wide tabular-nums",
                "transition-[box-shadow,border-color] duration-150",
              )}
              onChange={(e) =>
                setIdentityNumber(
                  e.target.value.replace(/\D/g, "").slice(0, 11),
                )
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
              {idTab === "bvn"
                ? "Next you’ll complete NIBSS iGree consent securely. Only your BVN is used for this path."
                : "Only your NIN is used for this path. It isn’t stored in this form after you continue."}
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
            {submitting
              ? "Please wait…"
              : idTab === "nin"
                ? "Create account"
                : "Continue"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
