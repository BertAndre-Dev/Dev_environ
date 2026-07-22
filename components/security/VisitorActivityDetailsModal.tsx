"use client";

import type { ReactNode } from "react";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import type { SecurityVisitorItem } from "@/redux/slice/security/visitor/visitor-slice";

type Props = Readonly<{
  open: boolean;
  item: SecurityVisitorItem | null;
  onClose: () => void;
}>;

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function personName(
  person?: { firstName?: string; lastName?: string } | null,
) {
  if (!person) return "—";
  const name = `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim();
  return name || "—";
}

function DetailRow({
  label,
  value,
}: Readonly<{ label: string; value: ReactNode }>) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-sm mt-0.5">{value}</p>
    </div>
  );
}

export function VisitorActivityDetailsModal({ open, item, onClose }: Props) {
  return (
    <Modal visible={open} onClose={onClose} contentClassName="max-w-lg">
      <div className="pr-8">
        <h2 className="font-heading text-lg font-bold text-foreground mb-1">
          Visit details
        </h2>
        {item ? (
          <p className="text-sm text-muted-foreground mb-4">
            {item.firstName} {item.lastName}
            {item.visitorCode ? ` · ${item.visitorCode}` : ""}
          </p>
        ) : null}

        {!item ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No details found.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailRow
                label="Visit start"
                value={formatDate(item.visitStartDate)}
              />
              <DetailRow
                label="Visit end"
                value={formatDate(item.visitEndDate)}
              />
              <DetailRow
                label="Valid from"
                value={formatDate(item.validFrom)}
              />
              <DetailRow
                label="Valid until"
                value={formatDate(item.validUntil)}
              />
              <DetailRow
                label="Check-in time"
                value={formatDate(item.checkinTime)}
              />
              <DetailRow
                label="Checkout time"
                value={formatDate(item.checkoutTime)}
              />
              <DetailRow
                label="Checked out by"
                value={personName(item.checkedOutBy)}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
