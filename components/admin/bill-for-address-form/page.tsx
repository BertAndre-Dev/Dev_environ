"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/redux/store";
import { getFieldByEstate } from "@/redux/slice/admin/address-mgt/fields/fields";
import { getEntriesByField } from "@/redux/slice/admin/address-mgt/entry/entry";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import {
  formatAmountInput,
  parseFormattedNumber,
} from "@/lib/format-number";

export type BillForAddressFrequency = "quarterly" | "yearly" | "oneOff";

export interface BillForAddressFormData {
  addressId: string;
  name: string;
  description: string;
  amount: number;
  frequency: BillForAddressFrequency;
  isServiceCharge: boolean;
}

const FREQUENCY_OPTIONS: { label: string; value: BillForAddressFrequency }[] = [
  { label: "Quarterly", value: "quarterly" },
  { label: "Yearly", value: "yearly" },
  { label: "One-off", value: "oneOff" },
];

interface BillForAddressFormProps {
  readonly estateId: string;
  readonly onSubmit: (data: BillForAddressFormData) => Promise<void> | void;
  readonly onClose?: () => void;
}

export default function BillForAddressForm(props: BillForAddressFormProps) {
  const { estateId, onSubmit, onClose } = props;
  const dispatch = useDispatch<AppDispatch>();
  const [addressOptions, setAddressOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    addressId: "",
    name: "",
    description: "",
    amount: "",
    frequency: "oneOff" as BillForAddressFrequency,
  });

  useEffect(() => {
    const loadAddresses = async () => {
      try {
        setLoadingAddresses(true);

        const fieldRes = await dispatch(getFieldByEstate(estateId)).unwrap();
        const fields = fieldRes?.data || [];
        if (!fields.length) {
          toast.error("No address fields configured for this estate.");
          return;
        }

        const primaryFieldId = fields[0].id;
        const entryRes = await dispatch(
          getEntriesByField({ fieldId: primaryFieldId, page: 1, limit: 200 }),
        ).unwrap();

        const entries =
          entryRes?.data ??
          (entryRes as {
            data?: Array<{ id: string; data?: Record<string, string> }>;
          })?.data ??
          [];
        const options = entries.map(
          (entry: { id: string; data?: Record<string, string> }) => {
            const d = entry.data ?? {};
            const label = Object.entries(d)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ");
            return {
              label: label || entry.id,
              value: entry.id,
            };
          },
        );

        setAddressOptions(options);
        if (options.length === 1) {
          setForm((prev) =>
            prev.addressId ? prev : { ...prev, addressId: options[0].value },
          );
        }
      } catch {
        toast.error("Failed to load addresses.");
      } finally {
        setLoadingAddresses(false);
      }
    };

    if (estateId) {
      loadAddresses();
    }
  }, [dispatch, estateId]);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.addressId) {
      toast.error("Please select an address.");
      return;
    }
    if (!form.name.trim()) {
      toast.error("Please enter a bill name.");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Please enter a description.");
      return;
    }
    const amount = parseFormattedNumber(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        addressId: form.addressId,
        name: form.name.trim(),
        description: form.description.trim(),
        amount,
        frequency: form.frequency,
        isServiceCharge: false,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardHeader>
        <CardTitle className="text-lg pb-4 pt-8 font-semibold">
          Create bill for an address
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {addressOptions.length > 1 && (
          <div className="space-y-2">
            <Label htmlFor="addressId">Address</Label>
            <select
              id="addressId"
              aria-label="Select address"
              className="w-full border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0150AC]"
              value={form.addressId}
              onChange={(e) => handleChange("addressId", e.target.value)}
              disabled={loadingAddresses || addressOptions.length === 0}
            >
              <option value="">Select address...</option>
              {addressOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {loadingAddresses && (
              <p className="text-xs text-muted-foreground mt-1">
                Loading addresses...
              </p>
            )}
          </div>
        )}
        {loadingAddresses && addressOptions.length <= 1 && (
          <p className="text-xs text-muted-foreground">Loading addresses...</p>
        )}
        {!loadingAddresses && addressOptions.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No addresses configured for this estate.
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="billName">Bill Name</Label>
          <Input
            id="billName"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Gate repair"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Gate repair for Plot 12 only"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount (₦)</Label>
          <Input
            id="amount"
            type="text"
            inputMode="numeric"
            value={form.amount}
            onChange={(e) =>
              handleChange("amount", formatAmountInput(e.target.value))
            }
            placeholder="25,000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="frequency">Frequency</Label>
          <select
            id="frequency"
            aria-label="Select frequency"
            className="w-full border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0150AC]"
            value={form.frequency}
            onChange={(e) =>
              handleChange("frequency", e.target.value as BillForAddressFrequency)
            }
          >
            {FREQUENCY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="pt-4 flex gap-2">
          {onClose && (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" className="flex-1" disabled={submitting}>
            {submitting ? "Creating..." : "Create Bill"}
          </Button>
        </div>
      </CardContent>
    </form>
  );
}
