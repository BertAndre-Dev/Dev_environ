"use client";

import { Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useBookDemo } from "@/components/landing-page/book-demo-provider";

type PlanTier = Readonly<{
  key: string;
  name: string;
  rate: string;
  featuresHeading: string;
  features: readonly string[];
  featured?: boolean;
}>;

type HowToChooseItem = Readonly<{
  name: string;
  detail: string;
}>;

const OPERATIONS_LABEL = "Core Estate Operations";

const PLANS: readonly PlanTier[] = [
  {
    key: "standard",
    name: "Standard",
    rate: "Vending 2% - Bills 3%",
    featuresHeading: "Features",
    features: [
      "Bills & Payments",
      "Vending & Metering",
      "Visitor Management",
      "Community Engagement",
      "Unit Management",
      "Estate Administration",
    ],
  },
  {
    key: "classic",
    name: "Classic",
    rate: "Vending 3.25% - Bills 2.85%",
    featured: true,
    featuresHeading: "Features (Everything in Standard)",
    features: [
      "Expense Tracking",
      "Revenue Insights",
      "Financial Reporting",
      "Bill Interest",
      "Operations Reporting & Dashboard",
    ],
  },
  {
    key: "premium",
    name: "Premium",
    rate: "Vending 4.25% - Bills 2.65%",
    featuresHeading: "Features (Everything in Classic)",
    features: [
      "Asset Management & Maintenance",
      "Workflow & Request Management",
      "Custom Pricing",
      "Staff Management & Designation",
      "Company Administration",
    ],
  },
];

const HOW_TO_CHOOSE: readonly HowToChooseItem[] = [
  { name: "Standard", detail: "Lean estates; lowest vending fee" },
  {
    name: "Classic",
    detail: "Need expense, revenue, financial reporting, bill interest",
  },
  {
    name: "Premium",
    detail: "Need assets and staff designations with module packs",
  },
];

const spring = { type: "spring" as const, bounce: 0, duration: 0.4 };

function ModuleCheck({ featured }: { featured: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={[
        "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
        featured ? "bg-white text-[#0150AC]" : "bg-[#0150AC] text-white",
      ].join(" ")}
    >
      <Check className="size-3" strokeWidth={3} />
    </span>
  );
}

function PlanCard({ plan }: { plan: PlanTier }) {
  const { openBookDemo } = useBookDemo();
  const reduceMotion = useReducedMotion();
  const featured = Boolean(plan.featured);

  return (
    <motion.article
      className={[
        "relative flex flex-col rounded-3xl p-6 sm:p-7 will-change-transform",
        featured
          ? "bg-[#0150AC] text-white shadow-[0_24px_60px_rgba(1,80,172,0.35)] lg:z-10 lg:-mt-16 lg:px-8 lg:pt-10 lg:pb-14"
          : "bg-white text-black shadow-[0_1px_3px_rgba(16,24,40,0.06),0_12px_32px_rgba(16,24,40,0.06)] ring-1 ring-[#EAECF0] lg:p-8",
      ].join(" ")}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={spring}
      whileHover={reduceMotion ? undefined : { y: -4 }}
    >
      {featured && (
        <span className="absolute right-6 top-6 inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-white ring-1 ring-white/25">
          Most Popular
        </span>
      )}

      <h3
        className={[
          "text-2xl font-bold uppercase tracking-[-0.01em] sm:text-[26px]",
          featured ? "text-white" : "text-black",
        ].join(" ")}
      >
        {plan.name}
      </h3>

      <p
        className={[
          "mt-3 text-sm",
          featured ? "text-white/70" : "text-[#6B7280]",
        ].join(" ")}
      >
        {OPERATIONS_LABEL}
      </p>
      <p
        className={[
          "mt-1 text-sm font-bold",
          featured ? "text-white" : "text-black",
        ].join(" ")}
      >
        {plan.rate}
      </p>

      <p
        className={[
          "mt-5 text-sm font-medium",
          featured ? "text-white/70" : "text-[#6B7280]",
        ].join(" ")}
      >
        {plan.featuresHeading}
      </p>
      <ul className="mt-3 flex flex-1 flex-col gap-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <ModuleCheck featured={featured} />
            <span
              className={[
                "text-[15px] leading-relaxed",
                featured ? "text-white" : "text-[#374151]",
              ].join(" ")}
            >
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={openBookDemo}
        className={[
          "mt-8 w-full cursor-pointer rounded-full px-6 py-3.5 text-sm font-semibold transition-colors active:scale-[0.99]",
          featured
            ? "bg-white text-[#0150AC] hover:bg-[#EAF1FB]"
            : "bg-[#0150AC] text-white hover:bg-[#124ea0]",
        ].join(" ")}
      >
        Choose Plan
      </button>
    </motion.article>
  );
}

export default function PlansSection() {
  return (
    <section id="plans" className="scroll-mt-28 bg-white py-14 sm:py-16 lg:py-20">
      <div className="container mx-auto max-w-[1320px] px-6 md:px-8 lg:px-10 xl:max-w-[1440px] xl:px-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-[32px] font-semibold leading-tight tracking-[-0.02em] text-black sm:text-[36px] lg:text-[40px]">
            Choose Your Subscription Plan
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-[#6B7280] sm:text-lg">
            Pick the plan that best fits your estate&apos;s size.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-md gap-6 sm:mt-14 sm:max-w-none lg:mt-24 lg:grid-cols-3 lg:items-start lg:gap-8">
          {PLANS.map((plan) => (
            <PlanCard key={plan.key} plan={plan} />
          ))}
        </div>

        {/* How to choose */}
      </div>

      <div className="mt-14 sm:mt-16">
        <div className="bg-[#F8F8F8] px-6 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <div className="container mx-auto max-w-[1320px] xl:max-w-[1440px]">
            <h3 className="text-2xl font-semibold tracking-[-0.01em] text-black sm:text-[28px]">
              How to choose
            </h3>
            <div className="mt-6 grid gap-4 sm:gap-5 md:grid-cols-3">
              {HOW_TO_CHOOSE.map((item) => (
                <div
                  key={item.name}
                  className="rounded-2xl border border-[#0150AC]/25 bg-white p-5 sm:p-6"
                >
                  <h4 className="text-base font-bold text-black">{item.name}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
