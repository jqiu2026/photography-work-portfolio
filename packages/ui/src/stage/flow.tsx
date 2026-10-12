"use client";

import { useEffect, useRef, type ElementType, type ReactNode, type CSSProperties } from "react";
import { cx } from "../components/cx";
import { useStageOptional } from "./Stage";

/** Splits text into words (not characters): real DOM text, selectable, read normally by screen readers. */
function words(text: string) {
  return text.split(/(\s+)/).map((w, i) =>
    /^\s+$/.test(w) ? (
      w
    ) : (
      <span key={`${i}-${w}`} className="hl-word">
        <span className="hl-word__in" style={{ ["--hl-i" as string]: i / 2 } as CSSProperties}>
          {w}
        </span>
      </span>
    ),
  );
}

/**
 * Adds `.hl-in` when the element first enters the viewport. With `when="load"` the class is in the server-rendered HTML,
 * so the CSS animation starts at first paint without waiting for hydration (keeps LCP and CLS clean).
 */
function useReveal(when: "view" | "load") {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || when === "load") return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("hl-in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            e.target.classList.add("hl-in");
            io.unobserve(e.target);
          }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [when]);
  return ref;
}

type RevealProps = { as?: ElementType; text: string; className?: string; when?: "view" | "load" };

/** Condense: headlines blur, widen and rise into place, word by word (60 ms stagger by line). */
export function Condense({ as: Tag = "h2", text, className, when = "view" }: RevealProps) {
  const ref = useReveal(when);
  return (
    <Tag ref={ref} className={cx("hl-condense", when === "load" && "hl-in", className)} data-hl-reveal="condense">
      {words(text)}
    </Tag>
  );
}

/** Streak: a luminous bar sweeps across and the headline resolves behind it. Once per page, for the opening line. */
export function Streak({ as: Tag = "h1", text, className, when = "load" }: RevealProps) {
  const ref = useReveal(when);
  return (
    <Tag ref={ref} className={cx("hl-streak", when === "load" && "hl-in", className)} data-hl-reveal="streak">
      <span className="hl-streak__text">{text}</span>
    </Tag>
  );
}

/** Settle: body copy, captions and readouts fade up a few pixels. */
export function Settle({
  as: Tag = "p",
  className,
  children,
  when = "view",
  ...rest
}: { as?: ElementType; className?: string; children: ReactNode; when?: "view" | "load" } & Record<string, unknown>) {
  const ref = useReveal(when);
  return (
    <Tag ref={ref} className={cx("hl-settle", when === "load" && "hl-in", className)} data-hl-reveal="settle" {...rest}>
      {children}
    </Tag>
  );
}

/**
 * Threshold: a luminous frame that is a doorway. Activating it plays the dolly (the frame scales to the viewport, a
 * streak crosses the stage) and then navigates; a safety timeout navigates anyway. Cross-origin navigation cannot
 * use View Transitions, so the exit plays first. With reduced motion or the static tier it is a plain link.
 */
export function Threshold({
  href,
  title,
  label,
  accent,
  media,
  children,
  className,
}: {
  href: string;
  title: string;
  label: string;
  /** one of blue | red | amber | green: the frame's edge light */
  accent: "blue" | "red" | "amber" | "green";
  media?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const stage = useStageOptional();
  const ref = useRef<HTMLAnchorElement>(null);
  function go(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!stage || stage.tier === "static" || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    const el = ref.current;
    el?.setAttribute("data-crossing", "true");
    document.documentElement.setAttribute("data-hl-leaving", "threshold");
    stage.pulse(1, 1.4);
    const navigate = () => window.location.assign(href);
    window.setTimeout(navigate, 720);
  }
  return (
    <a ref={ref} href={href} onClick={go} className={cx("hl-threshold", `hl-threshold--${accent}`, className)}>
      <span className="hl-threshold__frame" aria-hidden="true">
        {media}
      </span>
      <span className="hl-threshold__body">
        <span className="hl-threshold__title">{title}</span>
        {children ? <span className="hl-threshold__text">{children}</span> : null}
        <span className="hl-threshold__enter">{label}</span>
      </span>
    </a>
  );
}
