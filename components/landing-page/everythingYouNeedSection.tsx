"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

type FeatureItem = Readonly<{
  title: string;
  description: string;
  icon: string;
}>;

const LEFT_FEATURES: readonly FeatureItem[] = [
  {
    title: "Insight",
    description:
      "Real-time visibility into everything happening across your properties, one dashboard, every metric that matters.",
    icon: "/assets/everything/insight.svg",
  },
  {
    title: "Energy Intelligence",
    description:
      "Live, unit-level energy consumption data that catches irregular usage early and turns billing disputes into billing certainty.",
    icon: "/assets/everything/energy.svg",
  },
];

const RIGHT_FEATURES: readonly FeatureItem[] = [
  {
    title: "Property Management",
    description:
      "Manage assets, tenants, and operations from a single source of truth, no more spreadsheets, no more guesswork.",
    icon: "/assets/everything/property.svg",
  },
  {
    title: "Energy Vending",
    description:
      "Sell prepaid power with configurable limits and controls, protecting your energy budget while keeping tenants powered up.",
    icon: "/assets/everything/vending.svg",
  },
];

const CENTER_FEATURE: FeatureItem = {
  title: "Financial Reporting",
  description:
    "Automated expense and revenue recognition that keeps your books audit-ready and your monthly-end close fast.",
  icon: "/assets/everything/financials.svg",
};

const spring = { type: "spring" as const, bounce: 0, duration: 0.4 };

function FeatureIcon({ src }: { src: string }) {
  return (
    <Image
      src={src}
      alt=""
      width={40}
      height={40}
      className="size-10"
      aria-hidden="true"
    />
  );
}

function FeatureCard({ title, description, icon }: FeatureItem) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      className="flex flex-col gap-4 rounded-[20px] bg-[#B1D5FF1A] border-[#FFFFFF14] p-7 sm:p-8 shadow-[0_1px_2px_rgba(16,24,40,0.04)] will-change-transform"
      whileHover={
        reduceMotion
          ? undefined
          : { y: -4, boxShadow: "0 12px 32px rgba(16,24,40,0.08)" }
      }
      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
      transition={spring}
    >
      <FeatureIcon src={icon} />
      <h3 className="text-lg sm:text-xl font-bold text-black tracking-[-0.01em] leading-snug">
        {title}
      </h3>
      <p className="text-sm sm:text-[15px] text-[#4C4C4C] leading-relaxed">
        {description}
      </p>
    </motion.article>
  );
}

function PhoneCard() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="relative w-full overflow-hidden aspect-[420/380] will-change-transform"
      whileHover={reduceMotion ? undefined : { y: -4, scale: 1.01 }}
      whileTap={reduceMotion ? undefined : { scale: 0.985 }}
      transition={spring}
    >
      <Image
        src="/assets/Card.svg"
        alt="Berta Hub mobile app showing wallet balance and dashboard"
        fill
        sizes="(max-width: 1024px) 100vw, 33vw"
        className="object-cover object-top"
        priority={false}
      />
    </motion.div>
  );
}

export default function EverythingYouNeedSection() {
  return (
    <section
      id="platform"
      className="scroll-mt-28 bg-white py-12 sm:py-16 lg:py-20 my-8 lg:my-12"
    >
      <div className="container mx-auto px-6 md:px-8 lg:px-10 xl:px-16 max-w-[1320px] xl:max-w-[1440px]">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-[32px] font-semibold leading-tight tracking-[-0.02em] text-black sm:text-[36px] lg:text-[40px]">
            Everything You Need. <br /> Nothing You Don&apos;t.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#4C4C4C] leading-relaxed">
            Manage your property and energy operations, payments, and residents
            all in one powerful platform.
          </p>
        </div>

        <div className="mt-10 lg:mt-14 grid gap-5 sm:gap-6 lg:grid-cols-3 lg:items-start">
          {/* Left column */}
          <div className="flex flex-col gap-5 sm:gap-6">
            {LEFT_FEATURES.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>

          {/* Center column — phone + feature */}
          <div className="flex flex-col gap-5 sm:gap-6">
            <PhoneCard />
            <FeatureCard {...CENTER_FEATURE} />
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5 sm:gap-6">
            {RIGHT_FEATURES.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
