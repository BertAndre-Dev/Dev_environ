"use client";

import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Modal from "@/components/modal/page";
import { ModuleSelectionChips } from "@/components/shared/module-selection-chips";
import type {
  CompanyModuleKey,
  CreateCompanyPayload,
} from "@/redux/slice/super-admin/company-mgt/company";

const MODULE_LABELS: Record<string, string> = {
  bills: "Bills",
  rent: "Rent",
  meter: "Meter",
  marketplace: "Marketplace",
  visitor: "Visitor",
  complaints: "Complaints",
  announcements: "Announcements",
  wallet: "Wallet",
  transactions: "Transactions",
  comments: "Comments",
  address: "Address",
  expense: "Expense",
  reporting: "Reporting",
  users: "Users",
};

export function CompanyFormModal({
  open,
  onClose,
  mode,
  form,
  setForm,
  modules,
  modulesLoading,
  onSubmit,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly mode: "create" | "update";
  readonly form: CreateCompanyPayload;
  readonly setForm: React.Dispatch<React.SetStateAction<CreateCompanyPayload>>;
  readonly modules: CompanyModuleKey[];
  readonly modulesLoading: boolean;
  readonly onSubmit: (e: React.FormEvent) => void | Promise<void>;
}) {
  const getModuleLabel = (key: string) => MODULE_LABELS[key] ?? key;

  return (
    <Modal visible={open} onClose={onClose}>
      <form onSubmit={onSubmit}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold pb-4">
            {mode === "update" ? "Update Company" : "Create Company"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Company Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Green Estate Corporations"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              placeholder="e.g. 12356 Palm Avenue"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                placeholder="e.g. Lagos"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={form.state}
                onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                placeholder="e.g. Lagos State"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={form.country}
              onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
              placeholder="e.g. Nigeria"
              required
            />
          </div>

          {/* <div className="flex items-center gap-2">
            <input
              id="isActive"
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
              aria-label="Company active status"
            />
            <Label htmlFor="isActive">Active</Label>
          </div> */}

          <div className="space-y-3">
            <Label>Modules</Label>
            <p className="text-sm text-muted-foreground">
              Select one or more modules enabled for this company.
            </p>
            {modulesLoading ? (
              <div className="rounded-md border border-border px-3 py-4 text-sm text-muted-foreground">
                Loading modules…
              </div>
            ) : modules.length === 0 ? (
              <div className="rounded-md border border-border px-3 py-4 text-sm text-muted-foreground">
                No modules available.
              </div>
            ) : (
              <ModuleSelectionChips
                availableModules={modules}
                selectedModules={form.modules}
                onChange={(next) =>
                  setForm((prev) => ({ ...prev, modules: next as CompanyModuleKey[] }))
                }
                getLabel={getModuleLabel}
              />
            )}
          </div>

          <div className="pt-2 flex gap-3">
            <Button
              type="submit"
              className="w-full cursor-pointer"
              disabled={modulesLoading}
            >
              {mode === "update" ? "Update" : "Create"}
            </Button>
          </div>
        </CardContent>
      </form>
    </Modal>
  );
}

