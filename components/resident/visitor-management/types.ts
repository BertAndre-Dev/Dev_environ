export type VisitingType = "SHORT_VISIT" | "LONG_VISIT";

export type GatePersonRef = {
  id: string;
  firstName?: string;
  lastName?: string;
  role?: string;
};

export interface ResidentVisitorData {
  id: string;
  visitorCode: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  purpose?: string;
  isVerified: boolean;
  checkinTime?: string | null;
  checkoutTime?: string | null;
  isCheckedOut: boolean;
  overdueNotificationSent?: boolean;
  createdAt: string;
  updatedAt?: string;
  addressId?: string | { id: string; data?: Record<string, unknown> } | null;
  estateId?:
    | string
    | { id?: string; name?: string }
    | null;
  residentId?:
    | string
    | { id?: string; firstName?: string; lastName?: string }
    | null;
  visitingType?: VisitingType;
  visitStartDate?: string | null;
  visitEndDate?: string | null;
  validFrom?: string | null;
  validUntil?: string | null;
  qrCodeDataUrl?: string;
  qrCodeGenerated?: boolean;
  inviteLink?: string;
  inviteToken?: string;
  verificationCode?: string;
  viewedBy?: GatePersonRef | null;
  /** API may return a person object or a bare user id string. */
  checkedOutBy?: GatePersonRef | string | null;
  verifiedBy?: GatePersonRef | null;
}

export interface ResidentOccupantData {
  id: string;
  occupantCode?: string;
  firstName?: string;
  lastName?: string;
  relationship?: string;
  addressId?: string | { id: string; data?: Record<string, unknown> } | null;
  estateId?: unknown;
  residentId?: unknown;
  createdAt?: string;
  updatedAt?: string;
}

export function formatVisitorPerson(
  person?: GatePersonRef | string | null,
): string | null {
  if (!person) return null;
  if (typeof person === "string") return null;
  const name = `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim();
  return name || null;
}

export function formatVisitorDateTime(value?: string | null): string {
  if (!value?.trim()) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function visitorGateStatus(visitor: ResidentVisitorData): {
  label: string;
  className: string;
} {
  if (visitor.isCheckedOut || visitor.checkoutTime) {
    return {
      label: "Checked out",
      className: "bg-slate-100 text-slate-700",
    };
  }
  if (visitor.checkinTime || visitor.isVerified) {
    return {
      label: visitor.isVerified ? "On site (verified)" : "Checked in",
      className: "bg-emerald-100 text-emerald-800",
    };
  }
  if (visitor.viewedBy) {
    return {
      label: "Viewed",
      className: "bg-sky-100 text-sky-800",
    };
  }
  return {
    label: "Invited",
    className: "bg-amber-100 text-amber-800",
  };
}
