"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  LogOut,
  Phone,
  ScanLine,
  ShieldCheck,
  X,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import BarcodeScannerModal from "@/components/security/barcode-scanner-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  gateActionLabel,
  gateActionTone,
  gateModeGuidance,
  gateStatusCopy,
  formatGateDateTime,
  parseGateResponse,
} from "@/lib/security-gate";
import {
  getApiErrorMessage,
  getApiSuccessMessage,
} from "@/lib/api-error";
import { normalizeBarcodeInput } from "@/lib/utils";
import type { VisitorVerificationFlags } from "@/lib/visitor-verification-mode";
import { gateVisitor } from "@/redux/slice/security/visitor/visitor";
import {
  clearActiveVisitor,
  clearGateResult,
  setLookupSource,
} from "@/redux/slice/security/visitor/visitor-slice";
import type { AppDispatch, RootState } from "@/redux/store";
import { toast } from "react-toastify";

const springSettle = { type: "spring" as const, bounce: 0, duration: 0.4 };
const springSheet = { type: "spring" as const, bounce: 0.15, duration: 0.45 };

function personLabel(
  person?: { firstName?: string; lastName?: string } | null,
) {
  if (!person) return null;
  const name = `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim();
  return name || null;
}

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "—"
  );
}

function ActionGlyph({ action }: { action: string | null }) {
  if (action === "VIEWED") return <Eye className="h-6 w-6" />;
  if (action === "VERIFIED") return <ShieldCheck className="h-6 w-6" />;
  if (action === "CHECKED_OUT") return <LogOut className="h-6 w-6" />;
  return <CheckCircle2 className="h-6 w-6" />;
}

function toneClasses(tone: ReturnType<typeof gateActionTone>) {
  switch (tone) {
    case "success":
      return "bg-emerald-500/15 text-emerald-700 ring-emerald-500/25";
    case "info":
      return "bg-sky-500/15 text-sky-700 ring-sky-500/25";
    case "exit":
      return "bg-amber-500/15 text-amber-800 ring-amber-500/25";
    default:
      return "bg-foreground/8 text-foreground ring-foreground/10";
  }
}

interface GateConsoleProps {
  verificationFlags: VisitorVerificationFlags;
  verificationDescription?: string | null;
  onGateSuccess?: () => void;
}

export default function GateConsole({
  verificationFlags,
  verificationDescription,
  onGateSuccess,
}: GateConsoleProps) {
  const dispatch = useDispatch<AppDispatch>();
  const reduceMotion = useReducedMotion();
  const { gateVisitorStatus, lastGateResult, activeVisitor } = useSelector(
    (state: RootState) => ({
      gateVisitorStatus: state.securityVisitor?.gateVisitorStatus ?? "idle",
      lastGateResult: state.securityVisitor?.lastGateResult ?? null,
      activeVisitor: state.securityVisitor?.activeVisitor ?? null,
    }),
  );

  const [code, setCode] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const loading = gateVisitorStatus === "isLoading";
  const guidance = gateModeGuidance(verificationFlags, verificationDescription);

  const runGate = useCallback(
    async (raw: string, source: "code" | "scan") => {
      const trimmed = normalizeBarcodeInput(raw);
      if (!trimmed) {
        toast.warning("Enter a visitor code or scan a QR");
        return;
      }

      try {
        const res = await dispatch(gateVisitor({ code: trimmed })).unwrap();
        const result = parseGateResponse(res);
        setCode(trimmed);
        dispatch(setLookupSource(source));

        const toastMsg =
          result.message ||
          getApiSuccessMessage(res) ||
          (result.action ? gateActionLabel(result.action) : null);
        if (toastMsg) toast.success(toastMsg);

        onGateSuccess?.();
      } catch (error: unknown) {
        const message = getApiErrorMessage(error);
        if (message) toast.error(message);
      }
    },
    [dispatch, onGateSuccess],
  );

  const handleClear = () => {
    setCode("");
    dispatch(clearActiveVisitor());
    dispatch(clearGateResult());
  };

  const result = lastGateResult;
  const visitor = result?.visitor ?? activeVisitor;
  const showResult = Boolean(result || visitor);
  const action =
    result?.action ??
    (typeof visitor?.action === "string"
      ? (visitor.action.toUpperCase() as
          | "VIEWED"
          | "CHECKED_IN"
          | "VERIFIED"
          | "CHECKED_OUT")
      : null);
  const statusCopy = gateStatusCopy(result);
  const tone = gateActionTone(action);
  const checkinLabel = formatGateDateTime(visitor?.checkinTime);
  const checkoutLabel = formatGateDateTime(visitor?.checkoutTime);

  const visitorName = visitor
    ? `${visitor.firstName} ${visitor.lastName}`.trim() || "Visitor"
    : "Visitor";
  const residentName = personLabel(visitor?.residentId) ?? "—";
  const address =
    Object.values(visitor?.addressId?.data ?? {})
      .filter(Boolean)
      .join(", ") || "—";

  return (
    <>
      <section className="relative overflow-hidden rounded-[1.75rem] border border-white/40 bg-linear-to-br from-[#F7F8FA] via-[#EEF2F7] to-[#E4EAF2] shadow-[0_20px_50px_-28px_rgba(15,23,42,0.45)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.7),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.08),transparent_50%)]"
        />

        <div className="relative px-5 pb-6 pt-7 sm:px-8 sm:pb-8 sm:pt-9">
          <header className="mb-7 max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Security gate
            </p>
            <h2
              className="mt-1 font-heading text-[2rem] font-bold tracking-[-0.03em] text-slate-900 sm:text-[2.35rem]"
              style={{ lineHeight: 1.05 }}
            >
              Gate
            </h2>
            <p className="mt-2 max-w-md text-[15px] leading-relaxed text-slate-600">
              {guidance}
            </p>
          </header>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onBlur={(e) => setCode(normalizeBarcodeInput(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === "Enter") void runGate(code, "code");
              }}
              placeholder="EZR-4FTX or paste code"
              disabled={loading}
              className="h-12 flex-1 rounded-2xl border-slate-200/80 bg-white/70 text-base shadow-sm backdrop-blur-md placeholder:text-slate-400 focus-visible:ring-slate-400/40"
              aria-label="Visitor code"
            />
            <Button
              type="button"
              onClick={() => void runGate(code, "code")}
              disabled={loading}
              className="h-12 shrink-0 rounded-2xl bg-slate-900 px-5 text-[15px] font-semibold text-white shadow-md transition-transform duration-100 ease-out active:scale-[0.97] hover:bg-slate-800"
            >
              {loading ? "Working…" : "Submit code"}
              {!loading ? <ArrowRight className="ml-1.5 h-4 w-4" /> : null}
            </Button>
          </div>

          <Button
            type="button"
            onClick={() => setScannerOpen(true)}
            disabled={loading}
            className="mt-3 h-14 w-full rounded-2xl bg-[#0071E3] text-[16px] font-semibold text-white shadow-[0_12px_28px_-12px_rgba(0,113,227,0.7)] transition-transform duration-100 ease-out active:scale-[0.98] hover:bg-[#0077ED]"
          >
            <ScanLine className="mr-2 h-5 w-5" />
            {loading ? "Working…" : "Scan QR or barcode"}
          </Button>
        </div>
      </section>

      <AnimatePresence mode="wait">
        {showResult && visitor ? (
          <motion.section
            key={visitor.visitorCode + (action ?? "")}
            initial={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 28, scale: 0.98 }
            }
            animate={
              reduceMotion
                ? { opacity: 1 }
                : { opacity: 1, y: 0, scale: 1 }
            }
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 16, scale: 0.98 }
            }
            transition={reduceMotion ? { duration: 0.15 } : springSheet}
            className="relative mt-5 overflow-hidden rounded-[1.75rem] border border-white/50 bg-white/75 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.5)] backdrop-blur-2xl backdrop-saturate-150"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200/60 px-5 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ${toneClasses(tone)}`}
                >
                  <ActionGlyph action={action} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {action ? gateActionLabel(action) : "Visitor"}
                  </p>
                  <p className="truncate text-lg font-semibold tracking-[-0.02em] text-slate-900">
                    {visitorName}
                  </p>
                  <p className="font-mono text-sm text-slate-500">
                    {visitor.visitorCode}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClear}
                className="rounded-full p-2 text-slate-400 transition-transform duration-100 ease-out hover:bg-slate-100 hover:text-slate-700 active:scale-95"
                aria-label="Clear result"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-5 py-5 sm:px-6">
              {statusCopy ? (
                <motion.p
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={springSettle}
                  className="rounded-2xl bg-slate-900/4 px-4 py-3 text-sm leading-relaxed text-slate-700"
                >
                  {statusCopy}
                </motion.p>
              ) : null}

              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                  {initials(visitorName)}
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-slate-900">
                    {visitorName}
                  </p>
                  {visitor.phone ? (
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
                      <Phone className="h-3.5 w-3.5" />
                      {visitor.phone}
                    </p>
                  ) : null}
                </div>
              </div>

              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50/90 px-4 py-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Purpose
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-800">
                    {visitor.purpose?.trim() || "—"}
                  </dd>
                </div>
                <div className="rounded-2xl bg-slate-50/90 px-4 py-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Visit type
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-800">
                    {visitor.visitingType === "LONG_VISIT"
                      ? "Long visit"
                      : "Short visit"}
                  </dd>
                </div>
                {checkinLabel ? (
                  <div className="rounded-2xl bg-slate-50/90 px-4 py-3">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Checked in
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-slate-800">
                      {checkinLabel}
                    </dd>
                  </div>
                ) : null}
                {checkoutLabel ? (
                  <div className="rounded-2xl bg-slate-50/90 px-4 py-3">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Checked out
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-slate-800">
                      {checkoutLabel}
                    </dd>
                  </div>
                ) : null}
                <div className="rounded-2xl bg-slate-50/90 px-4 py-3 sm:col-span-2">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Visiting
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-800">
                    {residentName}
                  </dd>
                  <dd className="mt-0.5 text-sm text-slate-500">{address}</dd>
                </div>
              </dl>

              {(personLabel(visitor.viewedBy) ||
                personLabel(visitor.verifiedBy) ||
                personLabel(visitor.checkedOutBy)) && (
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  {personLabel(visitor.viewedBy) ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      Viewed by {personLabel(visitor.viewedBy)}
                    </span>
                  ) : null}
                  {personLabel(visitor.verifiedBy) ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      Verified by {personLabel(visitor.verifiedBy)}
                    </span>
                  ) : null}
                  {personLabel(visitor.checkedOutBy) ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      Checked out by {personLabel(visitor.checkedOutBy)}
                    </span>
                  ) : null}
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row">
                {result?.nextAction === "CHECK_OUT" && visitor.visitorCode ? (
                  <Button
                    type="button"
                    onClick={() =>
                      void runGate(visitor.visitorCode, "code")
                    }
                    disabled={loading}
                    className="h-12 flex-1 rounded-2xl bg-slate-900 text-[15px] font-semibold text-white transition-transform duration-100 ease-out active:scale-[0.97] hover:bg-slate-800"
                  >
                    <LogOut className="mr-1.5 h-4 w-4" />
                    {loading ? "Working…" : "Check out"}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClear}
                  className="h-12 flex-1 rounded-2xl border-slate-200 bg-white/80 text-[15px] font-semibold transition-transform duration-100 ease-out active:scale-[0.97]"
                >
                  {action === "CHECKED_OUT"
                    ? "Scan next visitor"
                    : "Done"}
                </Button>
              </div>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <BarcodeScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={(value) => {
          setScannerOpen(false);
          void runGate(value, "scan");
        }}
        scannerElementId="security-gate-scanner"
      />
    </>
  );
}
