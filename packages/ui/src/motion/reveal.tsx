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

/** Counts up to a number when it enters the viewport. Shows the final value under reduced motion. */
export function CountUp({
  to,
  duration = 1.6,
  format = (n: number) => Math.round(n).toLocaleString(),
  className,
}: { to: number; duration?: number; format?: (n: number) => string; className?: string }) {
  const calm = useCalm();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [text, setText] = useState(() => format(calm ? to : 0));
  useEffect(() => {
    if (calm) {
      setText(format(to));
      return;
    }
    if (!inView) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / (duration * 1000));
      setText(format(to * (1 - (1 - p) ** 4)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [calm, inView, to, duration, format]);
  return (
    <span ref={ref} className={className} aria-label={format(to)}>
      {text}
    </span>
  );
}

/**
 * Words of a paragraph light up as it scrolls through the viewport. The dim state is the muted text colour
 * (AA contrast), and words blend to the full text colour, so the text is always readable.
 */
export function ScrollHighlight({ text, className }: { text: string; className?: string }) {
  const calm = useCalm();
  const ref = useRef<HTMLParagraphElement>(null);
  const words = text.split(" ");
  return (
    <p ref={ref} className={className} style={calm ? undefined : { color: "var(--hl-muted)" }}>
      {words.map((w, i) => (
        <HighlightWord key={`${w}-${i}`} word={w} i={i} n={words.length} target={ref} calm={calm} />
      ))}
    </p>
  );
}

function HighlightWord({
  word,
  i,
  n,
  target,
  calm,
}: { word: string; i: number; n: number; target: RefObject<HTMLElement | null>; calm: boolean }) {
  const { scrollYProgress } = useScroll({ target, offset: ["start 0.85", "end 0.35"] });
  const start = i / n;
  const pct = useTransform(scrollYProgress, [start, Math.min(1, start + 1.5 / n)], [0, 100]);
  const color = useMotionTemplate`color-mix(in srgb, var(--hl-text) ${pct}%, var(--hl-muted))`;
  return <motion.span style={calm ? undefined : { color }}>{word} </motion.span>;
}
