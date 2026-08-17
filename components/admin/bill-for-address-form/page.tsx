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
import { getApiErrorMessage } from "@/lib/api-error";
import {
  formatAmountInput,
  parseFormattedNumber,
} from "@/lib/format-number";
import { formatAddressEntryLabel, normalizeAddresses } from "@/lib/address";
import { AccrueInterestFields, toInterestStartDate } from "@/components/admin/bills-form/accrue-interest-fields";
import { cn } from "@/lib/utils";

export interface BillForAddressFormData {
  addressId: string;
  name: string;
  description: string;
  amount: number;
  frequency: "oneoff";
  compulsory: boolean;
  accrueInterest: boolean;
  interestRatePercent: number;
  interestStartsAt?: string;
}

export interface BillForAddressInitialData {
  id?: string;
  billId?: string;
  addressId?: string;
  name?: string;
  description?: string;
  amount?: number;
  compulsory?: boolean;
  accrueInterest?: boolean;
  interestRatePercent?: number;
  interestStartsAt?: string;
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
    compulsory: Boolean(initialData?.compulsory),
    accrueInterest: Boolean(initialData?.accrueInterest),
    interestRatePercent:
      initialData?.interestRatePercent != null
        ? String(initialData.interestRatePercent)
        : "",
    interestStartsAt: toInterestStartDate(initialData?.interestStartsAt),
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
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
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
          compulsory: Boolean(
            fetchData.compulsory ?? initialData?.compulsory ?? prev.compulsory,
          ),
          accrueInterest: Boolean(
            fetchData.accrueInterest ??
              initialData?.accrueInterest ??
              prev.accrueInterest,
          ),
          interestRatePercent:
            fetchData.interestRatePercent != null
              ? String(fetchData.interestRatePercent)
              : initialData?.interestRatePercent != null
                ? String(initialData.interestRatePercent)
                : prev.interestRatePercent,
          interestStartsAt:
            toInterestStartDate(fetchData.interestStartsAt) ||
            toInterestStartDate(initialData?.interestStartsAt) ||
            prev.interestStartsAt,
        }));
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      } finally {
        setLoadingBill(false);
      }
    };

    loadBill();
  }, [dispatch, initialData]);

  const handleChange = (
    field: keyof typeof form,
    value: string | boolean,
  ) => {
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
    const interestRate = form.accrueInterest
      ? Number(form.interestRatePercent)
      : 0;
    if (
      form.accrueInterest &&
      (!Number.isFinite(interestRate) || interestRate < 0)
    ) {
      toast.error("Please enter a valid interest rate.");
      return;
    }
    if (form.accrueInterest && !form.interestStartsAt) {
      toast.error("Please select when interest should start.");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        addressId: form.addressId,
        name: form.name.trim(),
        description: form.description.trim(),
        amount,
        frequency: "oneoff",
        compulsory: form.compulsory,
        accrueInterest: form.accrueInterest,
        interestRatePercent: interestRate,
        interestStartsAt: form.accrueInterest
          ? form.interestStartsAt
          : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardHeader className="px-0 md:px-0">
        <CardTitle className="text-lg pb-2 pt-2 font-semibold">
          {isEditing ? "Update bill for an address" : "Create bill for an address"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-0 md:px-0">
        {loadingBill ? (
          <p className="text-gray-500 italic">Loading bill...</p>
        ) : (
          <>
            <AccrueInterestFields
              idPrefix="address-bill"
              accrueInterest={form.accrueInterest}
              interestRatePercent={form.interestRatePercent}
              interestStartsAt={form.interestStartsAt}
              onAccrueInterestChange={(value) =>
                handleChange("accrueInterest", value)
              }
              onInterestRateChange={(value) =>
                handleChange("interestRatePercent", value)
              }
              onInterestStartsAtChange={(value) =>
                handleChange("interestStartsAt", value)
              }
            />

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

            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="address-bill-compulsory" className="font-medium">
                Compulsory bill
              </Label>
              <button
                id="address-bill-compulsory"
                type="button"
                role="switch"
                aria-checked={form.compulsory}
                aria-label="Compulsory bill"
                onClick={() => handleChange("compulsory", !form.compulsory)}
                className={cn(
                  "relative inline-flex h-7 w-[44px] shrink-0 cursor-pointer items-center rounded-full p-0.5",
                  "transition-colors duration-150 ease-out active:scale-[0.97]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0150AC]/40",
                  form.compulsory ? "bg-[#0150AC]" : "bg-black/15",
                )}
              >
                <span
                  className={cn(
                    "block size-6 rounded-full bg-white shadow-sm transition-transform duration-150",
                    form.compulsory ? "translate-x-4" : "translate-x-0",
                  )}
                />
              </button>
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
