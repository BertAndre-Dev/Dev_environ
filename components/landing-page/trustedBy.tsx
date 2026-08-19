"use client";

import Image from "next/image";
import { useBookDemo } from "@/components/landing-page/book-demo-provider";

type PartnerLogo = Readonly<{
  name: string;
  src: string;
  /** Angle in degrees; 0 = top, clockwise */
  angle: number;
}>;

type OrbitRing = Readonly<{
  id: string;
  size: number;
  logos: readonly PartnerLogo[];
  spin: "outer" | "middle" | "inner";
}>;

const PARTNER_ASSETS = {
  kabana: { name: "Kabana", src: "/assets/trustedby/kabana.svg" },
  ezra: { name: "Ezra Court", src: "/assets/trustedby/ezra.svg" },
  home: { name: "Homeview", src: "/assets/trustedby/home.svg" },
  nxthaus: { name: "Nxthaus", src: "/assets/trustedby/nxthaus.svg" },
  prim: { name: "Primquisite", src: "/assets/trustedby/prim.svg" },
} as const;

const ORBITS: readonly OrbitRing[] = [
  {
    id: "outer",
    size: 860,
    spin: "outer",
    logos: [
      { ...PARTNER_ASSETS.kabana, angle: -68 },
      { ...PARTNER_ASSETS.nxthaus, angle: -26 },
      { ...PARTNER_ASSETS.home, angle: 22 },
      { ...PARTNER_ASSETS.ezra, angle: 68 },
    ],
  },
  {
    id: "middle",
    size: 640,
    spin: "middle",
    logos: [
      { ...PARTNER_ASSETS.prim, angle: -72 },
      { ...PARTNER_ASSETS.ezra, angle: -28 },
      { ...PARTNER_ASSETS.kabana, angle: 28 },
      { ...PARTNER_ASSETS.home, angle: 70 },
    ],
  },
  {
    id: "inner",
    size: 420,
    spin: "inner",
    logos: [
      { ...PARTNER_ASSETS.nxthaus, angle: -55 },
      { ...PARTNER_ASSETS.prim, angle: 40 },
    ],
  },
];

function PartnerTile({
  name,
  src,
}: Readonly<{ name: string; src: string }>) {
  return (
    <div className="size-14 sm:size-16 md:size-[72px] drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
      <Image
        src={src}
        alt={name}
        width={72}
        height={72}
        className="h-full w-full object-contain"
      />
    </div>
  );
}

function Orbit({ size, logos, spin }: OrbitRing) {
  const spinClass =
    spin === "outer"
      ? "trustedby-spin-outer"
      : spin === "middle"
        ? "trustedby-spin-middle"
        : "trustedby-spin-inner";

  const counterClass =
    spin === "outer"
      ? "trustedby-counter-outer"
      : spin === "middle"
        ? "trustedby-counter-middle"
        : "trustedby-counter-inner";

  return (
    <div
      className={`trustedby-orbit absolute left-1/2 top-0 ${spinClass}`}
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0 rounded-full border border-[#FA8128]/70"
        aria-hidden="true"
      />

      {logos.map((logo) => (
        <div
          key={`${logo.name}-${logo.angle}`}
          className="absolute inset-0"
          style={{ transform: `rotate(${logo.angle}deg)` }}
        >
          <div
            className={`absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 ${counterClass}`}
          >
            <div style={{ transform: `rotate(${-logo.angle}deg)` }}>
              <PartnerTile name={logo.name} src={logo.src} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TrustedBy() {
  const { openBookDemo } = useBookDemo();

  return (
    <section className="relative w-full overflow-hidden text-white mt-10">
      {/* Black stage — clips rings so they never spill into the white band */}
      <div className="relative overflow-hidden bg-[#101010]">
        <div className="relative z-20 mx-auto flex max-w-3xl flex-col items-center px-6 pt-10 pb-6 text-center">
          <h2 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] text-white sm:text-[36px] lg:text-[40px]">
            Powering Leading Estates Across Africa
          </h2>
          <button
            type="button"
            onClick={openBookDemo}
            className="mt-6 inline-flex cursor-pointer items-center justify-center rounded-full border border-white/80 px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 ease-out hover:bg-white hover:text-black active:scale-[0.97]"
          >
            Partner with us
          </button>
        </div>

        <div className="relative z-10 mx-auto h-[340px] w-full max-w-[1100px] overflow-hidden sm:h-[420px] lg:h-[500px] mt-6">
          {/*
            Orbit center sits at the hub logo center.
            Hub logo is pinned so its bottom edge rests on the black→white boundary (per design).
          */}
          <div className="absolute inset-x-0 bottom-0 top-0 origin-bottom scale-[0.58] sm:scale-[0.75] lg:scale-100">
            <div className="trustedby-orbit-center absolute left-1/2 bottom-[50px] size-0 sm:bottom-[60px] lg:bottom-[70px]">
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FA8128]/35 blur-3xl sm:h-52 sm:w-52"
                aria-hidden="true"
              />

              {ORBITS.map((orbit) => (
                <Orbit key={orbit.id} {...orbit} />
              ))}
            </div>
          </div>

          {/* Hub logo — larger, lowered so it sits more on the black/white edge */}
          <div className="absolute bottom-2 left-1/2 z-30 -translate-x-1/2 translate-y-[28%]">
              <Image
                src="/assets/trustedby/logo.svg"
                alt="Berta Hub"
                width={100}
                height={100}
                className="h-full w-full object-contain"
                priority={false}
              />
          </div>
        </div>
      </div>

      {/* White dotted band — below black, rings cannot enter here */}
      <div
        className="pointer-events-none relative h-36 w-full overflow-hidden bg-white sm:h-44"
        aria-hidden="true"
      >
        <div className="trustedby-dots absolute inset-0" />
      </div>

      <style>{`
        /* Mild vertical squash — taller arcs than before */
        .trustedby-orbit {
          transform: translate3d(-50%, -50%, 0) scaleY(0.95);
        }

        /* Outer ring: rotate right, then back left */
        @keyframes trustedbySpinOuter {
          0%, 100% { transform: translate3d(-50%, -50%, 0) scaleY(0.95) rotate(-14deg); }
          50% { transform: translate3d(-50%, -50%, 0) scaleY(0.95) rotate(14deg); }
        }

        /* Middle ring: opposite rotation */
        @keyframes trustedbySpinMiddle {
          0%, 100% { transform: translate3d(-50%, -50%, 0) scaleY(0.95) rotate(14deg); }
          50% { transform: translate3d(-50%, -50%, 0) scaleY(0.95) rotate(-14deg); }
        }

        /* Inner ring: gentler sway, same direction as outer */
        @keyframes trustedbySpinInner {
          0%, 100% { transform: translate3d(-50%, -50%, 0) scaleY(0.95) rotate(-8deg); }
          50% { transform: translate3d(-50%, -50%, 0) scaleY(0.95) rotate(8deg); }
        }

        @keyframes trustedbyCounterOuter {
          0%, 100% { transform: rotate(14deg) scaleY(1.05); }
          50% { transform: rotate(-14deg) scaleY(1.05); }
        }

        @keyframes trustedbyCounterMiddle {
          0%, 100% { transform: rotate(-14deg) scaleY(1.05); }
          50% { transform: rotate(14deg) scaleY(1.05); }
        }

        @keyframes trustedbyCounterInner {
          0%, 100% { transform: rotate(8deg) scaleY(1.05); }
          50% { transform: rotate(-8deg) scaleY(1.05); }
        }

        .trustedby-spin-outer {
          animation: trustedbySpinOuter 12s ease-in-out infinite;
          will-change: transform;
        }

        .trustedby-spin-middle {
          animation: trustedbySpinMiddle 12s ease-in-out infinite;
          will-change: transform;
        }

        .trustedby-spin-inner {
          animation: trustedbySpinInner 12s ease-in-out infinite;
          will-change: transform;
        }

        .trustedby-counter-outer {
          animation: trustedbyCounterOuter 12s ease-in-out infinite;
          will-change: transform;
        }

        .trustedby-counter-middle {
          animation: trustedbyCounterMiddle 12s ease-in-out infinite;
          will-change: transform;
        }

        .trustedby-counter-inner {
          animation: trustedbyCounterInner 12s ease-in-out infinite;
          will-change: transform;
        }

        .trustedby-dots {
          background-image: radial-gradient(
            circle,
            rgba(250, 170, 110, 0.7) 2.4px,
            transparent 2.6px
          );
          background-size: 16px 16px;
          background-position: center top;
          -webkit-mask-image: radial-gradient(
            ellipse 110% 120% at 50% -40%,
            transparent 42%,
            #000 50%,
            #000 62%,
            transparent 78%
          );
          mask-image: radial-gradient(
            ellipse 110% 120% at 50% -40%,
            transparent 42%,
            #000 50%,
            #000 62%,
            transparent 78%
          );
        }

        @media (prefers-reduced-motion: reduce) {
          .trustedby-spin-outer,
          .trustedby-spin-middle,
          .trustedby-spin-inner,
          .trustedby-counter-outer,
          .trustedby-counter-middle,
          .trustedby-counter-inner {
            animation: none;
          }

          .trustedby-spin-outer,
          .trustedby-spin-middle,
          .trustedby-spin-inner {
            transform: translate3d(-50%, -50%, 0) scaleY(0.95);
          }

          .trustedby-counter-outer,
          .trustedby-counter-middle,
          .trustedby-counter-inner {
            transform: scaleY(1.05);
          }
        }
      `}</style>
    </section>
  );
}
