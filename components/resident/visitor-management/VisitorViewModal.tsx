"use client";

import React from "react";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import {
  formatVisitorDateTime,
  formatVisitorPerson,
  visitorGateStatus,
  type ResidentVisitorData,
} from "./types";

export function VisitorViewModal({
  open,
  visitor,
  onClose,
}: Readonly<{
  open: boolean;
  visitor: ResidentVisitorData | null;
  onClose: () => void;
}>) {
  if (!open || !visitor) return null;

  const status = visitorGateStatus(visitor);
  const viewedBy = formatVisitorPerson(visitor.viewedBy);
  const checkedOutBy = formatVisitorPerson(visitor.checkedOutBy);

  return (
    <Modal visible={open} onClose={onClose}>
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-semibold text-gray-900">
            Visitor Information
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Complete details for this visitor entry
          </p>
        </div>

        <div className="space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
                Visitor Code
              </p>
              <p className="font-mono text-lg font-semibold text-gray-900">
                {visitor.visitorCode || "—"}
              </p>
            </div>
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-medium ${status.className}`}
            >
              {status.label}
            </span>
          </div>

          <div className="border-t border-gray-100" />

          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="mb-1 text-xs font-medium text-gray-500">
                  Full Name
                </p>
                <p className="text-base text-gray-900">
                  {`${visitor.firstName || ""} ${visitor.lastName || ""}`.trim() ||
                    "—"}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="mb-1 text-xs font-medium text-gray-500">
                  Phone Number
                </p>
                <p className="text-base text-gray-900">{visitor.phone || "—"}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              Visit Information
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="mb-1 text-xs font-medium text-gray-500">Purpose</p>
                <p className="text-base text-gray-900">
                  {visitor.purpose || "—"}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="mb-1 text-xs font-medium text-gray-500">
                  Visit type
                </p>
                <p className="text-base text-gray-900">
                  {visitor.visitingType === "LONG_VISIT"
                    ? "Long visit"
                    : visitor.visitingType === "SHORT_VISIT"
                      ? "Short visit"
                      : "—"}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="mb-1 text-xs font-medium text-gray-500">
                  Visit start
                </p>
                <p className="text-base text-gray-900">
                  {formatVisitorDateTime(visitor.visitStartDate)}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="mb-1 text-xs font-medium text-gray-500">Visit end</p>
                <p className="text-base text-gray-900">
                  {formatVisitorDateTime(visitor.visitEndDate)}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              Gate activity
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="mb-1 text-xs font-medium text-gray-500">Check-in</p>
                <p className="text-base text-gray-900">
                  {formatVisitorDateTime(visitor.checkinTime)}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="mb-1 text-xs font-medium text-gray-500">
                  Check-out
                </p>
                <p className="text-base text-gray-900">
                  {formatVisitorDateTime(visitor.checkoutTime)}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="mb-1 text-xs font-medium text-gray-500">
                  Viewed by
                </p>
                <p className="text-base text-gray-900">{viewedBy || "—"}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="mb-1 text-xs font-medium text-gray-500">
                  Checked out by
                </p>
                <p className="text-base text-gray-900">
                  {checkedOutBy || "—"}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              Timestamps
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="mb-1 text-xs font-medium text-gray-500">Created</p>
                <p className="text-sm text-gray-900">
                  {formatVisitorDateTime(visitor.createdAt)}
                </p>
              </div>
              {visitor.updatedAt ? (
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="mb-1 text-xs font-medium text-gray-500">
                    Last updated
                  </p>
                  <p className="text-sm text-gray-900">
                    {formatVisitorDateTime(visitor.updatedAt)}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full cursor-pointer"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
