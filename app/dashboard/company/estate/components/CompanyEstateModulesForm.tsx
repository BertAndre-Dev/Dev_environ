"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModuleSelectionChips } from "@/components/shared/module-selection-chips";
import { getApiErrorMessage } from "@/lib/api-error";
import type { AppDispatch } from "@/redux/store";
import {
  fetchCompanyEstateEnabledModules,
  fetchCompanyEstateModules,
  updateCompanyEstateModules,
} from "@/redux/slice/company/estate-mgt/company-estate";
import { parseEstateModulesResponse } from "@/lib/estate-module-labels";
import {
  selectCompanyAvailableModules,
  selectCompanyEstateModulesError,
  selectCompanyEstateModulesLoading,
  selectCompanyModulesError,
  selectCompanyModulesLoading,
} from "@/redux/slice/company/estate-mgt/company-estate-slice";

interface CompanyEstateModulesFormProps {
  readonly estateId: string;
  readonly estateName: string;
  readonly initialModules?: string[];
  readonly onSuccess: () => void;
  readonly onCancel: () => void;
}

export function CompanyEstateModulesForm({
  estateId,
  estateName,
  initialModules,
  onSuccess,
  onCancel,
}: CompanyEstateModulesFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const seededModules = Array.isArray(initialModules) ? initialModules : [];
  const [selectedModules, setSelectedModules] = useState<string[]>(() => [
    ...seededModules,
  ]);
  const [submitting, setSubmitting] = useState(false);

  const availableModules = useSelector(selectCompanyAvailableModules);
  const companyModulesLoading = useSelector(selectCompanyModulesLoading);
  const companyModulesError = useSelector(selectCompanyModulesError);
  const estateModulesLoading = useSelector(selectCompanyEstateModulesLoading);
  const estateModulesError = useSelector(selectCompanyEstateModulesError);

  useEffect(() => {
    const seeded = Array.isArray(initialModules) ? [...initialModules] : [];
    setSelectedModules(seeded);
    dispatch(fetchCompanyEstateModules());
    dispatch(fetchCompanyEstateEnabledModules(estateId))
      .unwrap()
      .then((res) => {
        const mods = parseEstateModulesResponse(res);
        setSelectedModules(mods.length > 0 ? mods : seeded);
      })
      .catch((err: unknown) => {
        if (seeded.length === 0) {
          const message = getApiErrorMessage(err);
          if (message) toast.error(message);
        }
      });
  }, [dispatch, estateId, initialModules]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedModules.length === 0) {
      toast.error("Select at least one module");
      return;
    }
    setSubmitting(true);
    try {
      await dispatch(
        updateCompanyEstateModules({ id: estateId, modules: selectedModules }),
      ).unwrap();
      toast.success("Estate modules updated successfully!");
      onSuccess();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const loading = companyModulesLoading || estateModulesLoading;
  const loadError = companyModulesError || estateModulesError;

  return (
    <form onSubmit={handleSubmit}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold pt-4">
          Update Estate Modules
        </CardTitle>
        <p className="text-sm text-muted-foreground pb-6">
          Select which modules are enabled for{" "}
          <strong>{estateName || "this estate"}</strong>.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center gap-2 rounded-md border border-border px-3 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading modules…
            </div>
          ) : loadError ? (
            <p className="text-sm text-destructive">{loadError}</p>
          ) : availableModules.length === 0 ? (
            <p className="text-sm text-destructive">
              No modules are available.
            </p>
          ) : (
            <ModuleSelectionChips
              availableModules={availableModules}
              selectedModules={selectedModules}
              onChange={setSelectedModules}
            />
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              loading ||
              submitting ||
              Boolean(loadError) ||
              availableModules.length === 0 ||
              selectedModules.length === 0
            }
          >
            {submitting ? "Updating…" : "Update Modules"}
          </Button>
        </div>
      </CardContent>
    </form>
  );
}
