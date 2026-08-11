"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

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

/** Strong ease-out for UI — improve-animations AUDIT.md */
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

/**
 * Compositor-only interaction motion:
 * - Hover lift: 180ms ease-out, fine pointer only
 * - Press: scale(0.97) at 100ms (asymmetric / snappier than hover)
 * - Reduced motion: opacity press cue only
 */
const interactiveMotionClassName = [
  "transform-gpu",
  "transition-[transform,opacity] duration-[180ms]",
  "motion-reduce:duration-160",
  "active:scale-[0.97] active:duration-100",
  "motion-reduce:active:scale-100 motion-reduce:active:opacity-90",
  "[@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-1",
  "motion-reduce:[@media(hover:hover)_and_(pointer:fine)]:hover:translate-y-0",
].join(" ");

function FeatureIcon() {
  return (
    <Image
      src="/assets/energy.svg"
      alt=""
      width={40}
      height={40}
      className="size-10"
      aria-hidden="true"
    />
  );
}

function FeatureCard({
  title,
  description,
  revealDelayMs = 0,
  revealed,
}: FeatureItem & {
  readonly revealDelayMs?: number;
  readonly revealed: boolean;
}) {
  return (
    <article
      className={[
        "flex flex-col gap-4 rounded-3xl bg-[#F5F7FA] p-7 sm:p-8",
        "shadow-[0_1px_2px_rgba(16,24,40,0.04)]",
        interactiveMotionClassName,
        revealed
          ? "opacity-100"
          : "opacity-0 motion-reduce:opacity-100",
        revealed ? "" : "translate-y-3 motion-reduce:translate-y-0",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        transitionTimingFunction: EASE_OUT,
        transitionDelay: revealed ? `${revealDelayMs}ms` : "0ms",
      }}
    >
      <FeatureIcon />
      <h3 className="text-lg sm:text-xl font-bold text-black tracking-[-0.01em] leading-snug">
        {title}
      </h3>
      <p className="text-sm sm:text-[15px] text-[#4C4C4C] leading-relaxed">
        {description}
      </p>
    </article>
  );
}

function PhoneCard({
  revealDelayMs = 0,
  revealed,
}: {
  readonly revealDelayMs?: number;
  readonly revealed: boolean;
}) {
  return (
    <div
      className={[
        "relative w-full overflow-hidden aspect-420/380 rounded-3xl",
        interactiveMotionClassName,
        revealed
          ? "opacity-100"
          : "opacity-0 motion-reduce:opacity-100",
        revealed ? "" : "translate-y-3 motion-reduce:translate-y-0",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        transitionTimingFunction: EASE_OUT,
        transitionDelay: revealed ? `${revealDelayMs}ms` : "0ms",
      }}
    >
      <Image
        src="/assets/Card.svg"
        alt="Berta Hub mobile app showing wallet balance and dashboard"
        fill
        sizes="(max-width: 1024px) 100vw, 33vw"
        className="object-cover object-top"
        priority={false}
      />
    </div>
  );
}

function useInViewOnce<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, revealed };
}

export default function EverythingYouNeedSection() {
  const { ref, revealed } = useInViewOnce<HTMLDivElement>();

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

        <div
          ref={ref}
          className="mt-10 lg:mt-14 grid gap-5 sm:gap-6 lg:grid-cols-3 lg:items-start"
        >
          <div className="flex flex-col gap-5 sm:gap-6">
            {LEFT_FEATURES.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                {...feature}
                revealed={revealed}
                revealDelayMs={index * 50}
              />
            ))}
          </div>

          <div className="flex flex-col gap-5 sm:gap-6">
            <PhoneCard revealed={revealed} revealDelayMs={50} />
            <FeatureCard
              {...CENTER_FEATURE}
              revealed={revealed}
              revealDelayMs={100}
            />
          </div>

          <div className="flex flex-col gap-5 sm:gap-6">
            {RIGHT_FEATURES.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                {...feature}
                revealed={revealed}
                revealDelayMs={(index + 2) * 50}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
