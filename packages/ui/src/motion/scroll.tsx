"use client";

import {
  motion,
  motionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { motion as tokens } from "../tokens";
import { SceneProvider, useCalm, useSceneProgress } from "./core";

/** Moves children slower or faster than the page as it scrolls past. `speed` 0.2 = subtle. */
export function Parallax({
  children,
  speed = 0.15,
  className,
}: { children: ReactNode; speed?: number; className?: string }) {
  const calm = useCalm();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`${speed * -100}px`, `${speed * 100}px`]);
  return (
    <div ref={ref} className={className} style={{ overflow: "hidden" }}>
      <motion.div style={calm ? undefined : { y, willChange: "transform" }}>{children}</motion.div>
    </div>
  );
}

/**
 * A scene that stays pinned while the page scrolls through `length` viewport heights.
 * Children read progress with useSceneProgress(), or pass a render function.
 * Under reduced motion it is not pinned: content shows its final state at normal height.
 */
export function PinnedScene({
  children,
  length = 3,
  className,
  label,
}: {
  children: ReactNode | ((progress: MotionValue<number>) => ReactNode);
  length?: number;
  className?: string;
  label?: string;
}) {
  const calm = useCalm();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const done = useMemo(() => motionValue(1), []);
  const body = typeof children === "function" ? children(calm ? done : scrollYProgress) : children;
  if (calm)
    return (
      <section ref={ref} aria-label={label} className={className}>
        {body}
      </section>
    );
  return (
    <section
      ref={ref}
      aria-label={label}
      className={className}
      style={{ height: `${length * 100}vh`, position: "relative" }}
    >
      <SceneProvider value={scrollYProgress}>
        <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>{body}</div>
      </SceneProvider>
    </section>
  );
}

/** Steps through short text beats as the scene progresses. Place inside PinnedScene. */
export function StepSequence({ steps, className }: { steps: { title: string; body?: string }[]; className?: string }) {
  const calm = useCalm();
  const progress = useSceneProgress();
  const [active, setActive] = useState(0);
  useMotionValueEvent(progress, "change", (p) => setActive(Math.min(steps.length - 1, Math.floor(p * steps.length))));
  if (calm)
    return (
      <ol className={className} style={{ listStyle: "none", padding: 0, display: "grid", gap: "var(--hl-space-8)" }}>
        {steps.map((s) => (
          <li key={s.title}>
            <h3 className="hl-heading hl-heading--display" style={{ fontSize: "var(--hl-text-3xl)" }}>
              {s.title}
            </h3>
            {s.body ? <p className="hl-text hl-text--muted">{s.body}</p> : null}
          </li>
        ))}
      </ol>
    );
  return (
    <div className={className} aria-live="polite" style={{ position: "relative", minHeight: "12rem" }}>
      {steps.map((s, i) => (
        <motion.div
          key={s.title}
          aria-hidden={i !== active}
          animate={{ opacity: i === active ? 1 : 0, y: i === active ? 0 : i < active ? -24 : 24 }}
          transition={{ duration: tokens.duration.slow, ease: tokens.ease }}
          style={{ position: "absolute", inset: 0 }}
        >
          <h3 className="hl-heading hl-heading--display" style={{ fontSize: "var(--hl-text-4xl)" }}>
            {s.title}
          </h3>
          {s.body ? (
            <p className="hl-text hl-text--muted" style={{ marginTop: "var(--hl-space-4)" }}>
              {s.body}
            </p>
          ) : null}
        </motion.div>
      ))}
    </div>
  );
}

/** Cards that stack on top of each other as you scroll (each sticks slightly lower than the last). */
export function StackingCards({ items, className }: { items: ReactNode[]; className?: string }) {
  const calm = useCalm();
  return (
    <div className={className} style={{ display: "grid", gap: calm ? "var(--hl-space-6)" : 0 }}>
      {items.map((it, i) => (
        <div
          key={i}
          style={
            calm
              ? undefined
              : { position: "sticky", top: `calc(6rem + ${i * 1.5}rem)`, paddingBottom: "var(--hl-space-8)" }
          }
        >
          {it}
        </div>
      ))}
    </div>
  );
}

/** Pins and scrolls items sideways as the page scrolls down. Falls back to a native horizontal scroller. */
export function HorizontalShowcase({ children, className }: { children: ReactNode; className?: string }) {
  const calm = useCalm();
  const ref = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [dist, setDist] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -dist]);
  useEffect(() => {
    const measure = () => {
      if (trackRef.current) setDist(Math.max(0, trackRef.current.scrollWidth - window.innerWidth));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  if (calm)
    return (
      <div
        ref={ref as RefObject<HTMLDivElement>}
        role="region"
        aria-label="Scrollable list"
        className={className}
        style={{
          display: "flex",
          gap: "var(--hl-space-6)",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          padding: "var(--hl-gutter)",
        }}
        tabIndex={0}
      >
        {children}
      </div>
    );
  return (
    <section ref={ref} className={className} style={{ height: `calc(100vh + ${dist}px)`, position: "relative" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
        }}
      >
        <motion.div
          ref={trackRef}
          style={{
            x,
            display: "flex",
            gap: "var(--hl-space-6)",
            paddingInline: "var(--hl-gutter)",
            willChange: "transform",
          }}
        >
          {children}
        </motion.div>
      </div>
    </section>
  );
}

/** Thin reading/scroll progress bar fixed to the top of the page. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30 });
  return (
    <motion.div
      aria-hidden
      style={{
        scaleX,
        transformOrigin: "0 50%",
        position: "fixed",
        inset: "0 0 auto 0",
        height: 2,
        background: "var(--hl-accent)",
        zIndex: 150,
      }}
    />
  );
}
