"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cx } from "../components/cx";
import { AmbientWash } from "./components";

/**
 * A sticky text-and-image scene (at most 400vh). Native `position: sticky`; native scroll; sentinels decide which step
 * is current. Without JavaScript every step is shown stacked. The ambient wash follows the current photograph.
 */
export function StickyStory({
  items,
  label,
  className,
}: {
  items: { text: string; image: ReactNode; wash?: string }[];
  label: string;
  className?: string;
}) {
  const [i, setI] = useState(0);
  const marks = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => {
        for (const e of es) if (e.isIntersecting) setI(Number((e.target as HTMLElement).dataset.step));
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    marks.current.forEach((m) => m && io.observe(m));
    return () => io.disconnect();
  }, []);
  const num = (n: number) => String(n).padStart(2, "0");
  return (
    <section
      className={cx("hl3-story", className)}
      aria-label={label}
      style={{ "--n": items.length } as React.CSSProperties}
    >
      <div className="hl3-story__track">
        <div className="hl3-story__pin">
          <AmbientWash images={items.map((it) => it.wash)} active={i} />
          <div className="hl3-wrap hl3-story__grid">
            <div className="hl3-story__text">
              {items.map((it, k) => (
                <p key={k} className={cx("hl3-voice hl3-story__line", k === i && "is-active")}>
                  {it.text}
                </p>
              ))}
              <ol className="hl3-mono hl3-story__nums" aria-hidden>
                {items.map((_, k) => (
                  <li key={k} className={cx(k === i && "is-active")}>
                    {num(k + 1)}
                  </li>
                ))}
              </ol>
            </div>
            <div className="hl3-story__img">
              {items.map((it, k) => (
                <div key={k} className={cx("hl3-story__frame", k === i && "is-active")}>
                  {it.image}
                </div>
              ))}
            </div>
          </div>
        </div>
        {items.map((_, k) => (
          <div
            key={k}
            ref={(el) => {
              marks.current[k] = el;
            }}
            data-step={k}
            className="hl3-story__mark"
            style={{ top: `${k * 100}svh` }}
            aria-hidden
          />
        ))}
      </div>
    </section>
  );
}

/** Native horizontal scroller (scroll-snap proximity) with a mono counter. Keyboard focusable; arrow keys scroll. */
export function HScroller({
  children,
  label,
  count,
  className,
}: { children: ReactNode; label: string; count: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const on = () => {
      const kids = Array.from(el.children) as HTMLElement[];
      const mid = el.scrollLeft + el.clientWidth / 2;
      let best = 0;
      let d = Infinity;
      kids.forEach((k, idx) => {
        const dist = Math.abs(k.offsetLeft + k.offsetWidth / 2 - mid);
        if (dist < d) (d = dist), (best = idx);
      });
      setN(best + 1);
    };
    el.addEventListener("scroll", on, { passive: true });
    return () => el.removeEventListener("scroll", on);
  }, []);
  const num = (v: number) => String(v).padStart(2, "0");
  return (
    <div className={cx("hl3-hscroll", className)}>
      <div
        ref={ref}
        className="hl3-hscroll__track"
        role="region"
        aria-label={label}
        tabIndex={0}
        data-cursor="Drag"
        onKeyDown={(e) => {
          const el = ref.current;
          if (!el) return;
          const step = el.clientWidth * 0.6;
          if (e.key === "ArrowRight") el.scrollBy({ left: step, behavior: "smooth" }), e.preventDefault();
          if (e.key === "ArrowLeft") el.scrollBy({ left: -step, behavior: "smooth" }), e.preventDefault();
        }}
      >
        {children}
      </div>
      <p className="hl3-mono hl3-hscroll__count" aria-hidden>
        {num(n)} / {num(count)}
      </p>
    </div>
  );
}
