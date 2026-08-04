"use client";

import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Trash2 } from "lucide-react";
import { AppDispatch } from "@/redux/store";
import {
  createVisitor,
  type CreateAdminVisitorData,
  type VisitingType,
} from "@/redux/slice/admin/visitor/visitor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  IsoLinkedRangeEnd,
  IsoLinkedRangeStart,
  todayIsoString,
} from "@/components/ui/iso-date-picker";
import { toast } from "react-toastify";

function toIsoOrNull(val: string, endOfDay = false) {
  if (!val) return null;
  const d = new Date(`${val}T${endOfDay ? "23:59:59" : "00:00:00"}`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

type VisitorDraft = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  purpose: string;
};

function createEmptyDraft(): VisitorDraft {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    firstName: "",
    lastName: "",
    phone: "",
    purpose: "",
  };
}

interface AdminVisitorFormProps {
  estateId: string;
  onSubmitSuccess?: () => void;
  onClose?: () => void;
}

export default function AdminVisitorForm({
  estateId,
  onSubmitSuccess,
  onClose,
}: AdminVisitorFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [submitting, setSubmitting] = useState(false);
  const visitStartMinDate = todayIsoString();

  const [visitingType, setVisitingType] = useState<VisitingType>("SHORT_VISIT");
  const [visitStartDate, setVisitStartDate] = useState("");
  const [visitEndDate, setVisitEndDate] = useState("");
  const [drafts, setDrafts] = useState<VisitorDraft[]>([createEmptyDraft()]);

  const updateDraft = (
    id: string,
    field: keyof Omit<VisitorDraft, "id">,
    value: string,
  ) => {
    setDrafts((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  const addDraft = () => setDrafts((prev) => [...prev, createEmptyDraft()]);

  const removeDraft = (id: string) => {
    setDrafts((prev) =>
      prev.length <= 1 ? prev : prev.filter((r) => r.id !== id),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!estateId) {
      toast.error("Unable to identify estate. Please refresh and try again.");
      return;
    }

    const isLongVisit = visitingType === "LONG_VISIT";

    if (isLongVisit) {
      if (!visitStartDate || !visitEndDate) {
        toast.error("Start and end dates are required for a long visit.");
        return;
      }
      if (visitEndDate < visitStartDate) {
        toast.error("End date must be on or after the start date.");
        return;
      }
      if (visitStartDate < visitStartMinDate) {
        toast.error("Visit start date must be today or later.");
        return;
      }
    }

    for (let i = 0; i < drafts.length; i++) {
      const row = drafts[i];
      if (!row.firstName || !row.lastName || !row.phone || !row.purpose) {
        toast.error(`Please fill in all required fields for visitor ${i + 1}.`);
        return;
      }
    }

    const startIso = isLongVisit ? toIsoOrNull(visitStartDate) : null;
    const endIso = isLongVisit ? toIsoOrNull(visitEndDate, true) : null;

    const payload: CreateAdminVisitorData[] = drafts.map((row) => ({
      firstName: row.firstName.trim(),
      lastName: row.lastName.trim(),
      phone: row.phone.trim(),
      purpose: row.purpose.trim(),
      residentId: null,
      estateId,
      addressId: null,
      visitingType,
      visitStartDate: startIso,
      visitEndDate: endIso,
    }));

    setSubmitting(true);
    try {
      await dispatch(createVisitor(payload)).unwrap();
      toast.success(
        payload.length === 1
          ? "Visitor invited successfully."
          : `${payload.length} visitors invited successfully.`,
      );
      onSubmitSuccess?.();
      onClose?.();
    } catch (err: any) {
      const rawMessage = err?.message ?? err?.response?.data?.message;
      const apiMessage = Array.isArray(rawMessage)
        ? rawMessage.join(", ")
        : rawMessage;
      toast.error(apiMessage || "Failed to invite visitor.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitLabel =
    drafts.length === 1
      ? "Invite Visitor"
      : `Invite ${drafts.length} Visitors`;

  return (
    <form onSubmit={handleSubmit}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-blue-600">
          Invite Visitors
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
        <div>
          <Label htmlFor="visitingType">Visiting Type *</Label>
          <select
            id="visitingType"
            name="visitingType"
            title="Visiting Type"
            aria-label="Visiting Type"
            value={visitingType}
            onChange={(e) => {
              const next = e.target.value as VisitingType;
              setVisitingType(next);
              if (next === "SHORT_VISIT") {
                setVisitStartDate("");
                setVisitEndDate("");
              }
            }}
            className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="SHORT_VISIT">Short Visit</option>
            <option value="LONG_VISIT">Long Visit</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {visitingType === "SHORT_VISIT"
              ? "Short visits are valid for a maximum of 24 hours from creation. Applies to all visitors below."
              : "Long visits require a start and end date. Applies to all visitors below."}
          </p>
        </div>

        {visitingType === "LONG_VISIT" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="visitStartDate">Visit Start Date *</Label>
              <div className="mt-1">
                <IsoLinkedRangeStart
                  id="visitStartDate"
                  startDate={visitStartDate}
                  endDate={visitEndDate}
                  minDate={visitStartMinDate}
                  onStartChange={setVisitStartDate}
                  onEndChange={setVisitEndDate}
                  placeholder="Select start date"
                  ariaLabel="Visit start date"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="visitEndDate">Visit End Date *</Label>
              <div className="mt-1">
                <IsoLinkedRangeEnd
                  id="visitEndDate"
                  startDate={visitStartDate}
                  endDate={visitEndDate}
                  onEndChange={setVisitEndDate}
                  placeholder="Select end date"
                  ariaLabel="Visit end date"
                />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Visitors</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addDraft}
              disabled={submitting}
            >
              + Add another
            </Button>
          </div>

          {drafts.map((row, idx) => (
            <div
              key={row.id}
              className="rounded-md border border-border/60 p-3 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Visitor {idx + 1}
                </p>
                {drafts.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive"
                    onClick={() => removeDraft(row.id)}
                    disabled={submitting}
                    title="Remove visitor"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor={`firstName-${row.id}`}>First Name *</Label>
                  <Input
                    id={`firstName-${row.id}`}
                    type="text"
                    value={row.firstName}
                    onChange={(e) =>
                      updateDraft(row.id, "firstName", e.target.value)
                    }
                    placeholder="Visitor first name"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor={`lastName-${row.id}`}>Last Name *</Label>
                  <Input
                    id={`lastName-${row.id}`}
                    type="text"
                    value={row.lastName}
                    onChange={(e) =>
                      updateDraft(row.id, "lastName", e.target.value)
                    }
                    placeholder="Visitor last name"
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor={`phone-${row.id}`}>Phone *</Label>
                <Input
                  id={`phone-${row.id}`}
                  type="tel"
                  value={row.phone}
                  onChange={(e) => updateDraft(row.id, "phone", e.target.value)}
                  placeholder="e.g. 0810000000"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor={`purpose-${row.id}`}>Purpose of visit *</Label>
                <textarea
                  id={`purpose-${row.id}`}
                  value={row.purpose}
                  onChange={(e) =>
                    updateDraft(row.id, "purpose", e.target.value)
                  }
                  placeholder="e.g. To make a delivery"
                  required
                  rows={2}
                  className="mt-1 flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={submitting}>
            {submitting ? "Inviting..." : submitLabel}
          </Button>
        </div>
      </CardContent>
    </form>
  );
}
