"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import type { AppDispatch, RootState } from "@/redux/store";
import {
  reassignMeter,
  type ReassignMeterPayload,
} from "@/redux/slice/meter/reassign-meter/reassign-meter";
import {
  resetReassignMeterState,
  selectReassignMeterLoading,
} from "@/redux/slice/meter/reassign-meter/reassign-meter-slice";
import { getApiErrorMessage, getApiSuccessMessage } from "@/lib/api-error";

type SelectOption = { label: string; value: string };

export type ReassignMeterFormProps = {
  meterNumber: string;
  /** Current estate (when reassigning between estates). */
  estateId?: string;
  /** Company inventory id (company users / company-pool meters). */
  companyId?: string;
  /** Optional address to bind after reassignment. */
  addressId?: string;
  estateOptions: SelectOption[];
  estatesLoading?: boolean;
  close: () => void;
  refresh: () => void;
  title?: string;
};

export default function ReassignMeterForm({
  meterNumber,
  estateId,
  companyId,
  addressId,
  estateOptions,
  estatesLoading = false,
  close,
  refresh,
  title = "Reassign Meter",
}: Readonly<ReassignMeterFormProps>) {
  const dispatch = useDispatch<AppDispatch>();
  const submitting = useSelector(selectReassignMeterLoading);
  const userId = useSelector((state: RootState) => {
    const user = state.auth.user as { id?: string; _id?: string } | null;
    return String(user?.id ?? user?._id ?? "").trim() || undefined;
  });

  const [newEstateId, setNewEstateId] = useState("");

  useEffect(() => {
    return () => {
      dispatch(resetReassignMeterState());
    };
  }, [dispatch]);

  const selectableEstates = useMemo(
    () =>
      estateOptions.filter((opt) => {
        if (!opt.value) return false;
        // Don't offer the meter’s current estate as the destination.
        if (estateId && opt.value === estateId) return false;
        return true;
      }),
    [estateOptions, estateId],
  );

  const selectedEstate = useMemo(
    () => selectableEstates.find((o) => o.value === newEstateId) ?? null,
    [selectableEstates, newEstateId],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMeter = meterNumber.trim();
    if (!trimmedMeter) {
      toast.error("Meter number is required.");
      return;
    }
    if (!newEstateId) {
      toast.error("Please select an estate.");
      return;
    }

    const payload: ReassignMeterPayload = {
      meterNumber: trimmedMeter,
      newEstateId,
      ...(userId ? { userId } : {}),
      ...(estateId ? { estateId } : {}),
      ...(companyId ? { companyId } : {}),
      ...(addressId ? { addressId } : {}),
    };

    try {
      const res = await dispatch(reassignMeter(payload)).unwrap();
      toast.success(
        getApiSuccessMessage(res) || "Meter reassigned successfully.",
      );
      refresh();
      close();
    } catch (error: unknown) {
      const message = getApiErrorMessage(error);
      toast.error(message || "Failed to reassign meter.");
    }
  };

  return (
    <Card className="max-w-lg mx-auto mt-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label>Meter Number</Label>
            <p className="mt-1 text-sm font-medium font-mono">{meterNumber}</p>
          </div>

          <div className="space-y-2">
            <Label>Assign to Estate</Label>
            <Select
              options={selectableEstates}
              value={selectedEstate}
              onChange={(opt) => setNewEstateId(opt?.value ?? "")}
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
              disabled={submitting || !meterNumber.trim() || !newEstateId}
              className="flex-1"
            >
              {submitting ? "Reassigning..." : "Reassign"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
