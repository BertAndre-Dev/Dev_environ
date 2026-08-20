"use client";

import { useEffect, useState } from "react";
import Select from "react-select";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DesignationToggle } from "@/components/designations/DesignationToggle";
import type { Designation } from "@/lib/designations";

export type DesignationFormValues = {
  name: string;
  description: string;
  isActive: boolean;
  estateId?: string;
};

type EstateSelectOption = { label: string; value: string };

type Props = {
  open: boolean;
  saving?: boolean;
  initial?: Designation | null;
  scopeLabel: string;
  showEstateSelect?: boolean;
  estateOptions?: EstateSelectOption[];
  estatesLoading?: boolean;
  defaultEstateId?: string;
  onClose: () => void;
  onSubmit: (values: DesignationFormValues) => Promise<void> | void;
};

export function DesignationFormSheet({
  open,
  saving = false,
  initial,
  scopeLabel,
  showEstateSelect = false,
  estateOptions = [],
  estatesLoading = false,
  defaultEstateId = "",
  onClose,
  onSubmit,
}: Readonly<Props>) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [estateId, setEstateId] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setDescription(initial?.description ?? "");
    setIsActive(initial?.isActive ?? true);
    setEstateId(initial?.estateId ?? defaultEstateId ?? "");
  }, [open, initial, defaultEstateId]);

  const editing = Boolean(initial?.id);
  const needsEstate = showEstateSelect && !editing;
  const canSubmit =
    name.trim().length >= 2 &&
    !saving &&
    (!needsEstate || Boolean(estateId));

  let submitLabel = "Create title";
  if (saving) submitLabel = "Saving…";
  else if (editing) submitLabel = "Save changes";

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      isActive,
      estateId: needsEstate ? estateId : undefined,
    });
  };

  return (
    <Modal visible={open} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-black/45">
            {scopeLabel}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-gray-900">
            {editing ? "Edit designation" : "New designation"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Names are unique for this {scopeLabel.toLowerCase()}.
          </p>
        </div>

        {needsEstate ? (
          <div className="space-y-2">
            <Label htmlFor="designation-estate">Estate</Label>
            <Select
              inputId="designation-estate"
              options={estateOptions}
              placeholder={
                estatesLoading ? "Loading estates…" : "Select an estate"
              }
              value={
                estateOptions.find((option) => option.value === estateId) ?? null
              }
              onChange={(option) => setEstateId(option?.value ?? "")}
              isSearchable
              isLoading={estatesLoading}
              isDisabled={estatesLoading || saving}
              className="text-sm"
              menuPortalTarget={
                typeof document === "undefined" ? undefined : document.body
              }
              menuPosition="fixed"
              styles={{
                control: (base) => ({ ...base, cursor: "pointer" }),
                option: (base) => ({ ...base, cursor: "pointer" }),
                dropdownIndicator: (base) => ({ ...base, cursor: "pointer" }),
                menuPortal: (base) => ({ ...base, zIndex: 80 }),
              }}
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="designation-name">Title</Label>
          <Input
            id="designation-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Facility Manager"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="designation-description">Description</Label>
          <Textarea
            id="designation-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Oversees estate facilities and vendors."
          />
        </div>

        {editing ? (
          <div className="rounded-lg border border-black/5 bg-muted/30 px-3.5 py-3">
            <DesignationToggle
              checked={isActive}
              disabled={saving}
              label={isActive ? "Active" : "Inactive"}
              onCheckedChange={setIsActive}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Deactivate titles that are still assigned to staff instead of
              deleting them.
            </p>
          </div>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            className="text-white"
            style={{ backgroundColor: "#0150AC" }}
            disabled={!canSubmit}
            onClick={() => void handleSubmit()}
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
