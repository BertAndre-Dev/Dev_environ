"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  BarChart3,
  FileText,
  Globe,
  Loader2,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import PhoneFrame from "@/components/ui/PhoneFrame";

type TabId =
  | "energy"
  | "visitors"
  | "pay-bills"
  | "analytics"
  | "community";

type Tab = Readonly<{
  id: TabId;
  label: string;
  icon: LucideIcon;
  videoSrc: string;
}>;

const TABS: readonly Tab[] = [
  {
    id: "energy",
    label: "Energy",
    icon: Zap,
    videoSrc: "/assets/gif/energy.mp4",
  },
  {
    id: "visitors",
    label: "Visitors",
    icon: Users,
    videoSrc: "/assets/gif/visitor.mp4",
  },
  {
    id: "pay-bills",
    label: "Pay Bills",
    icon: FileText,
    videoSrc: "/assets/gif/bill.mp4",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    videoSrc: "/assets/gif/analytics.mp4",
  },
  {
    id: "community",
    label: "Community",
    icon: Globe,
    videoSrc: "/assets/gif/community.mp4",
  },
];

type BookDemoEmailPayload = Readonly<{
  email: string;
  message: string;
  source: "estate-management-showcase";
}>;

type EstateManagementShowcaseProps = Readonly<{
  subheading?: string;
  description?: string;
}>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EstateManagementShowcase({
  subheading = "One App – Total Control",
  description = "Manage your property and energy operations, payments, and residents all in one powerful platform.",
}: EstateManagementShowcaseProps) {
  const reduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<TabId>("energy");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const active = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];

  useEffect(() => {
    TABS.forEach((tab) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "video";
      link.href = tab.videoSrc;
      document.head.appendChild(link);
    });
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setStatus("idle");

    const trimmed = email.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setErrorMessage("Enter a valid email address.");
      setStatus("error");
      return;
    }

    setIsSubmitting(true);

    const payload: BookDemoEmailPayload = {
      email: trimmed,
      message: `New demo request from ${trimmed}`,
      source: "estate-management-showcase",
    };

    try {
      // Same plain-fetch pattern as CallToActionSection / BookDemoModal
      const res = await fetch("/api/book-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const fromServer =
          body && typeof body === "object"
            ? (body as { details?: string; message?: string }).details ||
              (body as { details?: string; message?: string }).message
            : null;
        throw new Error(fromServer || "Failed to submit");
      }

      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-[#F8F8F8] py-16 sm:py-20 lg:py-24 mx-4 md:mx-6 lg:mx-8 rounded-lg">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2  lg:px-8">
        {/* Left */}
        <div className="min-w-0">
          <h2 className="text-[32px] font-semibold leading-tight tracking-[-0.02em] text-black sm:text-[36px] lg:text-[40px]">
            Everything estate management in one app.
          </h2>

          <div
            className="mt-8 flex flex-wrap gap-3"
            role="group"
            aria-label="Feature previews"
          >
            {TABS.map((tab) => {
              const isActive = tab.id === activeTab;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    "inline-flex cursor-pointer items-center gap-2 rounded-full px-3 md:px-5 py-2.5 text-xs md:text-sm font-medium transition-colors",
                    "active:scale-[0.97]",
                    isActive
                      ? "bg-[#0150AC] text-white"
                      : "border border-gray-200 bg-white text-gray-700 hover:border-gray-300",
                  ].join(" ")}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <h3 className="mt-16 text-xl font-semibold tracking-tight text-black sm:text-2xl">
            {subheading}
          </h3>
          <p className="mt-3 max-w-md text-base leading-relaxed text-gray-600">
            {description}
          </p>

          {status === "success" ? (
            <p
              className="mt-8 text-sm font-medium text-green-700"
              role="status"
            >
              Thanks — we&apos;ll be in touch.
            </p>
          ) : (
            <form className="mt-8 w-full max-w-xl" onSubmit={handleSubmit}>
              <div className="flex w-full flex-col gap-2 rounded-2xl border border-[#0150AC] bg-white p-2 sm:flex-row sm:items-center sm:gap-0 sm:rounded-full sm:p-1.5 sm:pl-4">
                <label htmlFor="estate-showcase-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="estate-showcase-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  enterKeyHint="send"
                  required
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === "error") {
                      setStatus("idle");
                      setErrorMessage(null);
                    }
                  }}
                  disabled={isSubmitting}
                  className="min-w-0 flex-1 rounded-xl border-none bg-transparent px-4 py-3 text-base text-[#171717] outline-none placeholder:text-[#9CA3AF] disabled:opacity-60 sm:rounded-full sm:px-0 sm:py-2.5 sm:text-sm"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className="inline-flex w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#0150AC] px-6 py-3 text-base font-medium text-white transition-colors hover:bg-[#01408a] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:py-2.5 sm:text-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                      Sending…
                    </>
                  ) : (
                    "Request a demo"
                  )}
                </button>
              </div>
              {errorMessage ? (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  {errorMessage}
                </p>
              ) : null}
            </form>
          )}
        </div>

        {/* Right — phone mockup */}
        <div className="flex justify-center lg:justify-end">
          <PhoneFrame>
            <AnimatePresence initial={false}>
              <motion.video
                key={activeTab}
                src={active.videoSrc}
                autoPlay
                loop
                muted
                playsInline
                aria-label={`${active.label} app preview`}
                className="absolute inset-0 h-full w-full object-cover object-top"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0 }}
                transition={
                  reduceMotion
                    ? { duration: 0.15 }
                    : { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
                }
              />
            </AnimatePresence>
          </PhoneFrame>
        </div>
      </div>
    </section>
  );
}
