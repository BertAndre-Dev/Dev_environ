"use client";

import Image from "next/image";
import Link from "next/link";

const FEATURE_CARDS = [
  {
    src: "/assets/hero/buy%20power.svg",
    alt: "Buy Energy",
  },
  {
    src: "/assets/hero/pay%20bills.svg",
    alt: "Pay Bills",
  },
  {
    src: "/assets/hero/invite.svg",
    alt: "Invite Guests",
  },
  {
    src: "/assets/hero/analytics.svg",
    alt: "Analytics",
  },
] as const;

function FeatureCard({
  src,
  alt,
  delay,
  className,
}: Readonly<{
  src: string;
  alt: string;
  delay: string;
  className: string;
}>) {
  return (
    <div
      className={`pointer-events-none absolute z-30 hidden lg:block ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        width={108}
        height={88}
        className="hero-float h-auto w-[92px] xl:w-[108px]"
        style={{ animationDelay: delay }}
      />
    </div>
  );
}

export default function HeroSection() {
  return (
    <section className="relative bg-white">
      <div className="px-5 sm:px-8 lg:px-10">
        {/* Copy + floats share one box so cards sit beside the store buttons, not the house image */}
        <div className="relative mx-auto max-w-6xl overflow-visible">
          <FeatureCard
            src="/assets/hero/buy%20power.svg"
            alt="Buy Energy"
            delay="0s"
            className="left-2 top-[24%] xl:left-8"
          />
          <FeatureCard
            src="/assets/hero/invite.svg"
            alt="Invite Guests"
            delay="1.2s"
            className="right-2 top-[24%] xl:right-8"
          />
          <FeatureCard
            src="/assets/hero/pay%20bills.svg"
            alt="Pay Bills"
            delay="0.6s"
            className="left-1/2 top-[58%] -translate-x-[calc(50%+16.5rem)] xl:-translate-x-[calc(50%+18rem)]"
          />
          <FeatureCard
            src="/assets/hero/analytics.svg"
            alt="Analytics"
            delay="1.8s"
            className="left-1/2 top-[58%] translate-x-[calc(-50%+16.5rem)] xl:translate-x-[calc(-50%+18rem)]"
          />

          {/* Center copy */}
          <div className="relative z-20 mx-auto flex max-w-3xl flex-col items-center overflow-visible pt-4 text-center sm:pt-6">
            <span className="inline-flex items-center rounded-lg border border-[#0150AC]/35 px-4 py-1.5 text-xs font-medium text-[#0150AC] sm:text-sm">
              The Best Real Estate Operating System
            </span>

            <h1 className="mt-6 text-[36px] font-bold leading-[1.1] tracking-[-0.03em] text-black sm:text-[48px] lg:text-[56px]">
              Your Digital{" "}
              <span className="text-[#0150AC]">Companion</span>
              <br className="hidden sm:block" /> For{" "}
              <span className="text-[#0150AC]">Smart</span> Living.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#4C4C4C] sm:text-lg">
              Manage your property and energy operations, payments, and
              residents all in one powerful platform.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="https://apps.apple.com/ng/app/berta-hub/id6756385415"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex cursor-pointer transition-transform duration-150 ease-out active:scale-[0.97]"
              >
                <Image
                  src="/assets/hero/appstore.svg"
                  alt="Download on the App Store"
                  width={204}
                  height={60}
                  className="h-[52px] w-auto sm:h-14"
                  priority
                />
              </Link>
              <Link
                href="https://play.google.com/store/apps/details?id=com.bertahub.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex cursor-pointer transition-transform duration-150 ease-out active:scale-[0.97]"
              >
                <Image
                  src="/assets/hero/playstore.svg"
                  alt="Get it on Google Play"
                  width={204}
                  height={60}
                  className="h-[52px] w-auto sm:h-14"
                  priority
                />
              </Link>
            </div>

            <div className="mt-6 hidden items-center gap-3 sm:flex">
              <Image
                src="/assets/hero/users.svg"
                alt=""
                width={192}
                height={40}
                className="h-9 w-auto sm:h-10"
                aria-hidden="true"
              />
              <div className="flex flex-col items-start text-left leading-tight">
                <p className="text-lg font-bold text-black sm:text-xl">250+</p>
                <p className="text-sm font-medium text-[#374151]">
                  Worldwide users
                </p>
              </div>
            </div>

            <div className="mt-10 grid w-full max-w-md grid-cols-2 gap-3 lg:hidden">
              {FEATURE_CARDS.map((card) => (
                <Image
                  key={`mobile-${card.alt}`}
                  src={card.src}
                  alt={card.alt}
                  width={108}
                  height={88}
                  className="mx-auto h-auto w-full max-w-[140px]"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Hero visual */}
        <div className="relative z-20 mx-auto mt-10 max-w-5xl sm:mt-12 lg:mt-14">
          <div className="overflow-hidden">
            <Image
              src="/assets/hero/hero.svg"
              alt="Berta Hub — energy usage and meter balance for modern living"
              width={1200}
              height={640}
              className="h-auto w-full object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 1100px"
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .hero-float {
          animation: heroFloat 5s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-float {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
