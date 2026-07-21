"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { getBill, payBill } from "@/redux/slice/resident/bill-mgt/bills-mgt";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import SwitchAddress from "@/components/resident/switch-address/page";
import type { AddressOption } from "@/lib/address";
import { toast } from "react-toastify";

interface BillsFormProps {
  billId: string;
  /** Prefill from address-bills list when getBill shape differs */
  initialBill?: {
    name?: string;
    amount?: number;
    frequency?: string;
  };
  addressOptions?: AddressOption[];
  selectedAddressId?: string | null;
  onSelectedAddressChange?: (addressId: string) => void;
  onSubmitSuccess?: () => void;
  onClose?: () => void;
}

type FrequencyOption = "monthly" | "quarterly" | "yearly" | "oneOff";

export default function BillsForm({
  billId,
  initialBill,
  addressOptions = [],
  selectedAddressId = null,
  onSelectedAddressChange,
  onSubmitSuccess,
  onClose,
}: BillsFormProps) {
  const dispatch = useDispatch<AppDispatch>();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [billName, setBillName] = useState(initialBill?.name || "");
  const [yearlyAmount, setYearlyAmount] = useState<number>(
    Number(initialBill?.amount ?? 0),
  );
  const [fixedAmount, setFixedAmount] = useState<number | null>(
    initialBill?.amount != null ? Number(initialBill.amount) : null,
  );
  const [userId, setUserId] = useState("");
  const [walletId, setWalletId] = useState("");
  const [frequency, setFrequency] = useState<FrequencyOption>(
    (initialBill?.frequency as FrequencyOption) || "yearly",
  );

  const isAddressScopedBill = fixedAmount != null;

  const frequencyOptions = [
    // { label: "Monthly", value: "monthly" },
    { label: "Quarterly", value: "quarterly" },
    { label: "Yearly", value: "yearly" },
    ...(isAddressScopedBill
      ? [{ label: "One-off", value: "oneOff" as const }]
      : []),
  ];

  const proratedAmount = useMemo(() => {
    if (fixedAmount != null) {
      return Number(fixedAmount).toFixed(2);
    }
    switch (frequency) {
      case "monthly":
        return (yearlyAmount / 12).toFixed(2);
      case "quarterly":
        return (yearlyAmount / 4).toFixed(2);
      default:
        return yearlyAmount.toFixed(2);
    }
  }, [yearlyAmount, frequency, fixedAmount]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const billRes = await dispatch(getBill(billId)).unwrap();
        const billData = billRes?.data;
        if (billData) {
          setBillName(
            billData.name || billData.billName || initialBill?.name || "",
          );
          const amountFromBill =
            billData.amount != null
              ? Number(billData.amount)
              : billData.amountPaid != null
                ? Number(billData.amountPaid)
                : initialBill?.amount != null
                  ? Number(initialBill.amount)
                  : null;
          const yearlyFromBill =
            billData.yearlyAmount != null
              ? Number(billData.yearlyAmount)
              : null;

          if (amountFromBill != null && Number.isFinite(amountFromBill)) {
            setFixedAmount(amountFromBill);
            setYearlyAmount(amountFromBill);
          } else {
            setFixedAmount(null);
            setYearlyAmount(Number(yearlyFromBill ?? 0));
          }

          const billFrequency = (billData.frequency ||
            initialBill?.frequency) as FrequencyOption | undefined;
          if (
            billFrequency === "monthly" ||
            billFrequency === "quarterly" ||
            billFrequency === "yearly" ||
            billFrequency === "oneOff"
          ) {
            setFrequency(billFrequency);
          }
        } else if (initialBill) {
          setBillName(initialBill.name || "");
          if (initialBill.amount != null) {
            setFixedAmount(Number(initialBill.amount));
            setYearlyAmount(Number(initialBill.amount));
          }
          const freq = initialBill.frequency as FrequencyOption | undefined;
          if (
            freq === "monthly" ||
            freq === "quarterly" ||
            freq === "yearly" ||
            freq === "oneOff"
          ) {
            setFrequency(freq);
          }
        }

        const userRes = await dispatch(getSignedInUser()).unwrap();
        const user = userRes?.data;
        if (user) {
          setUserId(user.id || user._id || "");
          setWalletId(user.walletId ?? user.wallet?.id ?? "");
        }
      } catch (err: any) {
        // Fall back to list prefill when getBill fails for address assignments
        if (initialBill?.name || initialBill?.amount != null) {
          setBillName(initialBill.name || "");
          if (initialBill.amount != null) {
            setFixedAmount(Number(initialBill.amount));
            setYearlyAmount(Number(initialBill.amount));
          }
          const freq = initialBill.frequency as FrequencyOption | undefined;
          if (
            freq === "monthly" ||
            freq === "quarterly" ||
            freq === "yearly" ||
            freq === "oneOff"
          ) {
            setFrequency(freq);
          }
        } else {
          toast.error(err?.message || "Failed to load bill or user details");
        }

        try {
          const userRes = await dispatch(getSignedInUser()).unwrap();
          const user = userRes?.data;
          if (user) {
            setUserId(user.id || user._id || "");
            setWalletId(user.walletId ?? user.wallet?.id ?? "");
          }
        } catch {
          // ignore secondary failure
        }
      } finally {
        setLoading(false);
      }
    };

    if (billId) load();
    // Prefill values are only used as fallback on first load for this billId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billId, dispatch]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!billId || !userId || !walletId) {
      toast.error("Missing bill or wallet information.");
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
          addressId: selectedAddressId ?? undefined,
          frequency,
          amountPaid: Number(proratedAmount),
        })
      ).unwrap();

      toast.success("Bill payment successful");
      onSubmitSuccess?.();
      onClose?.();
    } catch (err: any) {
      const message =
        err?.message ||
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string" ? err.response.data : null) ||
        "Failed to pay bill";
      toast.error(message);
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
              <Label>Payment Frequency</Label>
              <Select
                options={frequencyOptions}
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as FrequencyOption)}
                disabled={isAddressScopedBill}
              />
            </div>


            <div>
              <Label>Amount to Pay</Label>
              <Input readOnly type="number" value={proratedAmount} />
              <p className="text-sm text-muted-foreground mt-1">
                {isAddressScopedBill
                  ? `Bill amount is ₦${Number(fixedAmount).toLocaleString()}.`
                  : `Yearly total is ₦${yearlyAmount.toLocaleString()}. Prorated based on selected period.`}
              </p>
            </div>
          </div>
        )}

        <div className="pt-6">
          <Button type="submit" className="w-full" disabled={loading || submitting}>
            {submitting ? "Processing..." : `Pay ₦${proratedAmount}`}
          </Button>
        </div>
      </CardContent>
    </form>
  );
}
