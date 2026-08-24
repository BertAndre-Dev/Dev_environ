"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { getBill, payBill } from "@/redux/slice/resident/bill-mgt/bills-mgt";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import {
  BILL_FREQUENCY_OPTIONS,
  normalizeBillFrequency,
  type BillFrequency,
} from "@/redux/slice/admin/bills-mgt/bills";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertBanner } from "@/components/ui/alert-banner";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import SwitchAddress from "@/components/resident/switch-address/page";
import type { AddressOption } from "@/lib/address";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/lib/api-error";
import { canUseBillInterest } from "@/lib/user-modules";
import { selectEstateModules } from "@/redux/slice/auth-mgt/auth-mgt-slice";

interface BillsFormProps {
  billId: string;
  estateId?: string;
  addressOptions?: AddressOption[];
  selectedAddressId?: string | null;
  onSelectedAddressChange?: (addressId: string) => void;
  onSubmitSuccess?: () => void;
  onClose?: () => void;
}

function uniqueFrequencies(values: BillFrequency[]): BillFrequency[] {
  return values.filter((value, index, list) => list.indexOf(value) === index);
}

function frequencyLabel(value: BillFrequency): string {
  return (
    BILL_FREQUENCY_OPTIONS.find((option) => option.value === value)?.label ??
    value
  );
}

function resolvePaymentFrequencies(
  billFrequency?: string,
  allowedFrequencies?: string[],
): { options: BillFrequency[]; editable: boolean; value: BillFrequency } {
  const allowed = uniqueFrequencies(
    (allowedFrequencies ?? []).map((item) => normalizeBillFrequency(item)),
  );
  const frequency = billFrequency
    ? normalizeBillFrequency(billFrequency)
    : undefined;

  if (frequency === "yearly") {
    const fromAllowed = allowed.filter(
      (item) => item === "quarterly" || item === "yearly",
    );
    const options =
      fromAllowed.length > 0
        ? fromAllowed
        : (["quarterly", "yearly"] as BillFrequency[]);
    return {
      options,
      editable: options.length > 1,
      value: options.includes("yearly") ? "yearly" : options[0],
    };
  }

  if (
    frequency === "oneoff" ||
    frequency === "monthly" ||
    frequency === "quarterly"
  ) {
    const locked = allowed[0] ?? frequency;
    return { options: [locked], editable: false, value: locked };
  }

  if (allowed.length > 1) {
    return {
      options: allowed,
      editable: true,
      value: allowed.includes("yearly") ? "yearly" : allowed[0],
    };
  }

  const fallback = allowed[0] ?? "yearly";
  return { options: [fallback], editable: false, value: fallback };
}

function hasActiveInterest(bill: {
  accrueInterest?: boolean;
  interestRatePercent?: number;
}): boolean {
  return Boolean(bill.accrueInterest) && Number(bill.interestRatePercent) > 0;
}

function formatDateTime(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
}

function lookupAmountByFrequency(
  amounts: Record<string, number> | undefined,
  frequency: BillFrequency,
): number | undefined {
  if (!amounts) return undefined;
  for (const [key, raw] of Object.entries(amounts)) {
    if (normalizeBillFrequency(key) !== frequency) continue;
    const value = Number(raw);
    if (Number.isFinite(value)) return value;
  }
  return undefined;
}

export default function BillsForm({
  billId,
  estateId: estateIdProp,
  addressOptions = [],
  selectedAddressId = null,
  onSelectedAddressChange,
  onSubmitSuccess,
  onClose,
}: BillsFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const authUser = useSelector((state: RootState) => state.auth.user);
  const estateModules = useSelector(selectEstateModules);
  const canAccrueInterest = canUseBillInterest(authUser, estateModules);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [billName, setBillName] = useState("");
  const [yearlyAmount, setYearlyAmount] = useState<number>(0);
  const [amountPayable, setAmountPayable] = useState<number | undefined>();
  const [amountPayableByFrequency, setAmountPayableByFrequency] = useState<
    Record<string, number>
  >({});
  const [userId, setUserId] = useState("");
  const [walletId, setWalletId] = useState("");
  const [estateId, setEstateId] = useState(estateIdProp ?? "");
  const [frequency, setFrequency] = useState<BillFrequency>("yearly");
  const [frequencyOptions, setFrequencyOptions] = useState<
    { label: string; value: BillFrequency }[]
  >([]);
  const [frequencyEditable, setFrequencyEditable] = useState(false);
  const [accrueInterest, setAccrueInterest] = useState(false);
  const [interestRatePercent, setInterestRatePercent] = useState<number>(0);
  const [interestStartsAt, setInterestStartsAt] = useState<string | undefined>();

  const amountToPay = useMemo(() => {
    const fromFrequency = lookupAmountByFrequency(
      amountPayableByFrequency,
      frequency,
    );
    if (fromFrequency != null) return fromFrequency;
    if (amountPayable != null) return amountPayable;
    return yearlyAmount;
  }, [amountPayable, amountPayableByFrequency, frequency, yearlyAmount]);

  const amountToPayDisplay = amountToPay.toFixed(2);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const billRes = await dispatch(getBill(billId)).unwrap();
        const billData = billRes?.data;
        if (billData) {
          setBillName(billData.name || "");
          setYearlyAmount(Number(billData.yearlyAmount ?? 0));
          setAmountPayable(
            billData.amountPayable != null
              ? Number(billData.amountPayable)
              : billData.amount != null
                ? Number(billData.amount)
                : undefined,
          );
          setAmountPayableByFrequency(
            billData.amountPayableByFrequency &&
              typeof billData.amountPayableByFrequency === "object"
              ? billData.amountPayableByFrequency
              : {},
          );
          const resolved = resolvePaymentFrequencies(
            billData.frequency,
            billData.allowedFrequencies,
          );
          setFrequency(resolved.value);
          setFrequencyEditable(resolved.editable);
          setFrequencyOptions(
            resolved.options.map((value) => ({
              label: frequencyLabel(value),
              value,
            })),
          );
          setAccrueInterest(Boolean(billData.accrueInterest));
          setInterestRatePercent(Number(billData.interestRatePercent) || 0);
          setInterestStartsAt(billData.interestStartsAt);
        }

        const userRes = await dispatch(getSignedInUser()).unwrap();
        const user = userRes?.data;
        if (user) {
          setUserId(user.id || "");
          setWalletId(user.walletId ?? user.wallet?.id ?? "");
          const rawEstateId = user.estateId as
            | string
            | { id?: string; _id?: string }
            | null
            | undefined;
          const resolvedEstateId =
            estateIdProp ||
            (typeof rawEstateId === "string"
              ? rawEstateId
              : rawEstateId?._id || rawEstateId?.id || "");
          if (resolvedEstateId) setEstateId(resolvedEstateId);
        }
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    if (billId) load();
  }, [billId, dispatch, estateIdProp]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!billId || !userId || !walletId) {
      toast.error("Missing bill or wallet information.");
      return;
    }

    if (!estateId) {
      toast.error("Missing estate information.");
      return;
    }

    if (addressOptions.length > 1 && !selectedAddressId) {
      toast.error("Please select an address to pay this bill.");
      return;
    }

    setSubmitting(true);
    try {
      await dispatch(
        payBill({
          billId,
          userId,
          walletId,
          estateId,
          addressId: selectedAddressId ?? undefined,
          frequency,
          amountPaid: amountToPay,
        })
      ).unwrap();

      toast.success("Bill payment successful");
      onSubmitSuccess?.();
      onClose?.();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold capitalize text-blue-600">
          {billName} Bill
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <SwitchAddress
          addresses={addressOptions}
          value={selectedAddressId}
          onChange={(id) => onSelectedAddressChange?.(id)}
          label="Pay for address"
          direction="col"
          className="p-0 border-0 shadow-none"
        />

        {loading ? (
          <p className="text-gray-500 italic">Loading bill details...</p>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="payment-frequency">Payment Frequency</Label>
              {frequencyEditable ? (
                <Select
                  id="payment-frequency"
                  aria-label="Select payment frequency"
                  options={frequencyOptions}
                  value={frequency}
                  onChange={(e) =>
                    setFrequency(normalizeBillFrequency(e.target.value))
                  }
                />
              ) : (
                <Input
                  id="payment-frequency"
                  readOnly
                  value={frequencyLabel(frequency)}
                  className="bg-muted/50 cursor-not-allowed"
                />
              )}
            </div>

            <div>
              <Label>Amount to Pay</Label>
              <Input readOnly type="number" value={amountToPayDisplay} />
              {frequencyEditable && yearlyAmount > 0 ? (
                <p className="text-sm text-muted-foreground mt-1">
                  Yearly total is ₦{yearlyAmount.toLocaleString()}.
                </p>
              ) : null}
            </div>
          </div>
        )}

        {!loading &&
        canAccrueInterest &&
        hasActiveInterest({ accrueInterest, interestRatePercent }) ? (
          <AlertBanner
            variant="warning"
            className="rounded-md border px-3 py-2"
            message={`Accrues interest ${interestRatePercent}% monthly${
              formatDateTime(interestStartsAt)
                ? ` starting ${formatDateTime(interestStartsAt)}`
                : ""
            }`}
          />
        ) : null}

        <div className="pt-6">
          <Button type="submit" className="w-full" disabled={loading || submitting}>
            {submitting ? "Processing..." : `Pay ₦${amountToPayDisplay}`}
          </Button>
        </div>
      </CardContent>
    </form>
  );
}
