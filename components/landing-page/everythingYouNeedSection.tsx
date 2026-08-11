"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

type FeatureItem = Readonly<{
  title: string;
  description: string;
}>;

const FEATURE_COPY =
  "Our mission is to design, deploy, and manage modern energy infrastructure that combines conventional energy resources, renewable system.";

const LEFT_FEATURES: readonly FeatureItem[] = [
  { title: "Insight", description: FEATURE_COPY },
  { title: "Energy Intelligence", description: FEATURE_COPY },
];

const RIGHT_FEATURES: readonly FeatureItem[] = [
  { title: "Property Management", description: FEATURE_COPY },
  { title: "Energy Vending", description: FEATURE_COPY },
];

const CENTER_FEATURE: FeatureItem = {
  title: "Insight",
  description: FEATURE_COPY,
};

const spring = { type: "spring" as const, bounce: 0, duration: 0.4 };

function LeafIcon() {
  return (
    <span
      className="inline-flex size-10 items-center justify-center rounded-full bg-[#E8F1FB]"
      aria-hidden="true"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M9 15.5C9 15.5 4.5 12.2 4.5 8.1C4.5 5.6 6.4 3.5 9 3.5C11.6 3.5 13.5 5.6 13.5 8.1C13.5 12.2 9 15.5 9 15.5Z"
          stroke="#0150AC"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 15.5V8"
          stroke="#0150AC"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d="M9 9.5C10.2 8.8 11.2 7.6 11.6 6.3"
          stroke="#0150AC"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function FeatureCard({ title, description }: FeatureItem) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      className="flex flex-col gap-4 rounded-[24px] bg-[#F5F7FA] p-7 sm:p-8 shadow-[0_1px_2px_rgba(16,24,40,0.04)] will-change-transform"
      whileHover={
        reduceMotion
          ? undefined
          : { y: -4, boxShadow: "0 12px 32px rgba(16,24,40,0.08)" }
      }
      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
      transition={spring}
    >
      <LeafIcon />
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
      className="relative w-full overflow-hidden rounded-[24px] bg-[#0150AC] aspect-[420/380] will-change-transform"
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
          <h2 className="text-[32px] sm:text-[36px] font-bold leading-tight tracking-[-0.02em] text-black">
            Everything You Need. Nothing You Don&apos;t.
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
