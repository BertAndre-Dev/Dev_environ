"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/lib/api-error";
import type { AppDispatch } from "@/redux/store";
import { getFieldByEstate } from "@/redux/slice/admin/address-mgt/fields/fields";
import { getEntriesByField } from "@/redux/slice/admin/address-mgt/entry/entry";
import { assignCompanyMeterToEstate } from "@/redux/slice/company/meter-mgt/company-meter";

type Props = {
  meterNumber: string;
  estateId: string;
  close: () => void;
  refresh: () => void;
};

interface SelectOption {
  label: string;
  value: string;
}

export default function CompanyAssignMeterToAddressForm({
  meterNumber,
  estateId,
  close,
  refresh,
}: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();
  const [addressId, setAddressId] = useState("");
  const [entryOptions, setEntryOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!estateId) {
        toast.error("Select an estate before assigning a meter to an address.");
        return;
      }
      try {
        setLoading(true);
        const fieldsRes = await dispatch(getFieldByEstate(estateId)).unwrap();
        const fields = fieldsRes?.data || [];
        if (!fields.length) {
          toast.error("No address fields configured for this estate.");
          return;
        }

        const primaryFieldId = fields[0].id;
        const entryRes = await dispatch(
          getEntriesByField({ fieldId: primaryFieldId, page: 1, limit: 200 }),
        ).unwrap();

        const entries = entryRes?.data || [];
        setEntryOptions(
          entries.map((entry: { id?: string; data?: Record<string, string> }) => {
            const d = entry.data || {};
            const display = Object.entries(d)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ");
            return {
              label: display || "Unnamed Address",
              value: entry.id ?? "",
            };
          }).filter((o: SelectOption) => Boolean(o.value)),
        );
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [dispatch, estateId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressId) {
      toast.error("Please select an address");
      return;
    }
    if (!estateId || !meterNumber.trim()) {
      toast.error("Meter and estate are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await dispatch(
        assignCompanyMeterToEstate({
          meterNumber: meterNumber.trim(),
          estateId,
          addressId,
        }),
      ).unwrap();
      toast.success(res?.message || "Meter assigned successfully.");
      refresh();
      close();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="mt-12 mx-auto">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Assign Meter</CardTitle>
      </CardHeader>
      <CardContent className="border-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="font-normal text-[20px]">Meter Number</Label>
            <p className="mt-1 text-sm font-medium font-mono">{meterNumber}</p>
          </div>

          <div>
            <Label className="font-normal text-[20px]">Address</Label>
            {loading ? (
              <div className="px-3 py-2 text-sm bg-gray-50">
                Loading addresses...
              </div>
            ) : (
              <Select
                options={[
                  { value: "", label: "Select an address" },
                  ...entryOptions,
                ]}
                value={addressId}
                onChange={(e) => setAddressId(e.target.value)}
              />
            )}
          </div>

          <Button
            type="submit"
            disabled={loading || submitting}
            className="w-full"
          >
            {submitting ? "Assigning..." : "Assign Meter"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
