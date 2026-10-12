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
