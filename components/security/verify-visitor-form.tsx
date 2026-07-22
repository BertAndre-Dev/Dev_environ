"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { verifyVisitor } from "@/redux/slice/security/visitor/visitor";
import {
  buildVerifyPayload,
  mapScanResponseToVisitorDetails,
} from "@/lib/security-visitor";
import { formatVisitorCode, normalizeBarcodeInput } from "@/lib/utils";
import { CheckCircle, Eye } from "lucide-react";
import type { VisitorDetailsData } from "@/app/dashboard/security/types";
import type { VisitorVerificationFlags } from "@/lib/visitor-verification-mode";
import { getVerificationFlags } from "@/lib/visitor-verification-mode";

interface VerifyVisitorFormProps {
  visitorDetails?: VisitorDetailsData | null;
  initialCode?: string;
  onVerified?: (visitor: VisitorDetailsData | null) => void;
  verificationFlags?: VisitorVerificationFlags;
  /** How the visitor was looked up (typed vs scanned). */
  lookupSource?: "code" | "scan" | null;
  verificationDescription?: string | null;
}

function personLabel(
  person?: { firstName?: string; lastName?: string } | null,
) {
  if (!person) return null;
  const name = `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim();
  return name || null;
}

export default function VerifyVisitorForm({
  visitorDetails,
  initialCode: initialCodeProp,
  onVerified,
  verificationFlags,
  lookupSource = null,
  verificationDescription,
}: VerifyVisitorFormProps = {}) {
  const dispatch = useDispatch<AppDispatch>();
  const searchParams = useSearchParams();
  const flags = verificationFlags ?? getVerificationFlags(null);

  const codeFromUrl = searchParams.get("code") ?? "";
  const initialCode = initialCodeProp ?? codeFromUrl;
  const [code, setCode] = useState(() => normalizeBarcodeInput(initialCode));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visitorDetails?.visitorCode) {
      setCode(formatVisitorCode(visitorDetails.visitorCode));
    }
  }, [visitorDetails?.visitorCode]);

  const handleVerify = async () => {
    const visitorCode = code.trim();
    if (!visitorCode) {
      toast.warning("Enter a visitor code");
      return;
    }

    try {
      setLoading(true);
      const res = await dispatch(
        verifyVisitor(buildVerifyPayload(visitorCode, visitorDetails)),
      ).unwrap();
      const verified = mapScanResponseToVisitorDetails(res);
      onVerified?.(verified);
      toast.success(
        lookupSource === "scan"
          ? "QR code verified — access recorded."
          : ((res as { message?: string })?.message ??
              "Visitor code verified successfully"),
      );
    } catch (error: unknown) {
      toast.error(
        (error as { message?: string })?.message ?? "Verification failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const visitorName = visitorDetails
    ? `${visitorDetails.firstName} ${visitorDetails.lastName}`.trim() || "—"
    : "—";
  const location = visitorDetails?.addressId?.data
    ? Object.values(visitorDetails.addressId.data).filter(Boolean).join(", ")
    : "—";
  const reasonForVisit = visitorDetails?.purpose ?? "—";
  const numberOfPeople = 1;

  const viewedByName = personLabel(visitorDetails?.viewedBy);
  const verifiedByName = personLabel(visitorDetails?.verifiedBy);
  const alreadyVerified = Boolean(
    visitorDetails?.isVerified || visitorDetails?.verifiedBy,
  );
  const alreadyViewed = Boolean(visitorDetails?.viewedBy);

  const statusNotice = (() => {
    if (flags.viewOnly && alreadyViewed) {
      return {
        icon: Eye,
        title:
          lookupSource === "scan"
            ? "QR code scanned"
            : "Visitor code viewed",
        message:
          verificationDescription?.trim() ||
          (viewedByName
            ? `Recorded as viewed by ${viewedByName}. You may admit this visitor.`
            : "This visitor has been recorded as viewed. You may admit this visitor."),
      };
    }
    if (flags.canVerify && alreadyVerified) {
      return {
        icon: CheckCircle,
        title:
          lookupSource === "scan"
            ? "QR code verified"
            : "Visitor code verified",
        message:
          verificationDescription?.trim() ||
          (verifiedByName
            ? `Verified by ${verifiedByName}. Access has been recorded.`
            : "This visitor has been verified. Access has been recorded."),
      };
    }
    if (flags.viewOnly && visitorDetails) {
      return {
        icon: Eye,
        title: "View recorded",
        message:
          verificationDescription?.trim() ||
          "Viewing this visitor is enough to admit them. No further verification is required.",
      };
    }
    return null;
  })();

  const verifyButtonLabel = flags.verifyOnly
    ? "Verify code"
    : "Verify & Allow Access";

  return (
    <div className="w-full h-[370px] overflow-y-scroll pb-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mx-auto space-y-6">
      <div className="border-b border-[#D9D9D9] pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Visitor Details</h2>
      </div>

      {statusNotice ? (
        <div className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
          {(() => {
            const StatusIcon = statusNotice.icon;
            return (
              <StatusIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            );
          })()}
          <div className="space-y-0.5">
            <p className="text-sm font-semibold">{statusNotice.title}</p>
            <p className="text-sm text-emerald-800/90">{statusNotice.message}</p>
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-blue-100 border-[3px] border-blue-600 flex items-center justify-center shrink-0">
          <span className="text-blue-700 font-semibold text-lg">
            {visitorName
              .split(" ")
              .filter(Boolean)
              .map((n) => n[0])
              .join("")
              .slice(0, 2) || "—"}
          </span>
        </div>
        <div>
          <p className="text-xl font-bold text-gray-900">{visitorName}</p>
          <p className="text-gray-500 text-sm mt-0.5">{location}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm text-gray-600">
          Barcode / QR code / Visitor code
        </Label>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onBlur={(e) => setCode(normalizeBarcodeInput(e.target.value))}
          title="Barcode / QR code / Visitor code"
          placeholder="EZR-4FTX or scan QR code"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm text-gray-500">Reason for visit</Label>
          <div className="border border-gray-200 rounded-xl px-4 py-3 text-gray-700 bg-gray-50 text-sm">
            {reasonForVisit}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm text-gray-500">Number of people</Label>
          <div className="border border-gray-200 rounded-xl px-4 py-3 text-gray-700 bg-gray-50 text-sm">
            {numberOfPeople}
          </div>
        </div>
      </div>

      {flags.canVerify && !alreadyVerified ? (
        <div className="grid grid-cols-1 gap-4 pt-2">
          <Button
            onClick={handleVerify}
            disabled={loading}
            className="w-full bg-[#0150AC] hover:bg-[#0150Ad] text-white rounded-xl py-6 text-base font-medium flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            {loading ? "Verifying..." : verifyButtonLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
