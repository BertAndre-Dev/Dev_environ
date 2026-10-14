"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
} from "framer-motion";
import { X } from "lucide-react";

export interface AuditDetailField {
  label: string;
  value: string;
}

export interface AuditDetailBlock {
  title: string;
  value: string;
}

export interface AuditDetailModel {
  title: string;
  subtitle: string;
  badge?: { label: string; tone: "ok" | "bad" | "neutral" };
  fields: AuditDetailField[];
  blocks: AuditDetailBlock[];
}

const BADGE_TONE = {
  ok: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  bad: "bg-red-500/10 text-red-700 dark:text-red-300",
  neutral: "bg-muted text-muted-foreground",
} as const;

const FLICK_VELOCITY = 250;

function rubberband(overshoot: number, dimension: number, constant = 0.55) {
  return (
    (overshoot * dimension * constant) /
    (dimension + constant * Math.abs(overshoot))
  );
}

function project(initialVelocity: number, decelerationRate = 0.99) {
  return (initialVelocity / 1000) * decelerationRate / (1 - decelerationRate);
}

function releaseVelocity(samples: { x: number; t: number }[]) {
  const last = samples[samples.length - 1];
  if (!last) return 0;
  const recent = samples.filter((sample) => last.t - sample.t <= 100);
  const first = recent[0];
  if (!first || recent.length < 2) return 0;
  const dt = last.t - first.t;
  if (dt <= 0) return 0;
  return ((last.x - first.x) / dt) * 1000;
}

export function AuditDetailSheet({
  open,
  detail,
  loading,
  error,
  onClose,
}: {
  open: boolean;
  detail: AuditDetailModel | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const animationRef = useRef<AnimationPlaybackControls | null>(null);
  const tokenRef = useRef(0);
  const closingRef = useRef(false);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const x = useMotionValue(0);
  const fade = useMotionValue(1);
  const scrimOpacity = useTransform([x, fade], (latest) => {
    const latestX = Number(latest[0]);
    const latestFade = Number(latest[1]);
    const width = Math.max(panelRef.current?.offsetWidth ?? 448, 1);
    const dragged = 1 - Math.min(1, Math.max(0, latestX / width));
    return dragged * latestFade;
  });

  const [present, setPresent] = useState(false);
  const [session, setSession] = useState(0);

  if (open && !present) {
    setPresent(true);
    setSession((current) => current + 1);
  }

  const panelWidth = () =>
    panelRef.current?.getBoundingClientRect().width ||
    Math.min(448, window.innerWidth);

  const stopAnimation = () => {
    tokenRef.current += 1;
    animationRef.current?.stop();
    animationRef.current = null;
    closingRef.current = false;
  };

  const finishClose = (token: number) => {
    if (token !== tokenRef.current) return;
    closingRef.current = false;
    setPresent(false);
    x.set(0);
    fade.set(1);
    onClose();
  };

  const beginClose = (velocity: number) => {
    if (closingRef.current) return;
    closingRef.current = true;
    animationRef.current?.stop();
    const token = ++tokenRef.current;
    const controls = reduceMotion
      ? animate(fade, 0, { duration: 0.2, ease: "easeOut" })
      : animate(x, panelWidth(), {
          type: "spring",
          bounce: Math.abs(velocity) > 80 ? 0.15 : 0,
          duration: 0.35,
          velocity,
        });
    animationRef.current = controls;
    controls.finished
      .then(() => finishClose(token))
      .catch(() => {
        if (token === tokenRef.current) closingRef.current = false;
      });
  };

  const settle = (velocity: number) => {
    stopAnimation();
    const controls = animate(x, 0, {
      type: "spring",
      bounce: Math.abs(velocity) > 80 ? 0.2 : 0,
      duration: 0.35,
      velocity,
    });
    animationRef.current = controls;
  };

  useLayoutEffect(() => {
    if (!present) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const main = document.querySelector("main");
    const previousOverflow = main instanceof HTMLElement ? main.style.overflow : "";
    if (main instanceof HTMLElement) main.style.overflow = "hidden";

    if (reduceMotion) {
      x.set(0);
      fade.set(0);
      const controls = animate(fade, 1, { duration: 0.2, ease: "easeOut" });
      animationRef.current = controls;
    } else {
      fade.set(1);
      x.set(panelWidth());
      const controls = animate(x, 0, {
        type: "spring",
        bounce: 0,
        duration: 0.4,
      });
      animationRef.current = controls;
    }
    closeRef.current?.focus();

    return () => {
      animationRef.current?.stop();
      if (main instanceof HTMLElement) main.style.overflow = previousOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [session, present, reduceMotion, fade, x]);

  useEffect(() => {
    if (open || !present) return;
    beginClose(0);
    // beginClose is stable enough for the parent-driven close path.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, present]);

  useEffect(() => {
    if (!present) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        beginClose(0);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [present]);

  const dragRef = useRef<{
    pointerId: number;
    originX: number;
    originY: number;
    startX: number;
    samples: { x: number; t: number }[];
    armed: boolean;
    cancelled: boolean;
  } | null>(null);

  const onDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || event.button !== 0) return;
    stopAnimation();
    dragRef.current = {
      pointerId: event.pointerId,
      originX: event.clientX,
      originY: event.clientY,
      startX: x.get(),
      samples: [{ x: event.clientX, t: event.timeStamp }],
      armed: false,
      cancelled: false,
    };
  };

  const onDragMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || drag.cancelled) return;
    const dx = event.clientX - drag.originX;
    const dy = event.clientY - drag.originY;
    if (!drag.armed) {
      if (Math.hypot(dx, dy) < 10) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        drag.cancelled = true;
        return;
      }
      drag.armed = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    drag.samples.push({ x: event.clientX, t: event.timeStamp });
    if (drag.samples.length > 8) drag.samples.shift();
    let next = drag.startX + dx;
    if (next < 0) next = -rubberband(-next, panelWidth());
    x.set(next);
  };

  const onDragEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (!drag.armed || drag.cancelled) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const velocity = releaseVelocity(drag.samples);
    const current = x.get();
    const width = panelWidth();
    const projected = current + project(velocity);
    const shouldClose =
      Math.abs(velocity) > FLICK_VELOCITY
        ? velocity > 0 && projected > width * 0.35
        : projected > width * 0.5;
    if (shouldClose) beginClose(velocity);
    else settle(velocity);
  };

  const trapTab = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Tab") return;
    const root = panelRef.current;
    if (!root) return;
    const focusable = Array.from(
      root.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((node) => !node.hasAttribute("disabled"));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  if (!present || typeof document === "undefined") return null;

  return createPortal(
    <>
      <motion.div
        className="fixed inset-0 z-50 bg-black/40"
        style={{ opacity: scrimOpacity }}
        onClick={() => beginClose(0)}
      />
      <motion.aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="audit-detail-title"
        onKeyDown={trapTab}
        style={{ x, opacity: fade }}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[28rem] flex-col border-l border-white/50 bg-background/85 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl backdrop-saturate-150 will-change-transform [@media(prefers-contrast:more)]:border-foreground [@media(prefers-contrast:more)]:bg-background [@media(prefers-reduced-transparency:reduce)]:bg-background [@media(prefers-reduced-transparency:reduce)]:backdrop-filter-none"
      >
        <header className="border-b border-border/70">
          {reduceMotion ? null : (
            <div className="flex justify-center pt-2" aria-hidden>
              <div className="h-1 w-9 rounded-full bg-foreground/15" />
            </div>
          )}
          <div className="flex items-start justify-between gap-3 px-5 py-4">
            <div
              className={`min-w-0 flex-1 ${
                reduceMotion
                  ? ""
                  : "cursor-grab touch-none active:cursor-grabbing"
              }`}
              onPointerDown={onDragStart}
              onPointerMove={onDragMove}
              onPointerUp={onDragEnd}
              onPointerCancel={onDragEnd}
            >
              <p className="text-[13px] font-medium tracking-tight text-muted-foreground">
                Audit entry
              </p>
              <h2
                id="audit-detail-title"
                className="mt-1 text-xl font-semibold leading-tight tracking-[-0.02em]"
              >
                {detail?.title || "Details"}
              </h2>
              {detail?.subtitle ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {detail.subtitle}
                </p>
              ) : null}
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={() => beginClose(0)}
              className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-transform duration-100 ease-out hover:bg-muted hover:text-foreground active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:active:scale-100"
              aria-label="Close details"
            >
              <X className="size-4" />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          {detail?.badge ? (
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${BADGE_TONE[detail.badge.tone]}`}
            >
              {detail.badge.label}
            </span>
          ) : null}

          {loading ? (
            <p className="mt-4 text-sm text-muted-foreground" role="status">
              Loading the full entry…
            </p>
          ) : null}
          {error ? (
            <p className="mt-4 text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          {detail && detail.fields.length > 0 ? (
            <dl className="mt-5 divide-y divide-border/70">
              {detail.fields.map((field) => (
                <div
                  key={field.label}
                  className="grid gap-1 py-3 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-3"
                >
                  <dt className="text-[13px] font-medium text-muted-foreground">
                    {field.label}
                  </dt>
                  <dd className="text-sm leading-5 break-words">{field.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {detail?.blocks.map((block) => (
            <section key={block.title} className="mt-6">
              <h3 className="text-[13px] font-medium tracking-tight text-muted-foreground">
                {block.title}
              </h3>
              <pre className="mt-2 max-h-72 overflow-auto rounded-xl bg-muted/70 p-3 text-xs leading-relaxed break-words whitespace-pre-wrap">
                {block.value}
              </pre>
            </section>
          ))}
        </div>
      </motion.aside>
    </>,
    document.body,
  );
}
