"use client";

import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import {
  createVisitor,
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

  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    phone: string;
    purpose: string;
    visitingType: VisitingType;
    visitStartDate: string;
    visitEndDate: string;
  }>({
    firstName: "",
    lastName: "",
    phone: "",
    purpose: "",
    visitingType: "SHORT_VISIT",
    visitStartDate: "",
    visitEndDate: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.phone ||
      !formData.purpose
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (!estateId) {
      toast.error("Unable to identify estate. Please refresh and try again.");
      return;
    }

    const isLongVisit = formData.visitingType === "LONG_VISIT";

    if (isLongVisit) {
      if (!formData.visitStartDate || !formData.visitEndDate) {
        toast.error("Start and end dates are required for a long visit.");
        return;
      }
      if (formData.visitEndDate < formData.visitStartDate) {
        toast.error("End date must be on or after the start date.");
        return;
      }
      if (formData.visitStartDate < visitStartMinDate) {
        toast.error("Visit start date must be today or later.");
        return;
      }
    }

    setSubmitting(true);
    try {
      await dispatch(
        createVisitor({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          purpose: formData.purpose,
          residentId: null,
          estateId,
          addressId: null,
          visitingType: formData.visitingType,
          visitStartDate: isLongVisit
            ? toIsoOrNull(formData.visitStartDate)
            : null,
          ...(isLongVisit
            ? { visitEndDate: toIsoOrNull(formData.visitEndDate, true) }
            : { visitEndDate: null }),
        }),
      ).unwrap();

      toast.success("Visitor added successfully.");
      onSubmitSuccess?.();
      onClose?.();
    } catch (err: any) {
      const rawMessage = err?.message ?? err?.response?.data?.message;
      const apiMessage = Array.isArray(rawMessage)
        ? rawMessage.join(", ")
        : rawMessage;
      toast.error(apiMessage || "Failed to add visitor.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-blue-600">
          Add Visitor
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            name="firstName"
            type="text"
            value={formData.firstName}
            onChange={handleInputChange}
            placeholder="Visitor first name"
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            name="lastName"
            type="text"
            value={formData.lastName}
            onChange={handleInputChange}
            placeholder="Visitor last name"
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="e.g. 0810000000"
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="visitingType">Visiting Type *</Label>
          <select
            id="visitingType"
            name="visitingType"
            title="Visiting Type"
            aria-label="Visiting Type"
            value={formData.visitingType}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                visitingType: e.target.value as VisitingType,
                visitStartDate:
                  e.target.value === "SHORT_VISIT" ? "" : prev.visitStartDate,
                visitEndDate:
                  e.target.value === "SHORT_VISIT" ? "" : prev.visitEndDate,
              }))
            }
            className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="SHORT_VISIT">Short Visit</option>
            <option value="LONG_VISIT">Long Visit</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {formData.visitingType === "SHORT_VISIT"
              ? "Short visits are valid for a maximum of 24 hours from creation."
              : "Long visits require a start and end date."}
          </p>
        </div>

        {formData.visitingType === "LONG_VISIT" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="visitStartDate">Visit Start Date *</Label>
              <div className="mt-1">
                <IsoLinkedRangeStart
                  id="visitStartDate"
                  startDate={formData.visitStartDate}
                  endDate={formData.visitEndDate}
                  minDate={visitStartMinDate}
                  onStartChange={(iso) =>
                    setFormData((prev) => ({
                      ...prev,
                      visitStartDate: iso,
                    }))
                  }
                  onEndChange={(iso) =>
                    setFormData((prev) => ({
                      ...prev,
                      visitEndDate: iso,
                    }))
                  }
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
                  startDate={formData.visitStartDate}
                  endDate={formData.visitEndDate}
                  onEndChange={(iso) =>
                    setFormData((prev) => ({
                      ...prev,
                      visitEndDate: iso,
                    }))
                  }
                  placeholder="Select end date"
                  ariaLabel="Visit end date"
                />
              </div>
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="purpose">Purpose of visit *</Label>
          <textarea
            id="purpose"
            name="purpose"
            value={formData.purpose}
            onChange={handleInputChange}
            placeholder="e.g. To make a delivery"
            required
            rows={3}
            className="mt-1 flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
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
            {submitting ? "Adding..." : "Add Visitor"}
          </Button>
        </div>
      </CardContent>
    </form>
  );
}
