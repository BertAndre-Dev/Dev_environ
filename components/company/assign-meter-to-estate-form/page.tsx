"use client";

import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import type { AppDispatch, RootState } from "@/redux/store";
import { assignCompanyMeterToEstate } from "@/redux/slice/company/meter-mgt/company-meter";

type SelectOption = { label: string; value: string };

type Props = {
  meterNumber: string;
  close: () => void;
  refresh: () => void;
};

export default function CompanyAssignMeterToEstateForm({
  meterNumber,
  close,
  refresh,
}: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();
  const [estateId, setEstateId] = useState("");

  const { estateOptions, estatesLoading, submitting } = useSelector(
    (state: RootState) => {
      const estates = state.companyEstate.allEstates?.data ?? [];
      const options: SelectOption[] = estates
        .map((e) => {
          const value = String(e.id ?? e._id ?? "").trim();
          if (!value) return null;
          return { value, label: e.name ?? "Unnamed estate" };
        })
        .filter((o): o is SelectOption => Boolean(o))
        .sort((a, b) => a.label.localeCompare(b.label));

      return {
        estateOptions: options,
        estatesLoading: state.companyEstate.getAllEstatesStatus === "isLoading",
        submitting:
          state.companyMeter.assignMeterToEstateState === "isLoading",
      };
    },
  );

  const selectedEstate = useMemo(
    () => estateOptions.find((o) => o.value === estateId) ?? null,
    [estateOptions, estateId],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meterNumber.trim() || !estateId) return;

    try {
      const res = await dispatch(
        assignCompanyMeterToEstate({
          meterNumber: meterNumber.trim(),
          estateId,
        }),
      ).unwrap();
      if (res?.message) toast.success(res.message);
      refresh();
      close();
    } catch (error: unknown) {
      const message = (error as { message?: string })?.message;
      if (message) toast.error(message);
    }
  };

  return (
    <Card className="max-w-lg mx-auto mt-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Assign to estate
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label>Meter Number</Label>
            <p className="mt-1 text-sm font-medium font-mono">{meterNumber}</p>
          </div>

          <div className="space-y-2">
            <Label>Estate</Label>
            <Select
              options={estateOptions}
              value={selectedEstate}
              onChange={(opt) => setEstateId(opt?.value ?? "")}
              isLoading={estatesLoading}
              placeholder="Select an estate"
              isDisabled={estatesLoading || submitting}
              isSearchable
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={close}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !meterNumber.trim() || !estateId}
              className="flex-1"
            >
              {submitting ? "Assigning..." : "Assign"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
