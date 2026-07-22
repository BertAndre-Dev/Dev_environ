"use client";

import { useState, useMemo, useEffect } from "react";
import { Copy, Check, Phone, CheckCircle } from "lucide-react";
import Modal from "@/components/modal/page";

export interface VisitorDetailsForResident {
  residentId?: { id: string; firstName: string; lastName: string } | null;
  addressId?: { id: string; data: Record<string, string> };
  phone?: string;
}

interface ResidentDetailsProps {
  name?: string;
  block?: string;
  apartment?: string;
  phone?: string;
  avatarUrl?: string;
  /** When provided, overrides name/block/apartment/phone from view-details API */
  visitorDetails?: VisitorDetailsForResident | null;
}

export default function ResidentDetails({
  name: nameProp = "-",
  block: blockProp = "-",
  apartment: apartmentProp = "-",
  phone: phoneProp = "-",
  avatarUrl,
  visitorDetails,
}: ResidentDetailsProps) {
  const [copied, setCopied] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("Phone number copied");

  const { name, block, apartment, phone } = useMemo(() => {
    if (visitorDetails) {
      const residentName = visitorDetails.residentId
        ? `${visitorDetails.residentId.firstName} ${visitorDetails.residentId.lastName}`.trim()
        : nameProp;
      const data = visitorDetails.addressId?.data ?? {};
      const block =
        data.block ?? data.Block ?? Object.values(data)[0] ?? blockProp;
      const apartment =
        data.unit ??
        data.Unit ??
        data.apartment ??
        data.Apartment ??
        Object.values(data)[1] ??
        apartmentProp;
      return {
        name: residentName,
        block,
        apartment,
        phone: visitorDetails.phone ?? phoneProp,
      };
    }
    return {
      name: nameProp,
      block: blockProp,
      apartment: apartmentProp,
      phone: phoneProp,
    };
  }, [visitorDetails, nameProp, blockProp, apartmentProp, phoneProp]);

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1D4ED8&color=fff&size=128`;

  useEffect(() => {
    if (!feedbackOpen) return;
    const timer = window.setTimeout(() => setFeedbackOpen(false), 3000);
    return () => window.clearTimeout(timer);
  }, [feedbackOpen]);

  const handleCopy = async () => {
    const value = phone?.trim();
    if (!value || value === "-") {
      setFeedbackMessage("No phone number to copy");
      setFeedbackOpen(true);
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setFeedbackMessage("Phone number copied");
      setFeedbackOpen(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setFeedbackMessage("Failed to copy phone number");
      setFeedbackOpen(true);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-md w-full max-w-2xl h-[370px] overflow-y-scroll overflow-x-hidden pb-4 overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-7 pb-5 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Resident Details
          </h2>
        </div>

        {/* Body */}
        <div className="px-8 py-7 flex flex-col gap-8">
          {/* Profile Row */}
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full border-2 border-blue-700 overflow-hidden flex-shrink-0 bg-blue-100">
              <img
                src={avatarUrl || fallbackAvatar}
                alt={name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = fallbackAvatar;
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xl font-bold text-gray-900 tracking-tight">
                {name}
              </p>
              <p className="text-sm text-gray-500">
                {block}, {apartment}
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex gap-4 items-center">
            {/* Phone display */}
            <div className="flex-1 flex items-center gap-3 px-5 py-4 border border-gray-200 rounded-xl bg-gray-50">
              <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <span className="text-base font-medium text-gray-700 tracking-wide">
                {phone}
              </span>
            </div>

            {/* Copy button */}
            <button
              type="button"
              onClick={handleCopy}
              aria-label={`Copy phone number for ${name}`}
              className={`flex items-center gap-2.5 px-8 py-4 rounded-xl text-white text-base font-semibold transition-all duration-200 shadow-md
                ${
                  copied
                    ? "bg-green-600 shadow-green-200"
                    : "bg-blue-700 hover:bg-blue-800 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md shadow-blue-200"
                }`}
            >
              {copied ? (
                <Check className="w-5 h-5 text-white" />
              ) : (
                <Copy className="w-5 h-5 text-white" />
              )}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>
      </div>

      <Modal
        visible={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        contentClassName="md:w-[350px] max-w-[350px] p-4"
      >
        <div className="w-full">
          <div className="flex items-start gap-3">
            <CheckCircle className="mt-0.5 h-5 w-5 text-green-600" />
            <div className="min-w-0">
              <h2 className="font-heading text-lg font-bold mb-1">Copied</h2>
              <p className="text-sm text-muted-foreground">{feedbackMessage}</p>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
