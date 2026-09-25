"use client";

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Trash2 } from "lucide-react";
import { AppDispatch } from "@/redux/store";
import {
  createVisitor,
  updateVisitor,
  getVisitorById,
  type CreateVisitorData,
  type VisitingType,
} from "@/redux/slice/resident/visitor/visitor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  IsoDatePicker,
  IsoLinkedRangeEnd,
  IsoLinkedRangeStart,
  dateToIsoDateTimeString,
  localPickerValueToApiIso,
  parseIsoToDate,
  todayIsoString,
} from "@/components/ui/iso-date-picker";
import { toast } from "react-toastify";
import { formatAddressEntryLabel } from "@/lib/address";
import { getApiErrorMessage } from "@/lib/api-error";
import InvitePhoneNumberField from "@/components/invite/InvitePhoneNumberField";
import {
  DEFAULT_COUNTRY_CODE,
  getPhoneValidationError,
  splitPhoneFields,
  toE164PhoneNumber,
} from "@/lib/phone-e164";

/** Normalize API / datetime values for date-only pickers (short visit edit). */
function toDateOnlyValue(val?: string | null) {
  if (!val) return "";
  const d = parseIsoToDate(val);
  if (!d) {
    const trimmed = String(val).trim();
    return /^\d{4}-\d{2}-\d{2}/.test(trimmed) ? trimmed.slice(0, 10) : "";
  }
  return dateToIsoDateTimeString(d).slice(0, 10);
}

/** Normalize API values for long-visit datetime pickers (`YYYY-MM-DDTHH:mm`). */
function toDateTimeLocalValue(val?: string | null) {
  if (!val) return "";
  const d = parseIsoToDate(val);
  if (!d) return "";
  return dateToIsoDateTimeString(d);
}

type VisitorDraft = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  countryCode: string;
  purpose: string;
  visitingType: VisitingType;
  visitStartDate: string;
  visitEndDate: string;
};

function createEmptyDraft(): VisitorDraft {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    firstName: "",
    lastName: "",
    phone: "",
    countryCode: DEFAULT_COUNTRY_CODE,
    purpose: "",
    visitingType: "SHORT_VISIT",
    visitStartDate: "",
    visitEndDate: "",
  };
}

interface VisitorFormProps {
  visitorId?: string | null;
  residentId: string;
  estateId: string;
  addressId: string | { id: string; data: { block: string; unit: string } };
  /** When false, hides the address field (e.g. resident has only one address). */
  showAddressField?: boolean;
  onSubmitSuccess?: () => void;
  onClose?: () => void;
}

export default function VisitorForm({
  visitorId,
  residentId,
  estateId,
  addressId,
  showAddressField = true,
  onSubmitSuccess,
  onClose,
}: VisitorFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const isEdit = Boolean(visitorId);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  /** Stable min for edit: preserves an existing past start date without shrinking as user changes. */
  const [visitStartMinDate, setVisitStartMinDate] = useState(todayIsoString());
  const [addressLabel, setAddressLabel] = useState("");
  const [drafts, setDrafts] = useState<VisitorDraft[]>([createEmptyDraft()]);

  useEffect(() => {
    if (addressId && typeof addressId === "object" && addressId.data) {
      const friendly = formatAddressEntryLabel(addressId.data);
      setAddressLabel(
        friendly ||
          [addressId.data?.block, addressId.data?.unit]
            .filter(Boolean)
            .join(", "),
      );
    }
  }, [addressId]);

  useEffect(() => {
    if (!visitorId) {
      setVisitStartMinDate(todayIsoString());
    }
  }, [visitorId]);

  useEffect(() => {
    if (!visitorId) return;

    const loadVisitor = async () => {
      setLoading(true);
      try {
        const res = await dispatch(getVisitorById(visitorId)).unwrap();
        const visitor = res?.data?.visitor || res?.data;
        if (visitor) {
          const visitingType =
            (visitor.visitingType as VisitingType) || "SHORT_VISIT";
          const isLong = visitingType === "LONG_VISIT";
          const start = isLong
            ? toDateTimeLocalValue(visitor.visitStartDate)
            : toDateOnlyValue(visitor.visitStartDate);
          const end = isLong
            ? toDateTimeLocalValue(visitor.visitEndDate)
            : toDateOnlyValue(visitor.visitEndDate);
          const today = todayIsoString();
          const startDay = start.slice(0, 10);
          setVisitStartMinDate(startDay && startDay < today ? startDay : today);
          const phoneFields = splitPhoneFields(
            visitor.phone || "",
            DEFAULT_COUNTRY_CODE,
          );
          setDrafts([
            {
              id: createEmptyDraft().id,
              firstName: visitor.firstName || "",
              lastName: visitor.lastName || "",
              phone: phoneFields.nationalNumber,
              countryCode: phoneFields.countryCode || DEFAULT_COUNTRY_CODE,
              purpose: visitor.purpose || "",
              visitingType,
              visitStartDate: start,
              visitEndDate: end,
            },
          ]);
          if (visitor.address) setAddressLabel(visitor.address);
        }
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    loadVisitor();
  }, [visitorId, dispatch]);

  const updateDraft = <K extends keyof Omit<VisitorDraft, "id">>(
    id: string,
    field: K,
    value: VisitorDraft[K],
  ) => {
    setDrafts((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  const setVisitingType = (id: string, next: VisitingType) => {
    setDrafts((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              visitingType: next,
              visitStartDate:
                next === "SHORT_VISIT" && !isEdit ? "" : row.visitStartDate,
              visitEndDate: next === "SHORT_VISIT" ? "" : row.visitEndDate,
            }
          : row,
      ),
    );
  };

  const addDraft = () => setDrafts((prev) => [...prev, createEmptyDraft()]);

  const removeDraft = (id: string) => {
    setDrafts((prev) =>
      prev.length <= 1 ? prev : prev.filter((r) => r.id !== id),
    );
  };

  const resolveAddressId = () =>
    typeof addressId === "object" && addressId !== null
      ? addressId.id
      : addressId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const addressIdString = resolveAddressId();

    if (!addressIdString) {
      toast.error(
        "No address is linked to your account. Please contact your estate admin to assign you an address before inviting visitors.",
      );
      return;
    }

    if (!residentId) {
      toast.error("Unable to identify resident. Please refresh and try again.");
      return;
    }

    if (!estateId) {
      toast.error("Unable to identify estate. Please refresh and try again.");
      return;
    }

    const today = todayIsoString();
    const e164ByDraftId = new Map<string, string>();

    for (let i = 0; i < drafts.length; i++) {
      const row = drafts[i];
      const label = isEdit ? "visitor" : `visitor ${i + 1}`;

      if (!row.firstName || !row.lastName || !row.phone || !row.purpose) {
        toast.error(
          isEdit
            ? "Please fill in all required fields"
            : `Please fill in all required fields for ${label}.`,
        );
        return;
      }

      if (!row.countryCode.trim()) {
        toast.error(`Please select a country code for ${label}.`);
        return;
      }

      const e164Phone = toE164PhoneNumber(row.phone, row.countryCode);
      if (!e164Phone) {
        toast.error(
          `${label}: ${getPhoneValidationError(row.phone, row.countryCode)}`,
        );
        return;
      }
      e164ByDraftId.set(row.id, e164Phone);

      if (row.visitingType === "LONG_VISIT") {
        if (!row.visitStartDate || !row.visitEndDate) {
          toast.error(
            `Start and end date/time are required for ${label}'s long visit`,
          );
          return;
        }
        const startAt = parseIsoToDate(row.visitStartDate);
        const endAt = parseIsoToDate(row.visitEndDate);
        if (!startAt || !endAt) {
          toast.error(`Enter a valid start and end date/time for ${label}.`);
          return;
        }
        if (endAt.getTime() < startAt.getTime()) {
          toast.error(
            `End date/time must be on or after the start for ${label}`,
          );
          return;
        }
        if (startAt.getTime() < Date.now() - 60_000) {
          toast.error(
            `Visit start for ${label} must be the current date and time or later.`,
          );
          return;
        }
      } else if (isEdit && !row.visitStartDate) {
        toast.error("Visit start date is required for a short visit");
        return;
      }

      const startDay = row.visitStartDate.slice(0, 10);
      if (row.visitStartDate && startDay < visitStartMinDate) {
        toast.error(
          visitStartMinDate === today
            ? `Visit start date for ${label} must be today or later.`
            : `Visit start date for ${label} is before the allowed range.`,
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      if (isEdit && visitorId) {
        const row = drafts[0];
        const isLongVisit = row.visitingType === "LONG_VISIT";
        await dispatch(
          updateVisitor({
            id: visitorId,
            data: {
              firstName: row.firstName.trim(),
              lastName: row.lastName.trim(),
              phone: e164ByDraftId.get(row.id)!,
              purpose: row.purpose.trim(),
              residentId,
              estateId,
              addressId: addressIdString,
              visitingType: row.visitingType,
              visitStartDate: localPickerValueToApiIso(row.visitStartDate),
              ...(isLongVisit
                ? { visitEndDate: localPickerValueToApiIso(row.visitEndDate) }
                : {}),
            },
          }),
        ).unwrap();
        toast.success("Visitor updated successfully");
      } else {
        const payload: CreateVisitorData[] = drafts.map((row) => {
          const isLongVisit = row.visitingType === "LONG_VISIT";
          return {
            firstName: row.firstName.trim(),
            lastName: row.lastName.trim(),
            phone: e164ByDraftId.get(row.id)!,
            purpose: row.purpose.trim(),
            residentId,
            estateId,
            addressId: addressIdString,
            visitingType: row.visitingType,
            visitStartDate: localPickerValueToApiIso(row.visitStartDate),
            ...(isLongVisit
              ? { visitEndDate: localPickerValueToApiIso(row.visitEndDate) }
              : {}),
          };
        });
        await dispatch(createVisitor(payload)).unwrap();
        toast.success(
          payload.length === 1
            ? "Visitor created successfully"
            : `${payload.length} visitors created successfully`,
        );
      }

      onSubmitSuccess?.();
      onClose?.();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const createSubmitLabel =
    drafts.length === 1
      ? "Create Visitor"
      : `Create ${drafts.length} Visitors`;

  return (
    <form onSubmit={handleSubmit}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold capitalize text-blue-600">
          {isEdit ? "Update Visitor" : "Invite Visitors"}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto">
        {loading ? (
          <p className="text-gray-500 italic">Loading visitor details...</p>
        ) : (
          <div className="space-y-4">
            {showAddressField && (
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  type="text"
                  value={addressLabel}
                  placeholder="Address"
                  disabled
                  className="mt-1 bg-gray-50"
                />
                {!resolveAddressId() && (
                  <p className="text-xs text-amber-600 mt-1">
                    No address is linked to your account. Please contact your
                    estate admin to assign you an address before inviting
                    visitors.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">
                  {isEdit ? "Visitor" : "Visitors"}
                </p>
                {!isEdit && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addDraft}
                    disabled={submitting}
                  >
                    + Add another
                  </Button>
                )}
              </div>

              {drafts.map((row, idx) => (
                <div
                  key={row.id}
                  className="rounded-md border border-border/60 p-3 space-y-3"
                >
                  {!isEdit && (
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Visitor {idx + 1}
                      </p>
                      {drafts.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive h-8 w-8 p-0"
                          onClick={() => removeDraft(row.id)}
                          disabled={submitting}
                          title="Remove visitor"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}

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
                        placeholder="Enter first name"
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
                        placeholder="Enter last name"
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <InvitePhoneNumberField
                    id={`phone-${row.id}`}
                    label="Phone number"
                    showWhatsAppHint={false}
                    name="phone"
                    countryCode={row.countryCode}
                    phoneNumber={row.phone}
                    onCountryCodeChange={(countryCode) =>
                      updateDraft(row.id, "countryCode", countryCode)
                    }
                    onPhoneNumberChange={(e) =>
                      updateDraft(row.id, "phone", e.target.value)
                    }
                    disabled={submitting}
                  />

                  <div>
                    <Label htmlFor={`purpose-${row.id}`}>
                      Purpose of Visit *
                    </Label>
                    <textarea
                      id={`purpose-${row.id}`}
                      value={row.purpose}
                      onChange={(e) =>
                        updateDraft(row.id, "purpose", e.target.value)
                      }
                      placeholder="Enter purpose of visit"
                      required
                      rows={2}
                      className="mt-1 flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`visitingType-${row.id}`}>
                      Visiting Type *
                    </Label>
                    <select
                      id={`visitingType-${row.id}`}
                      title="Visiting Type"
                      aria-label={`Visiting type for visitor ${idx + 1}`}
                      value={row.visitingType}
                      onChange={(e) =>
                        setVisitingType(row.id, e.target.value as VisitingType)
                      }
                      className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="SHORT_VISIT">Short Visit</option>
                      <option value="LONG_VISIT">Long Visit</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {row.visitingType === "SHORT_VISIT"
                        ? isEdit
                          ? "Choose when the short visit should start."
                          : "Short visits start when the visitor arrives."
                        : "Long visits require a start and end date and time."}
                    </p>
                  </div>

                  {row.visitingType === "SHORT_VISIT" ? (
                    isEdit ? (
                      <div>
                        <Label htmlFor={`visitStartDate-${row.id}`}>
                          Visit Start Date *
                        </Label>
                        <div className="mt-1">
                          <IsoDatePicker
                            id={`visitStartDate-${row.id}`}
                            value={row.visitStartDate}
                            minDate={visitStartMinDate}
                            onChange={(iso) =>
                              updateDraft(row.id, "visitStartDate", iso)
                            }
                            placeholder="Select visit start date"
                            ariaLabel="Visit start date"
                          />
                        </div>
                      </div>
                    ) : null
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="min-w-0">
                        <Label htmlFor={`visitStartDate-${row.id}`}>
                          Visit start *
                        </Label>
                        <div className="mt-1">
                          <IsoLinkedRangeStart
                            id={`visitStartDate-${row.id}`}
                            startDate={row.visitStartDate}
                            endDate={row.visitEndDate}
                            minDate={visitStartMinDate}
                            includeTime
                            onStartChange={(iso) =>
                              updateDraft(row.id, "visitStartDate", iso)
                            }
                            onEndChange={(iso) =>
                              updateDraft(row.id, "visitEndDate", iso)
                            }
                            placeholder="Start — date then time"
                            ariaLabel={`Visit start for visitor ${idx + 1}`}
                          />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <Label htmlFor={`visitEndDate-${row.id}`}>
                          Visit end *
                        </Label>
                        <div className="mt-1">
                          <IsoLinkedRangeEnd
                            id={`visitEndDate-${row.id}`}
                            startDate={row.visitStartDate}
                            endDate={row.visitEndDate}
                            includeTime
                            onEndChange={(iso) =>
                              updateDraft(row.id, "visitEndDate", iso)
                            }
                            placeholder="End — date then time"
                            ariaLabel={`Visit end for visitor ${idx + 1}`}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2 flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={loading || submitting}
          >
            {submitting
              ? `${isEdit ? "Updating" : "Creating"}...`
              : isEdit
                ? "Update Visitor"
                : createSubmitLabel}
          </Button>
        </div>
      </CardContent>
    </form>
  );
}
