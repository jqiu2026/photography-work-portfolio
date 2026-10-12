"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import Lenis from "lenis";
import { useCalm } from "./core";

/** Card that tilts toward the pointer. Disabled for touch and reduced motion. */
export function TiltCard({ children, max = 6, className }: { children: ReactNode; max?: number; className?: string }) {
  const calm = useCalm();
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [max, -max]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(mx, [0, 1], [-max, max]), { stiffness: 200, damping: 20 });
  if (calm) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900, transformStyle: "preserve-3d" }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width);
        my.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => {
        mx.set(0.5);
        my.set(0.5);
      }}
    >
      {children}
    </motion.div>
  );
}

/** Wraps a button/link so it is gently pulled toward the pointer. */
export function MagneticButton({
  children,
  strength = 0.25,
  className,
}: { children: ReactNode; strength?: number; className?: string }) {
  const calm = useCalm();
  const x = useSpring(useMotionValue(0), { stiffness: 250, damping: 18 });
  const y = useSpring(useMotionValue(0), { stiffness: 250, damping: 18 });
  if (calm)
    return (
      <span className={className} style={{ display: "inline-block" }}>
        {children}
      </span>
    );
  return (
    <motion.span
      className={className}
      style={{ display: "inline-block", x, y }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}

/** Lenis smooth scrolling. Off for reduced motion. Render once near the root. */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const calm = useCalm();
  useEffect(() => {
    if (calm) return;
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [calm]);
  return <>{children}</>;
}

/** Fades the page content in on navigation. Use in a Next.js template.tsx so it remounts per route. */
export function PageTransition({ children }: { children: ReactNode }) {
  const calm = useCalm();
  return (
    <motion.div
      initial={calm ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Endlessly scrolling row of items (CSS only, paused on hover, static under reduced motion). */
export function Marquee({
  children,
  speed = 40,
  className,
}: { children: ReactNode; speed?: number; className?: string }) {
  return (
    <div className={`ph-marquee ${className ?? ""}`} style={{ ["--ph-marquee-speed" as string]: `${speed}s` }}>
      <div className="ph-marquee__track">
        <div>{children}</div>
        <div aria-hidden>{children}</div>
      </div>
    </div>
  );
}

/** A small dot that follows the pointer (fine pointers only). Decorative. */
export function CursorFollower() {
  const calm = useCalm();
  const x = useSpring(useMotionValue(-100), { stiffness: 500, damping: 40 });
  const y = useSpring(useMotionValue(-100), { stiffness: 500, damping: 40 });
  const ref = useRef(false);
  useEffect(() => {
    if (calm || !matchMedia("(pointer: fine)").matches) return;
    ref.current = true;
    const move = (e: PointerEvent) => {
      x.set(e.clientX - 6);
      y.set(e.clientY - 6);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [calm, x, y]);
  if (calm) return null;
  return (
    <motion.div
      aria-hidden
      style={{
        x,
        y,
        position: "fixed",
        top: 0,
        left: 0,
        width: 12,
        height: 12,
        borderRadius: "50%",
        background: "var(--ph-accent)",
        pointerEvents: "none",
        zIndex: 160,
        mixBlendMode: "difference",
      }}
    />
  );
}
