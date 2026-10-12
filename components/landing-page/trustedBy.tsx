"use client";

import Image from "next/image";
import { useBookDemo } from "@/components/landing-page/book-demo-provider";

type PartnerAsset = Readonly<{
  name: string;
  src: string;
}>;

type PartnerLogo = PartnerAsset &
  Readonly<{
    /** Angle in degrees; 0 = top, clockwise */
    angle: number;
  }>;

type OrbitRing = Readonly<{
  id: string;
  /** CSS length used for width/height (fluid across breakpoints) */
  size: string;
  logos: readonly PartnerLogo[];
  spin: "outer" | "middle" | "inner";
}>;

const PARTNER_ASSETS = {
  kabana: { name: "Kabana", src: "/assets/trustedby/kabana.svg" },
  ezra: { name: "Ezra Court", src: "/assets/trustedby/ezra.svg" },
  home: { name: "Homeview", src: "/assets/trustedby/home.svg" },
  nxthaus: { name: "Nxthaus", src: "/assets/trustedby/nxthaus.svg" },
  prim: { name: "Primquisite", src: "/assets/trustedby/prim.svg" },
  gloch: {
    name: "Gloch Stylistic",
    src: "/assets/trustedby/gloch-stylistic.png",
  },
} as const;

/**
 * Place logos evenly along the visible upper arc.
 * Default arc spans -70° → +70° so tiles stay above the hub.
 */
function withEvenAngles(
  logos: readonly PartnerAsset[],
  arcSpanDeg = 140,
  arcCenterDeg = 0,
): PartnerLogo[] {
  const n = logos.length;
  if (n === 0) return [];
  if (n === 1) return [{ ...logos[0], angle: arcCenterDeg }];
  const start = arcCenterDeg - arcSpanDeg / 2;
  const step = arcSpanDeg / (n - 1);
  return logos.map((logo, i) => ({
    ...logo,
    angle: start + step * i,
  }));
}

const ORBITS: readonly OrbitRing[] = [
  {
    id: "outer",
    // Fluid diameter: scales from ~phone to desktop without a hard scale() squash
    size: "clamp(20rem, 78vw, 53.75rem)",
    spin: "outer",
    logos: withEvenAngles([
      PARTNER_ASSETS.kabana,
      PARTNER_ASSETS.nxthaus,
      PARTNER_ASSETS.gloch,
      PARTNER_ASSETS.home,
      PARTNER_ASSETS.ezra,
    ]),
  },
  {
    id: "middle",
    size: "clamp(14.5rem, 58vw, 40rem)",
    spin: "middle",
    logos: withEvenAngles([
      PARTNER_ASSETS.prim,
      PARTNER_ASSETS.ezra,
      PARTNER_ASSETS.gloch,
      PARTNER_ASSETS.kabana,
      PARTNER_ASSETS.home,
    ]),
  },
  {
    id: "inner",
    size: "clamp(9.5rem, 38vw, 26.25rem)",
    spin: "inner",
    logos: withEvenAngles(
      [PARTNER_ASSETS.nxthaus, PARTNER_ASSETS.gloch, PARTNER_ASSETS.prim],
      110,
    ),
  },
];

function PartnerTile({
  name,
  src,
}: Readonly<{ name: string; src: string }>) {
  // Raster logos (e.g. Gloch) need the same dark rounded tile the SVG partners ship with.
  const needsTileBg =
    src.endsWith(".png") ||
    src.endsWith(".jpg") ||
    src.endsWith(".jpeg") ||
    src.endsWith(".webp");

  return (
    <div
      className={
        needsTileBg
          ? "size-11 overflow-hidden rounded-[10px] bg-[#292625] p-1 drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)] sm:size-14 sm:p-1.5 md:size-16 lg:size-[72px]"
          : "size-11 drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)] sm:size-14 md:size-16 lg:size-[72px]"
      }
    >
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

      {logos.map((logo, index) => (
        <div
          key={`${logo.name}-${index}`}
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
    <section className="relative mt-10 w-full overflow-hidden text-white">
      {/* Black stage — clips rings so they never spill into the white band */}
      <div className="relative overflow-hidden bg-[#101010]">
        <div className="relative z-20 mx-auto flex max-w-3xl flex-col items-center px-4 pt-8 text-center sm:px-6 sm:pt-10">
          <h2 className="text-[24px] font-semibold leading-tight tracking-[-0.02em] text-white sm:text-[36px] lg:text-[40px]">
            Powering Leading Estates Across Africa
          </h2>
          <button
            type="button"
            onClick={openBookDemo}
            className="mt-5 inline-flex cursor-pointer items-center justify-center rounded-full border border-white/80 px-5 py-2 text-sm font-medium text-white transition-colors duration-150 ease-out hover:bg-white hover:text-black active:scale-[0.97] sm:mt-6 sm:px-6 sm:py-2.5"
          >
            Partner with us
          </button>
        </div>

        {/*
          Orbit stage height tracks viewport width so rings + hub stay in frame
          from phone → desktop without a brittle transform scale stack.
        */}
        <div className="relative z-10 mx-auto h-[clamp(20rem,62vw,38rem)] w-full max-w-[1100px] overflow-hidden">
          <div className="trustedby-orbit-center absolute bottom-[clamp(2.5rem,6vw,4.375rem)] left-1/2 size-0">
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-[clamp(6rem,18vw,13rem)] w-[clamp(6rem,18vw,13rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FA8128]/35 blur-3xl"
              aria-hidden="true"
            />

            {ORBITS.map((orbit) => (
              <Orbit key={orbit.id} {...orbit} />
            ))}
          </div>

          {/* Hub logo — overlaps the black/white boundary */}
          <div className="absolute bottom-[clamp(-0.75rem,-1.5vw,-0.5rem)] left-1/2 z-40 -translate-x-1/2">
            <div className="relative flex items-center justify-center">
              <div
                aria-hidden="true"
                className="absolute -inset-2 rounded-2xl bg-[#FA8128] opacity-25 blur-3xl"
              />

              <div className="relative z-20 flex size-[clamp(4.5rem,14vw,7.5rem)] items-center justify-center rounded-lg bg-white shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
                <Image
                  src="/assets/trustedby/logo.svg"
                  alt="Berta Hub"
                  width={88}
                  height={88}
                  className="h-[70%] w-[70%] object-contain"
                  priority={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* White dotted band — below black, rings cannot enter here */}
      <div
        className="pointer-events-none relative h-28 w-full overflow-hidden bg-white sm:h-36 md:h-44"
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
