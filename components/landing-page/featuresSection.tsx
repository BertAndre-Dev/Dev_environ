"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type AudienceId = "owners" | "residents";

type FeatureItem = Readonly<{
  title: string;
  description: string;
}>;

const FEATURE_COPY =
  "Our mission is to design, deploy, and manage modern energy infrastructure that combines conventional energy.";

const AUDIENCES = {
  owners: {
    id: "owners" as const,
    label: "Property Owners & Operators",
    image: "/assets/ft/man.svg",
    imageAlt: "Property operator reviewing estate data on a computer",
    features: [
      { title: "Energy Intelligence", description: "Get real-time insights into energy consumption across every property, catch irregular usage early, and make informed, cost-saving decisions." },
      { title: "Property & Occupant Management", description: "Create and manage properties, units, and occupants from one central system, built for clarity as your portfolio scales." },
      { title: "Billing & Collections", description: "Automate recurring charges and utility billing, track collections in real time, and instantly reconcile payments with auto-generated reports." },
      { title: "Operations & Performance Insights", description: "Monitor service delivery and maintenance performance while gaining actionable insights into operations and revenue, all in one view." },
    ] satisfies readonly FeatureItem[],
  },
  residents: {
    id: "residents" as const,
    label: "Home owners & Residents",
    image: "/assets/ft/woman.svg",
    imageAlt: "Residents enjoying community living at home",
    features: [
      { title: "Energy Intelligence", description: "See exactly what you're using, in real time, track your own energy consumption and never be caught off guard by a bill again." },
      { title: "Bills & Payments", description: "View your charges, pay instantly, and keep a clear record of every payment, no more chasing receipts or wondering what you owe." },
      { title: "Maintenance Requests", description: "Report an issue in seconds and track it through to resolution, no more calls or messages that go unanswered." },
      { title: "Visitor Access", description: "Invite guests, approve deliveries, and manage who comes and goes right from your phone, without holding up the gate." },
    ] satisfies readonly FeatureItem[],
  },
} as const;

const spring = { type: "spring" as const, bounce: 0, duration: 0.35 };

function FeatureIcon() {
  return (
    <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[#0150AC]/20 bg-[#E8F1FB]/60">
      <Image
        src="/assets/energy.svg"
        alt=""
        width={22}
        height={22}
        className="size-[22px]"
        aria-hidden="true"
      />
    </div>
  );
}

function FeatureCard({ title, description }: FeatureItem) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      className="flex items-start gap-4 rounded-2xl bg-white px-4 py-3 shadow-[0_1px_3px_rgba(16,24,40,0.06),0_8px_24px_rgba(16,24,40,0.04)] sm:p-6 will-change-transform"
      whileHover={
        reduceMotion
          ? undefined
          : { y: -2, boxShadow: "0 8px 28px rgba(16,24,40,0.08)" }
      }
      whileTap={reduceMotion ? undefined : { scale: 0.985 }}
      transition={spring}
    >
      <FeatureIcon />
      <div className="min-w-0">
        <h3 className="text-base font-bold tracking-[-0.01em] text-black sm:text-lg">
          {title}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-[#4B5563] sm:text-[15px]">
          {description}
        </p>
      </div>
    </motion.article>
  );
}

export default function FeaturesSection() {
  const [activeTab, setActiveTab] = useState<AudienceId>("owners");
  const reduceMotion = useReducedMotion();
  const audience = AUDIENCES[activeTab];

  return (
    <section
      id="features"
      className="scroll-mt-28 bg-[#F8F8F8] py-14 sm:py-16 lg:py-20"
    >
      <div className="container mx-auto max-w-[1320px] px-6 md:px-8 lg:px-10 xl:max-w-[1440px] xl:px-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-[32px] font-semibold leading-tight tracking-[-0.02em] text-black sm:text-[36px] lg:text-[40px]">
            Built for Teams Across Industries
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-[#6B7280] sm:text-lg">
            Manage your property and energy operations, payments, and residents
            all in one powerful platform.
          </p>
        </div>

        <div
          className="mx-auto mt-8 flex w-full max-w-xl rounded-full bg-[#ECECEC] p-1 shadow-[inset_0_1px_2px_rgba(16,24,40,0.04)] sm:mt-10"
          role="group"
          aria-label="Audience"
        >
          {(Object.keys(AUDIENCES) as AudienceId[]).map((id) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveTab(id)}
                className={[
                  "min-w-0 flex-1 cursor-pointer rounded-full px-3 py-2.5 text-center text-xs font-medium transition-colors sm:px-5 sm:text-sm",
                  "active:scale-[0.98]",
                  isActive
                    ? "bg-white text-[#0150AC] shadow-[0_1px_3px_rgba(16,24,40,0.08)]"
                    : "bg-transparent text-[#6B7280] hover:text-[#374151]",
                ].join(" ")}
              >
                {AUDIENCES[id].label}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            className="mt-10 grid items-stretch gap-8 md:mt-12 md:gap-12 lg:mt-12 lg:grid-cols-2 lg:gap-12"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={
              reduceMotion
                ? { duration: 0.2 }
                : { type: "spring", bounce: 0, duration: 0.4 }
            }
          >
            <div className="relative mx-auto w-full max-w-[560px] overflow-hidden rounded-[28px] lg:mx-0 lg:max-w-none h-full">
              <div className="relative h-full w-full min-h-[320px] sm:min-h-[380px] md:min-h-[420px] lg:min-h-[480px]">
                <Image
                  src={audience.image}
                  alt={audience.imageAlt}
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 560px"
                  priority={false}
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:gap-5 mx-auto w-full max-w-[560px] lg:mx-0 lg:max-w-none lg:justify-center">
              {audience.features.map((feature, index) => (
                <FeatureCard
                  key={`${activeTab}-${feature.title}-${index}`}
                  {...feature}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
