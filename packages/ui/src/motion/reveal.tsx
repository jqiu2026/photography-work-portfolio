"use client";

import { motion, useInView, useMotionTemplate, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState, type ElementType, type ReactNode, type RefObject } from "react";
import { motion as tokens } from "../tokens";
import { useCalm } from "./core";

/** Fades and lifts children into place once, when they scroll into view. */
export function InView({
  children,
  delay = 0,
  y = tokens.distance,
  className,
  as = "div",
}: { children: ReactNode; delay?: number; y?: number; className?: string; as?: "div" | "section" | "li" | "article" }) {
  const calm = useCalm();
  const Tag = motion[as];
  if (calm) return <Tag className={className}>{children}</Tag>;
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: tokens.duration.slow + 0.2, ease: tokens.ease, delay }}
    >
      {children}
    </Tag>
  );
}

/** Splits text into words that rise out of a mask, staggered. Screen readers get the plain string. */
export function RevealText({
  text,
  as: As = "h2",
  className,
  delay = 0,
  stagger = tokens.stagger,
}: { text: string; as?: ElementType; className?: string; delay?: number; stagger?: number }) {
  const calm = useCalm();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const words = text.split(" ");
  return (
    <As ref={ref} className={className} aria-label={text}>
      {words.map((w, i) => (
        <span
          key={`${w}-${i}`}
          aria-hidden
          style={{
            display: "inline-block",
            overflow: "hidden",
            verticalAlign: "bottom",
            paddingBottom: "0.12em",
            marginBottom: "-0.12em",
          }}
        >
          <motion.span
            style={{ display: "inline-block" }}
            initial={calm ? false : { y: "110%" }}
            animate={calm || inView ? { y: "0%" } : { y: "110%" }}
            transition={{ duration: tokens.duration.slow + 0.3, ease: tokens.ease, delay: delay + i * stagger }}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </As>
  );
}
