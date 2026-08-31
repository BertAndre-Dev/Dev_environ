"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createEntry,
  updateEntry,
} from "@/redux/slice/staff/address-mgt/entry/entry";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/lib/api-error";
import { capitalizeFirstLetter } from "@/lib/address";

interface FieldDefinition {
  id: string;
  key: string;
  label: string;
}

interface EntryFormProps {
  estateId: string;
  fieldId: string; // single field type ID
  fields: FieldDefinition[];
  initialData?: any; // existing entry for edit mode
  onClose: () => void;
  refresh: () => void;
}

export default function EntryForm({
  estateId,
  fieldId,
  fields,
  initialData,
  onClose,
  refresh,
}: EntryFormProps) {
  const dispatch = useDispatch<AppDispatch>();

  // Initialize form state dynamically
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (initialData?.data) {
      const capitalized: Record<string, any> = {};
      Object.entries(initialData.data).forEach(([key, value]) => {
        capitalized[key] =
          typeof value === "string" ? capitalizeFirstLetter(value) : value;
      });
      setFormData(capitalized);
    } else {
      const initial: Record<string, any> = {};
      fields.forEach((f) => (initial[f.key] = ""));
      setFormData(initial);
    }
  }, [initialData, fields]);

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [key]: typeof value === "string" ? capitalizeFirstLetter(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      estateId,
      fieldId,
      data: formData,
    };

    try {
      if (initialData?.id) {
        // Update existing entry
        await dispatch(
          updateEntry({ entryId: initialData.id, data: payload }),
        ).unwrap();
        toast.success("Entry updated successfully!");
      } else {
        // Create new entry
        await dispatch(createEntry(payload)).unwrap();
        toast.success("Entry created successfully!");
      }
      onClose();
      refresh();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="pt-8 pb-4 font-medium text-[24px]">Entries Field</h3>
      {fields.map((field) => (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={field.key}>{capitalizeFirstLetter(field.label)}</Label>
          <Input
            id={field.key}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            type="text"
            value={formData[field.key] || ""}
            onChange={(e) => handleChange(field.key, e.target.value)}
          />
        </div>
      ))}

      <div className="w-full pb-6">
        {/* <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button> */}
        <Button
          type="submit"
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          {initialData ? "Update Entry" : "Create Entry"}
        </Button>
      </div>
    </form>
  );
}
