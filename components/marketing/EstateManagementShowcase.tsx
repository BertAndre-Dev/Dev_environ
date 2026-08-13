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
  /** Actual file under /public/assets/gif — names do not match TabId 1:1 */
  gifSrc: string;
}>;

const TABS: readonly Tab[] = [
  {
    id: "energy",
    label: "Energy",
    icon: Zap,
    gifSrc: "/assets/gif/energy.gif",
  },
  {
    id: "visitors",
    label: "Visitors",
    icon: Users,
    gifSrc: "/assets/gif/visitor.gif",
  },
  {
    id: "pay-bills",
    label: "Pay Bills",
    icon: FileText,
    gifSrc: "/assets/gif/bill.gif",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    gifSrc: "/assets/gif/analytics.gif",
  },
  {
    id: "community",
    label: "Community",
    icon: Globe,
    // Filename is literally `communnity .gif` (typo + trailing space)
    gifSrc: `/assets/gif/${encodeURIComponent("communnity .gif")}`,
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
  subheading = "One app. Lorem Ipsum sit dolor",
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
      const img = new window.Image();
      img.src = tab.gifSrc;
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
          <h2 className="max-w-xl text-4xl font-normal leading-tight tracking-tight text-black sm:text-5xl">
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
                    "inline-flex cursor-pointer items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors",
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
              <div className="flex w-full flex-col gap-2 rounded-full border border-[#0150AC] bg-white p-1.5 sm:flex-row sm:items-center sm:gap-0 sm:pl-4">
                <label htmlFor="estate-showcase-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="estate-showcase-email"
                  name="email"
                  type="email"
                  autoComplete="email"
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
                  className="min-w-0 flex-1 rounded-full border-none bg-transparent px-4 py-2.5 text-sm text-[#171717] outline-none placeholder:text-[#9CA3AF] sm:px-0 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#0150AC] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#01408a] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
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
            <AnimatePresence mode="wait" initial={false}>
              <motion.img
                key={activeTab}
                src={active.gifSrc}
                alt={`${active.label} app preview`}
                className="h-full w-full object-cover object-top"
                initial={
                  reduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.98 }
                }
                animate={{ opacity: 1, scale: 1 }}
                exit={
                  reduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.98 }
                }
                transition={
                  reduceMotion
                    ? { duration: 0.2 }
                    : { type: "spring", bounce: 0, duration: 0.35 }
                }
              />
            </AnimatePresence>
          </PhoneFrame>
        </div>
      </div>
    </section>
  );
}
