"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import Select from "react-select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/lib/api-error";
import type { AppDispatch } from "@/redux/store";
import { getCompanyEstates } from "@/redux/slice/company/estate-mgt/company-estate";
import { addCompanyMeter } from "@/redux/slice/company/meter-mgt/company-meter";

type Props = {
  companyId: string;
  close: () => void;
  refresh: () => void;
};

type SelectOption = { label: string; value: string };

export default function CompanyAssignMeterForm({
  companyId,
  close,
  refresh,
}: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();
  const [meterNumber, setMeterNumber] = useState("");
  const [estateId, setEstateId] = useState("");
  const [estateOptions, setEstateOptions] = useState<SelectOption[]>([]);
  const [loadingEstates, setLoadingEstates] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingEstates(true);
      try {
        const res = await dispatch(
          getCompanyEstates({ page: 1, limit: 500 }),
        ).unwrap();
        const rows = (res?.data ?? []) as Array<{
          id?: string;
          _id?: string;
          name?: string;
        }>;
        setEstateOptions(
          rows
            .map((e) => {
              const value = String(e.id ?? e._id ?? "").trim();
              if (!value) return null;
              return { value, label: e.name ?? "Unnamed estate" };
            })
            .filter((o): o is SelectOption => Boolean(o)),
        );
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      } finally {
        setLoadingEstates(false);
      }
    })();
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMeter = meterNumber.trim();
    if (!trimmedMeter) {
      toast.error("Please enter a meter number");
      return;
    }
    if (!companyId) {
      toast.error("Company is required");
      return;
    }
    if (!estateId) {
      toast.error("Please select an estate");
      return;
    }

    setSubmitting(true);
    try {
      const res = await dispatch(
        addCompanyMeter({
          meterNumber: trimmedMeter,
          companyId,
          estateId,
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
    <Card className="max-w-lg mx-auto mt-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Assign Meter</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="company-meter-number">Meter Number</Label>
            <Input
              id="company-meter-number"
              type="text"
              inputMode="numeric"
              placeholder="Enter meter number"
              value={meterNumber}
              onChange={(e) => setMeterNumber(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Assign to Estate</Label>
            <Select
              options={estateOptions}
              value={estateOptions.find((o) => o.value === estateId) ?? null}
              onChange={(opt) => setEstateId(opt?.value ?? "")}
              isLoading={loadingEstates}
              placeholder="Select an estate"
              isDisabled={loadingEstates}
            />
          </div>

          <Button
            type="submit"
            disabled={
              submitting || !meterNumber.trim() || !companyId || !estateId
            }
            className="w-full"
          >
            {submitting ? "Assigning..." : "Assign Meter"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
