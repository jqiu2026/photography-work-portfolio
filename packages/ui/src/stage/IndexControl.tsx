"use client";

import { Dialog as RDialog } from "radix-ui";
import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { ThemeToggle } from "../components/navigation";
import { useStageOptional } from "./Stage";

export type IndexRoute = { label: string; href: string; note?: string };

/**
 * The floating index control: replaces every navbar. A ring (scroll progress) around an aperture glyph, plus the theme
 * toggle. It opens a full-screen index of this page's scenes and this site's routes. Keyboard and screen reader
 * friendly: a real button (aria-expanded), a modal dialog with a heading, scenes are real anchors.
 * No bare-letter shortcuts (WCAG 2.1.4). Never contains links to other family sites.
 */
export function IndexControl({
  routes = [],
  title = "Index",
  linkAs,
  children,
}: {
  routes?: IndexRoute[];
  title?: string;
  linkAs?: ElementType;
  /** Extra content at the end of the sheet (not for cross-site links) */
  children?: ReactNode;
}) {
  const stage = useStageOptional();
  const [open, setOpen] = useState(false);
  const Link = (linkAs ?? "a") as ElementType;
  const ring = useRef<SVGCircleElement>(null);

  // Static tier has no stage loop: keep the ring honest with a passive scroll listener.
  useEffect(() => {
    if (stage && stage.tier !== "static") return;
    const set = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      document.documentElement.style.setProperty("--hl-progress", p.toFixed(4));
    };
    set();
    window.addEventListener("scroll", set, { passive: true });
    return () => window.removeEventListener("scroll", set);
  }, [stage]);

  const scenes = stage?.scenes ?? [];
  return (
    <RDialog.Root open={open} onOpenChange={setOpen}>
      <div className="hl-index" data-open={open || undefined}>
        <RDialog.Trigger asChild>
          <button type="button" className="hl-index__btn" aria-label={`Open ${title.toLowerCase()}`}>
            <svg className="hl-index__ring" viewBox="0 0 56 56" aria-hidden="true" focusable="false">
              <circle className="hl-index__track" cx="28" cy="28" r="25" />
              <circle ref={ring} className="hl-index__bar" cx="28" cy="28" r="25" pathLength="1" />
              <g className="hl-index__aperture">
                {Array.from({ length: 6 }, (_, i) => (
                  <polygon key={i} points="28,12 32.5,22 28,28 23.5,22" transform={`rotate(${i * 60} 28 28)`} />
                ))}
              </g>
            </svg>
          </button>
        </RDialog.Trigger>
        <ThemeToggle />
      </div>
      <RDialog.Portal>
        <RDialog.Overlay className="hl-index-overlay" />
        <RDialog.Content className="hl-index-sheet" aria-describedby={undefined}>
          <RDialog.Title className="hl-index-sheet__title">{title}</RDialog.Title>
          <div className="hl-index-sheet__cols">
            {scenes.length ? (
              <nav aria-label="On this page">
                <h3 className="hl-eyebrow">On this page</h3>
                <ol>
                  {scenes.map((s, i) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        aria-current={stage && stage.store.sceneIndex === i ? "location" : undefined}
                        onClick={() => setOpen(false)}
                      >
                        <span className="hl-index-sheet__n">{String(i + 1).padStart(2, "0")}</span>
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            ) : null}
            {routes.length ? (
              <nav aria-label="This site">
                <h3 className="hl-eyebrow">This site</h3>
                <ul>
                  {routes.map((r) => (
                    <li key={r.href}>
                      <Link href={r.href} onClick={() => setOpen(false)}>
                        {r.label}
                        {r.note ? <small>{r.note}</small> : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}
          </div>
          <div className="hl-index-sheet__foot">
            <MotionSwitch />
            {children}
          </div>
          <RDialog.Close className="hl-index-sheet__close" aria-label="Close index">
            <span aria-hidden>×</span>
          </RDialog.Close>
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}

/** "Motion: Full / Calm". Calm is the static tier on purpose. Stored in localStorage (never required). */
export function MotionSwitch() {
  const stage = useStageOptional();
  if (!stage) return null;
  const calm = stage.tier === "static";
  return (
    <div className="hl-motion-switch" role="group" aria-label="Motion">
      <span className="hl-eyebrow">Motion</span>
      <button type="button" aria-pressed={!calm} onClick={() => stage.setChoice("full")}>
        Full
      </button>
      <button type="button" aria-pressed={calm} onClick={() => stage.setChoice("calm")}>
        Calm
      </button>
    </div>
  );
}
