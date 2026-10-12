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
