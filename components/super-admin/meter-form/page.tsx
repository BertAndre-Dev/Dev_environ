"use client";

import { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import Select from "react-select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import type { AppDispatch } from "@/redux/store";
import { getAllEstates } from "@/redux/slice/super-admin/super-admin-est-mgt/super-admin-est-mgt";
import { getCompanies } from "@/redux/slice/super-admin/company-mgt/company";
import { assignMeterToEstate } from "@/redux/slice/super-admin/super-admin-meter-mgt/super-admin-meter";

type AssignScope = "estate" | "company";

type AssignMeterFormProps = {
  close: () => void;
  refresh: () => void;
};

type SelectOption = { label: string; value: string };

type EstateRecord = {
  id: string;
  name: string;
  companyId: string;
};

function resolveCompanyId(
  value?: string | { id?: string; _id?: string } | null,
): string {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  return String(value.id ?? value._id ?? "").trim();
}

function toEstateRecord(estate: {
  id?: string;
  _id?: string;
  name?: string;
  companyId?: string | { id?: string; _id?: string };
  company?: { id?: string; _id?: string };
}): EstateRecord | null {
  const id = String(estate.id ?? estate._id ?? "").trim();
  if (!id) return null;

  return {
    id,
    name: estate.name ?? "Unnamed estate",
    companyId:
      resolveCompanyId(estate.companyId) || resolveCompanyId(estate.company),
  };
}

const FETCH_LIMIT = 500;

const AssignMeterForm: React.FC<AssignMeterFormProps> = ({ close, refresh }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [assignScope, setAssignScope] = useState<AssignScope>("estate");
  const [meterNumber, setMeterNumber] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [estateId, setEstateId] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [allEstates, setAllEstates] = useState<EstateRecord[]>([]);
  const [companyOptions, setCompanyOptions] = useState<SelectOption[]>([]);

  useEffect(() => {
    (async () => {
      setLoadingOptions(true);
      try {
        const [estatesRes, companiesRes] = await Promise.all([
          dispatch(getAllEstates({ page: 1, limit: FETCH_LIMIT })).unwrap(),
          dispatch(getCompanies({ page: 1, limit: FETCH_LIMIT })).unwrap(),
        ]);

        const estateRows = (estatesRes?.data ?? []) as Array<{
          id?: string;
          _id?: string;
          name?: string;
          companyId?: string | { id?: string; _id?: string };
          company?: { id?: string; _id?: string };
        }>;
        setAllEstates(
          estateRows
            .map((e) => toEstateRecord(e))
            .filter((e): e is EstateRecord => Boolean(e)),
        );

        const companyRows = (companiesRes?.data ?? []) as Array<{
          id?: string;
          _id?: string;
          name?: string;
        }>;
        setCompanyOptions(
          companyRows
            .map((c) => {
              const value = String(c.id ?? c._id ?? "").trim();
              if (!value) return null;
              return { value, label: c.name ?? "Unnamed company" };
            })
            .filter((o): o is SelectOption => Boolean(o)),
        );
      } catch {
        toast.error("Failed to load companies or estates.");
      } finally {
        setLoadingOptions(false);
      }
    })();
  }, [dispatch]);

  const estateOptions = useMemo(
    () => allEstates.map((e) => ({ value: e.id, label: e.name })),
    [allEstates],
  );

  const handleScopeChange = (scope: AssignScope) => {
    setAssignScope(scope);
    setCompanyId("");
    setEstateId("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedMeter = meterNumber.trim();
    if (!trimmedMeter) {
      toast.error("Please enter a meter number");
      return;
    }

    if (assignScope === "company" && !companyId) {
      toast.error("Please select a company");
      return;
    }
    if (assignScope === "estate" && !estateId) {
      toast.error("Please select an estate");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        meterNumber: trimmedMeter,
        ...(assignScope === "company" ? { companyId } : { estateId }),
      };
      const res = await dispatch(assignMeterToEstate(payload)).unwrap();
      toast.success(res?.message || "Meter assigned successfully.");
      refresh();
      close();
    } catch (error: unknown) {
      const message =
        (error as { message?: string })?.message ?? "Failed to assign meter";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit =
    Boolean(meterNumber.trim()) &&
    !loading &&
    !loadingOptions &&
    (assignScope === "company" ? Boolean(companyId) : Boolean(estateId));

  return (
    <Card className="max-w-lg mx-auto mt-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Assign Meter</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="meter-number">Meter Number</Label>
            <Input
              id="meter-number"
              type="text"
              inputMode="numeric"
              placeholder="Enter meter number"
              value={meterNumber}
              onChange={(e) => setMeterNumber(e.target.value)}
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Assign to</Label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="radio"
                  name="assignScope"
                  value="estate"
                  checked={assignScope === "estate"}
                  onChange={() => handleScopeChange("estate")}
                />
                Estate
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="radio"
                  name="assignScope"
                  value="company"
                  checked={assignScope === "company"}
                  onChange={() => handleScopeChange("company")}
                />
                Company
              </label>
            </div>
          </div>

          {assignScope === "estate" ? (
            <div className="space-y-2">
              <Label>Assign to Estate</Label>
              <Select
                options={estateOptions}
                value={estateOptions.find((o) => o.value === estateId) ?? null}
                onChange={(opt) => setEstateId(opt?.value ?? "")}
                isLoading={loadingOptions}
                placeholder="Select an estate"
                isDisabled={loadingOptions}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Assign to Company</Label>
              <Select
                options={companyOptions}
                value={
                  companyOptions.find((o) => o.value === companyId) ?? null
                }
                onChange={(opt) => setCompanyId(opt?.value ?? "")}
                isLoading={loadingOptions}
                placeholder="Select a company"
                isDisabled={loadingOptions}
              />
            </div>
          )}

          <Button type="submit" disabled={!canSubmit} className="w-full">
            {loading ? "Assigning..." : "Assign Meter"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AssignMeterForm;
