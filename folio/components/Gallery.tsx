"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Category } from "@/lib/photos-data";

const src = (slug: string, id: string, v: "s" | "l") => `/photos/${slug}/${id}-${v}.webp`;
const colsFor = (w: number) => (w < 520 ? 2 : w < 900 ? 3 : w < 1300 ? 4 : 5);

function Shot({ cat, index, onOpen }: { cat: Category; index: number; onOpen: (i: number) => void }) {
  const [id, w, h] = cat.items[index];
  const ref = useRef<HTMLButtonElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <button
      ref={ref}
      type="button"
      className={seen ? "shot in" : "shot"}
      aria-label={`${cat.title}, photo ${index + 1} of ${cat.items.length}: open`}
      onClick={() => onOpen(index)}
    >
      {/* biome-ignore lint/performance/noImgElement: already-resized WebP files, served as they are */}
      <img src={src(cat.slug, id, "s")} width={w} height={h} alt="" loading="lazy" decoding="async" draggable={false} />
    </button>
  );
}

function Section({ cat, columns, onOpen }: { cat: Category; columns: number; onOpen: (cat: Category, i: number) => void }) {
  // each photo goes to the shortest column so far, in order
  const cols: number[][] = Array.from({ length: columns }, () => []);
  const heights = new Array<number>(columns).fill(0);
  cat.items.forEach(([, w, h], i) => {
    let k = 0;
    for (let j = 1; j < columns; j++) if (heights[j] < heights[k] - 0.0001) k = j;
    heights[k] += h / w;
    cols[k].push(i);
  });
  return (
    <section className="cat" id={cat.slug} aria-labelledby={`${cat.slug}-h`}>
      <h2 id={`${cat.slug}-h`}>
        {cat.title}
        <small>{String(cat.items.length).padStart(2, "0")}</small>
      </h2>
      <div className="masonry">
        {cols.map((idxs, c) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: columns are positional
          <div className="col" key={c}>
            {idxs.map((i) => (
              <Shot key={cat.items[i][0]} cat={cat} index={i} onOpen={(n) => onOpen(cat, n)} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

export function Gallery({ categories }: { categories: Category[] }) {
  const mainRef = useRef<HTMLElement>(null);
  const [columns, setColumns] = useState(4);
  const [active, setActive] = useState<string>(categories[0]?.slug ?? "");
  const [open, setOpen] = useState<{ cat: Category; i: number } | null>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const set = () => setColumns(colsFor(el.clientWidth));
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // the chips follow the scroll
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => {
        for (const e of es) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    for (const c of categories) {
      const s = document.getElementById(c.slug);
      if (s) io.observe(s);
    }
    return () => io.disconnect();
  }, [categories]);
  useEffect(() => {
    document.querySelector(`.cats a[data-s="${active}"]`)?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [active]);

  const openAt = useCallback((cat: Category, i: number) => {
    opener.current = document.activeElement;
    setOpen({ cat, i });
  }, []);
  const close = useCallback(() => {
    setOpen(null);
    (opener.current as HTMLElement | null)?.focus?.();
  }, []);

  return (
    <>
      <nav className="cats" aria-label="Categories">
        {categories.map((c) => (
          <a key={c.slug} href={`#${c.slug}`} data-s={c.slug} className={active === c.slug ? "on" : undefined}>
            {c.title}
          </a>
        ))}
      </nav>
      <main id="gallery" ref={mainRef}>
        {categories.map((c) => (
          <Section key={c.slug} cat={c} columns={columns} onOpen={openAt} />
        ))}
      </main>
      {open ? <Viewer cat={open.cat} start={open.i} onClose={close} /> : null}
    </>
  );
}

function Viewer({ cat, start, onClose }: { cat: Category; start: number; onClose: () => void }) {
  const [i, setI] = useState(start);
  const n = cat.items.length;
  const root = useRef<HTMLDivElement>(null);
  const x0 = useRef<number | null>(null);
  const step = useCallback((d: number) => setI((v) => (v + d + n) % n), [n]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    root.current?.querySelector<HTMLElement>(".x")?.focus();
    return () => {
      document.body.style.overflow = "";
    };
  }, []);
  useEffect(() => {
    for (const d of [1, -1]) new Image().src = src(cat.slug, cat.items[(i + d + n) % n][0], "l");
  }, [i, cat, n]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "Tab") {
        const f = [...(root.current?.querySelectorAll<HTMLElement>("button") ?? [])];
        const at = f.indexOf(document.activeElement as HTMLElement);
        e.preventDefault();
        f[(at + (e.shiftKey ? -1 : 1) + f.length) % f.length]?.focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose, step]);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Escape and the buttons are the keyboard path
    <div
      className="lb open"
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      onClick={(e) => {
        if (e.target === e.currentTarget || (e.target as Element).tagName === "FIGURE") onClose();
      }}
      onTouchStart={(e) => {
        x0.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (x0.current == null) return;
        const dx = e.changedTouches[0].clientX - x0.current;
        x0.current = null;
        if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
      }}
    >
      <figure>
        {/* biome-ignore lint/performance/noImgElement: already-resized WebP files, served as they are */}
        <img key={i} src={src(cat.slug, cat.items[i][0], "l")} alt={`${cat.title} photo ${i + 1}`} draggable={false} />
      </figure>
      <button type="button" className="x" aria-label="Close" onClick={onClose}>
        &times;
      </button>
      <button type="button" className="p" aria-label="Previous photo" onClick={() => step(-1)}>
        &lsaquo;
      </button>
      <button type="button" className="n" aria-label="Next photo" onClick={() => step(1)}>
        &rsaquo;
      </button>
      <div className="ct">
        {cat.title} · {i + 1} / {n}
      </div>
    </div>
  );
}
