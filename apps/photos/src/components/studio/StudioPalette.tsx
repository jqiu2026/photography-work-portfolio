"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { groupOf, sectionInfo, studioSections } from "./sections";

type Entry = { label: string; hint: string; href: string; keys: string };

const ACTIONS: Entry[] = [
  {
    label: "New gallery",
    hint: "Create a client gallery",
    href: "/studio/galleries?new=1",
    keys: "create add gallery photos",
  },
  {
    label: "New client",
    hint: "Add a person you work with",
    href: "/studio/clients",
    keys: "create add client person",
  },
  { label: "New quote", hint: "Send a price to a client", href: "/studio/quotes", keys: "create add quote estimate" },
  { label: "New invoice", hint: "Bill a client", href: "/studio/invoices", keys: "create add invoice bill payment" },
  {
    label: "Orders and shop",
    hint: "Print and download sales",
    href: "/studio/orders",
    keys: "shop store sales orders prints",
  },
  { label: "View my site", hint: "Open the public homepage", href: "/", keys: "home website public" },
];

const PAGES: Entry[] = studioSections.map((s) => ({
  label: s.label,
  hint: `${groupOf(s.id).label} · ${sectionInfo[s.id] ?? ""}`,
  href: `/studio/${s.id}`,
  keys: `${groupOf(s.id).label} ${s.id}`,
}));

/**
 * "Jump to": one box that finds any studio page or common action by name (Ctrl or Command K, or the button). The sidebar
 * stays quiet; this is the fast way across the studio.
 */
export function StudioPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [at, setAt] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useMemo(() => {
    const all = [...ACTIONS, ...PAGES];
    const t = q.trim().toLowerCase();
    return t ? all.filter((e) => `${e.label} ${e.hint} ${e.keys}`.toLowerCase().includes(t)) : all;
  }, [q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") setOpen(false);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (open) {
      setQ("");
      setAt(0);
      requestAnimationFrame(() => input.current?.focus());
    }
  }, [open]);

  const go = (e?: Entry) => {
    if (!e) return;
    setOpen(false);
    router.push(e.href);
  };
  return (
    <>
      <div className="st-util">
        <button type="button" className="st-jump" onClick={() => setOpen(true)} aria-haspopup="dialog">
          Jump to <kbd>⌘K</kbd>
        </button>
        <a href="/studio/galleries?new=1" className="st-new">
          + New gallery
        </a>
      </div>
      {open ? (
        <div className="st-pal" role="dialog" aria-modal="true" aria-label="Jump to">
          <button
            type="button"
            className="st-pal__scrim"
            tabIndex={-1}
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <div className="st-pal__box">
            <input
              ref={input}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setAt(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setAt((a) => Math.min(list.length - 1, a + 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setAt((a) => Math.max(0, a - 1));
                } else if (e.key === "Enter") go(list[at]);
              }}
              placeholder="Go to a page or start something…"
              aria-label="Search the studio"
            />
            <ul id="st-pal-list">
              {list.slice(0, 12).map((e, i) => (
                <li key={e.href + e.label}>
                  <button
                    type="button"
                    data-on={i === at || undefined}
                    onMouseEnter={() => setAt(i)}
                    onClick={() => go(e)}
                  >
                    <span>{e.label}</span>
                    <small>{e.hint}</small>
                  </button>
                </li>
              ))}
              {list.length ? null : <li className="st-pal__none">Nothing matches “{q}”.</li>}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
