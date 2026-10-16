"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef } from "react";
import { groupOf, studioGroups, studioSections } from "./sections";
import "./studio.css";
import "./studio-chrome.css";
import "./studio-dashboard.css";

/** Which sidebar entry a path belongs to (a single gallery page counts as Galleries). */
export function activeSection(pathname: string): string {
  const [, , seg, rest] = pathname.split("/");
  if (!seg) return "overview";
  if (seg === "gallery") return "galleries";
  if (seg === "health") return "overview";
  return rest !== undefined || studioSections.some((s) => s.id === seg) ? seg : "overview";
}

const REACH = 96; // px of vertical distance over which the pointer magnifies an entry
const RANGE = 300; // px from the left edge within which the pointer counts as "near the dock"

/**
 * Studio chrome: a see-through sidebar whose entries are tiny until the pointer comes close. The entry under the pointer
 * grows, the selected one is always the largest, and the rest shrink and fade with distance. A holographic backdrop follows
 * the pointer. Entries are real links (focus magnifies too); with reduced motion everything is static.
 */
export function StudioChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const active = groupOf(activeSection(pathname)).id;
  const dock = useRef<HTMLElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const activeIndex = Math.max(
    0,
    studioGroups.findIndex((g) => g.id === active),
  );

  useEffect(() => {
    const el = dock.current;
    if (!el) return;
    const items = Array.from(el.querySelectorAll<HTMLElement>("[data-dock-item]"));
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    const cur = items.map(() => 0);
    let pointer: { x: number; y: number } | null = null;
    let focused = -1;
    let raf = 0;

    const target = (i: number) => {
      if (i === activeIndex) return 1;
      const rest = 0.1 + 0.3 * Math.exp(-Math.abs(i - activeIndex) / 3);
      let k = rest;
      if (fine && pointer) {
        const r = items[i].getBoundingClientRect();
        const dy = pointer.y - (r.top + r.height / 2);
        const near = Math.max(0, Math.min(1, 1 - (pointer.x - 24) / RANGE));
        k = Math.max(k, 0.92 * Math.exp(-((dy / REACH) ** 2)) * near);
      }
      if (focused === i) k = Math.max(k, 0.92);
      return Math.min(k, i === activeIndex ? 1 : 0.92);
    };
    const paint = () => {
      let moving = false;
      items.forEach((it, i) => {
        const t = target(i);
        cur[i] = reduce ? t : cur[i] + (t - cur[i]) * 0.18;
        if (Math.abs(t - cur[i]) > 0.002) moving = true;
        it.style.setProperty("--k", cur[i].toFixed(3));
      });
      raf = moving ? requestAnimationFrame(paint) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };
    const move = (e: PointerEvent) => {
      pointer = { x: e.clientX, y: e.clientY };
      kick();
    };
    const leave = () => {
      pointer = null;
      kick();
    };
    const onFocus = (e: FocusEvent) => {
      focused = items.indexOf(e.target as HTMLElement);
      kick();
    };
    const onBlur = () => {
      focused = -1;
      kick();
    };
    addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    el.addEventListener("focusin", onFocus);
    el.addEventListener("focusout", onBlur);
    paint();
    return () => {
      removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      el.removeEventListener("focusin", onFocus);
      el.removeEventListener("focusout", onBlur);
      cancelAnimationFrame(raf);
    };
  }, [activeIndex]);

  return (
    <div className="st-root" ref={root}>
      <nav className="st-dock" aria-label="Studio sections" ref={dock}>
        <Link href="/" className="st-dock-brand">
          Studio
        </Link>
        <ul>
          {studioGroups.map((g, i) => (
            <li key={g.id} style={{ "--i": i } as React.CSSProperties}>
              <Link
                href={`/studio/${g.sections[0]}`}
                data-dock-item
                aria-current={g.id === active ? "page" : undefined}
                style={{ "--k": g.id === active ? 1 : 0.2 } as React.CSSProperties}
              >
                {g.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="st-stage">{children}</div>
    </div>
  );
}
