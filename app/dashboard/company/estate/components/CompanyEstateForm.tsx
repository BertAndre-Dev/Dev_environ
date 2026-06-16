"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CountryDropdown, RegionDropdown } from "react-country-region-selector";
import { ModuleSelectionChips } from "@/components/shared/module-selection-chips";
import type { AppDispatch } from "@/redux/store";
import {
  type EstateData,
  VisitorVerificationMode,
  fetchCompanyEstateModules,
} from "@/redux/slice/company/estate-mgt/company-estate";
import {
  selectCompanyAvailableModules,
  selectCompanyModulesError,
  selectCompanyModulesLoading,
} from "@/redux/slice/company/estate-mgt/company-estate-slice";

type Props = {
  initialData?: EstateData | null;
  onSubmit: (data: EstateData) => void;
};

export default function CompanyEstateForm({
  initialData = null,
  onSubmit,
}: Readonly<Props>) {
  const isEditing = Boolean(initialData);
  const dispatch = useDispatch<AppDispatch>();

  const availableModules = useSelector(selectCompanyAvailableModules);
  const modulesLoading = useSelector(selectCompanyModulesLoading);
  const modulesError = useSelector(selectCompanyModulesError);

  const [formData, setFormData] = useState<EstateData>(() => ({
    name: initialData?.name ?? "",
    address: initialData?.address ?? "",
    city: initialData?.city ?? "",
    state: initialData?.state ?? "",
    country: initialData?.country ?? "",
    modules: Array.isArray(initialData?.modules) ? [...initialData!.modules!] : [],
    visitorVerificationMode:
      initialData?.visitorVerificationMode ?? VisitorVerificationMode.VIEW_AND_VERIFY,
  }));

  useEffect(() => {
    if (isEditing) return;
    dispatch(fetchCompanyEstateModules());
  }, [dispatch, isEditing]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        address: initialData.address,
        city: initialData.city,
        state: initialData.state,
        country: initialData.country,
        modules: Array.isArray(initialData.modules) ? [...initialData.modules] : [],
        visitorVerificationMode:
          initialData.visitorVerificationMode ?? VisitorVerificationMode.VIEW_AND_VERIFY,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing && (!formData.modules || formData.modules.length === 0)) {
      toast.error("Select at least one module for this estate");
      return;
    }
    if (isEditing) {
      const { modules: _modules, ...rest } = formData;
      onSubmit({ ...rest, modules: [] });
      return;
    }
    onSubmit({ ...formData });
  };

  const textFields = [
    { label: "Estate Name", name: "name" as const, placeholder: "Enter estate name" },
    { label: "Estate Address", name: "address" as const, placeholder: "Enter address" },
    { label: "City", name: "city" as const, placeholder: "Enter city" },
  ];

  const selectedModules = formData.modules ?? [];

  return (
    <form onSubmit={handleSubmit}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold pb-4">
          {initialData ? "Update Estate" : "Create New Estate"}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-8">
        {textFields.map((field) => (
          <div key={field.name}>
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              name={field.name}
              value={formData[field.name]}
              onChange={handleChange}
              placeholder={field.placeholder}
              required
            />
          </div>
        ))}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Country</Label>
            <CountryDropdown
              value={formData.country}
              onChange={(val) => setFormData({ ...formData, country: val, state: "" })}
              className="w-full border border-input rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <Label>State / Region</Label>
            <RegionDropdown
              country={formData.country}
              value={formData.state}
              onChange={(val) => setFormData({ ...formData, state: val })}
              className="w-full border border-input rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="visitorVerificationMode">Visitor Verification Mode</Label>
          <select
            id="visitorVerificationMode"
            name="visitorVerificationMode"
            title="Visitor verification mode"
            value={
              formData.visitorVerificationMode ??
              VisitorVerificationMode.VIEW_AND_VERIFY
            }
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                visitorVerificationMode: e.target.value as VisitorVerificationMode,
              }))
            }
            className="w-full border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
          >
            <option value={VisitorVerificationMode.VIEW_AND_VERIFY}>
              View and verify
            </option>
            <option value={VisitorVerificationMode.VERIFY_ONLY}>Verify only</option>
            <option value={VisitorVerificationMode.VIEW_ONLY}>View only</option>
          </select>
        </div>

        {!isEditing && (
          <div className="space-y-3">
            <Label>Modules</Label>
            <p className="text-sm text-muted-foreground">
              Select one or more modules to enable for this estate.
            </p>

            {modulesLoading ? (
              <div className="flex items-center gap-2 rounded-md border border-border px-3 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading available modules…
              </div>
            ) : modulesError ? (
              <p className="text-sm text-destructive">{modulesError}</p>
            ) : availableModules.length === 0 ? (
              <p className="text-sm text-destructive">
                No modules are available. Please contact support.
              </p>
            ) : (
              <ModuleSelectionChips
                availableModules={availableModules}
                selectedModules={selectedModules}
                onChange={(modules) =>
                  setFormData((prev) => ({ ...prev, modules }))
                }
              />
            )}
          </div>
        )}

        <div className="w-full pt-4">
          <Button
            type="submit"
            className="w-full cursor-pointer"
            disabled={
              !isEditing &&
              (modulesLoading ||
                Boolean(modulesError) ||
                availableModules.length === 0 ||
                selectedModules.length === 0)
            }
          >
            {initialData ? "Update" : "Create Estate"}
          </Button>
        </div>
      </CardContent>
    </form>
  );
}
