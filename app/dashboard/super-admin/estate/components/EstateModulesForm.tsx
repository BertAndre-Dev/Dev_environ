"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AppDispatch, RootState } from "@/redux/store";
import { getCompanyModules } from "@/redux/slice/super-admin/company-mgt/company";
import {
  fetchEstateModules,
  updateEstateModules,
} from "@/redux/slice/super-admin/super-admin-est-mgt/super-admin-est-mgt";
import {
  labelForEstateModule,
  parseEstateModulesResponse,
} from "@/lib/estate-module-labels";
import {
  selectModulesError,
  selectModulesLoading,
} from "@/redux/slice/super-admin/super-admin-est-mgt/super-admin-est-mgt-slice";

interface EstateModulesFormProps {
  readonly estateId: string;
  readonly estateName: string;
  readonly initialModules?: string[];
  readonly onSuccess: () => void;
  readonly onCancel: () => void;
}

export function EstateModulesForm({
  estateId,
  estateName,
  initialModules,
  onSuccess,
  onCancel,
}: EstateModulesFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const seededModules = Array.isArray(initialModules) ? initialModules : [];
  const [selectedModules, setSelectedModules] = useState<string[]>(() => [
    ...seededModules,
  ]);
  const [submitting, setSubmitting] = useState(false);

  const { availableModules, companyModulesLoading, companyModulesError } =
    useSelector((state: RootState) => {
      const companyState = state.superAdminCompany;
      return {
        availableModules: (companyState?.modules ?? []) as string[],
        companyModulesLoading: companyState?.getModulesStatus === "isLoading",
        companyModulesError:
          companyState?.getModulesStatus === "failed"
            ? (companyState?.error ?? "Failed to load modules")
            : null,
      };
    });

  const estateModulesLoading = useSelector(selectModulesLoading);
  const estateModulesError = useSelector(selectModulesError);

  useEffect(() => {
    const seeded = Array.isArray(initialModules) ? [...initialModules] : [];
    setSelectedModules(seeded);
    dispatch(getCompanyModules());
    dispatch(fetchEstateModules(estateId))
      .unwrap()
      .then((res) => {
        const mods = parseEstateModulesResponse(res);
        setSelectedModules(mods.length > 0 ? mods : seeded);
      })
      .catch(() => {
        if (seeded.length === 0) {
          toast.error("Failed to load estate modules");
        }
      });
  }, [dispatch, estateId, initialModules]);

  const toggleModule = (key: string) => {
    setSelectedModules((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return Array.from(next);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedModules.length === 0) {
      toast.error("Select at least one module");
      return;
    }
    setSubmitting(true);
    try {
      await dispatch(
        updateEstateModules({ id: estateId, modules: selectedModules }),
      ).unwrap();
      toast.success("Estate modules updated successfully!");
      onSuccess();
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message ??
        "Failed to update estate modules";
      toast.error(message);
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
            <div className="flex flex-wrap gap-2">
              {availableModules.map((key) => {
                const selected = selectedModules.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleModule(key)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition-colors cursor-pointer",
                      selected
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border bg-background hover:bg-muted/50 text-foreground",
                    )}
                  >
                    {labelForEstateModule(key)}
                  </button>
                );
              })}
            </div>
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
