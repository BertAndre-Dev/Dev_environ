"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/redux/store";
import { getFieldByEstate } from "@/redux/slice/admin/address-mgt/fields/fields";
import { getEntriesByField } from "@/redux/slice/admin/address-mgt/entry/entry";
import { getAllUsersByEstate } from "@/redux/slice/admin/user-mgt/user";
import { getBill } from "@/redux/slice/admin/bills-mgt/bills";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import {
  formatAmountInput,
  parseFormattedNumber,
} from "@/lib/format-number";
import { formatAddressEntryLabel, normalizeAddresses } from "@/lib/address";

export type BillForAddressFrequency = "quarterly" | "yearly" | "oneOff";

export interface BillForAddressFormData {
  addressId: string;
  name: string;
  description: string;
  amount: number;
  frequency: BillForAddressFrequency;
  isServiceCharge: boolean;
}

export interface BillForAddressInitialData {
  id?: string;
  billId?: string;
  addressId?: string;
  name?: string;
  description?: string;
  amount?: number;
  frequency?: string;
}

interface ResidentRecord {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

function residentLabel(u: ResidentRecord): string {
  return `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email || u.id;
}

function findResidentForAddress(
  residents: ResidentRecord[],
  addressId: string,
): ResidentRecord | undefined {
  if (!addressId) return undefined;
  return residents.find((r) => {
    const addresses = normalizeAddresses(
      r as unknown as Record<string, unknown>,
    );
    return addresses.some((a) => a.id === addressId);
  });
}

function getSubmitLabel(submitting: boolean, isEditing: boolean): string {
  if (submitting) return isEditing ? "Updating..." : "Creating...";
  return isEditing ? "Update Bill" : "Create Bill";
}

interface BillForAddressFormProps {
  readonly estateId: string;
  readonly initialData?: BillForAddressInitialData | null;
  readonly onSubmit: (data: BillForAddressFormData) => Promise<void> | void;
  readonly onClose?: () => void;
}

export default function BillForAddressForm(props: BillForAddressFormProps) {
  const { estateId, initialData = null, onSubmit, onClose } = props;
  const dispatch = useDispatch<AppDispatch>();
  const isEditing = Boolean(initialData?.id || initialData?.billId);

  const [addressOptions, setAddressOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [residents, setResidents] = useState<ResidentRecord[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [loadingBill, setLoadingBill] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    addressId: initialData?.addressId || "",
    name: initialData?.name || "",
    description: initialData?.description || "",
    amount:
      initialData?.amount != null
        ? formatAmountInput(String(initialData.amount))
        : "",
  });

  const attachedResidentName = useMemo(() => {
    const matched = findResidentForAddress(residents, form.addressId);
    return matched ? residentLabel(matched) : "";
  }, [residents, form.addressId]);

  useEffect(() => {
    const loadAddresses = async () => {
      try {
        setLoadingAddresses(true);

        const [usersRes, fieldRes] = await Promise.all([
          dispatch(
            getAllUsersByEstate({
              estateId,
              page: 1,
              limit: 500,
              role: "resident",
            }),
          ).unwrap(),
          dispatch(getFieldByEstate(estateId)).unwrap(),
        ]);

        const users = (usersRes?.data || []) as Array<
          ResidentRecord & { _id?: string; role?: string }
        >;
        setResidents(
          users
            .filter((u) => (u.role || "resident").toLowerCase() === "resident")
            .map((u) => ({
              ...u,
              id: u.id || u._id || "",
            }))
            .filter((u) => u.id),
        );

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
            const label = formatAddressEntryLabel(entry.data);
            return {
              label: label || entry.id,
              value: entry.id,
            };
          },
        );

        setAddressOptions(options);
        if (!isEditing && options.length === 1) {
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
  }, [dispatch, estateId, isEditing]);

  useEffect(() => {
    const billId = initialData?.billId || initialData?.id;
    if (!billId) return;

    const loadBill = async () => {
      try {
        setLoadingBill(true);
        const res = await dispatch(getBill(billId)).unwrap();
        const fetchData = res?.data;
        if (!fetchData) return;

        setForm((prev) => ({
          addressId:
            fetchData.addressId || initialData?.addressId || prev.addressId,
          name: fetchData.name || fetchData.billName || prev.name,
          description: fetchData.description || prev.description,
          amount: formatAmountInput(
            String(
              fetchData.amountDue ??
                fetchData.amount ??
                fetchData.amountPaid ??
                fetchData.yearlyAmount ??
                initialData?.amount ??
                0,
            ),
          ),
        }));
      } catch (error: any) {
        toast.error(error?.message || "Failed to load bill");
      } finally {
        setLoadingBill(false);
      }
    };

    loadBill();
  }, [dispatch, initialData]);

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
        frequency: "oneOff",
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
          {isEditing ? "Update bill for an address" : "Create bill for an address"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loadingBill ? (
          <p className="text-gray-500 italic">Loading bill...</p>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="addressId">Address</Label>
              <select
                id="addressId"
                aria-label="Select address"
                className="w-full border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0150AC]"
                value={form.addressId}
                onChange={(e) => handleChange("addressId", e.target.value)}
                disabled={
                  isEditing ||
                  loadingAddresses ||
                  addressOptions.length === 0
                }
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
              {!loadingAddresses && addressOptions.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No addresses configured for this estate.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="residentName">Resident</Label>
              <Input
                id="residentName"
                value={attachedResidentName}
                readOnly
                className="bg-muted/50 cursor-not-allowed"
                placeholder={
                  form.addressId
                    ? "No resident linked to this address"
                    : "Select an address to see the resident"
                }
              />
            </div>

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
          </>
        )}

        <div className="pt-4 flex gap-2">
          {onClose && (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={submitting || loadingBill}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            className="flex-1"
            disabled={submitting || loadingBill}
          >
            {getSubmitLabel(submitting, isEditing)}
          </Button>
        </div>
      </CardContent>
    </form>
  );
}
