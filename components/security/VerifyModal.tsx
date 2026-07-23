"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { CheckCircle } from "lucide-react";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { verifyVisitor } from "@/redux/slice/security/visitor/visitor";
import {
  buildVerifyPayload,
  mapScanResponseToVisitorDetails,
} from "@/lib/security-visitor";
import { formatVisitorCode } from "@/lib/utils";
import type { VisitorDetailsData } from "@/app/dashboard/security/types";
import type { AppDispatch } from "@/redux/store";
import { toast } from "react-toastify";

interface VerifyModalProps {
  open: boolean;
  onClose: () => void;
  initialCode?: string | null;
  onVerified?: (visitor: VisitorDetailsData | null) => void;
}

export default function VerifyModal({
  open,
  onClose,
  initialCode,
  onVerified,
}: VerifyModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [visitorCode, setVisitorCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setVisitorCode(initialCode ? formatVisitorCode(initialCode) : "");
  }, [open, initialCode]);

  const handleVerify = async () => {
    const code = formatVisitorCode(visitorCode).trim();
    if (!code) {
      toast.warning("Enter a visitor code");
      return;
    }
    try {
      setLoading(true);
      const res = await dispatch(
        verifyVisitor(buildVerifyPayload(code)),
      ).unwrap();
      const verified = mapScanResponseToVisitorDetails(res);
      onVerified?.(verified);
      toast.success(
        (res as { message?: string })?.message ??
          "Visitor code verified successfully",
      );
      onClose();
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ?? "Verification failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={open}
      onClose={onClose}
      contentClassName="md:w-[440px] max-w-[440px] p-6"
    >
      <div className="space-y-5">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">
            Verify visitor
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Enter the visitor code to verify and allow access.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="verify-modal-code">Visitor code</Label>
          <Input
            id="verify-modal-code"
            value={visitorCode}
            onChange={(e) => setVisitorCode(formatVisitorCode(e.target.value))}
            placeholder="e.g. LEA-5DWR"
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleVerify();
            }}
          />
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleVerify()}
            disabled={loading}
            className="gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            {loading ? "Verifying…" : "Verify code"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
