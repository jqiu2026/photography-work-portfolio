"use client";

import {
  ArrowRightIcon,
  Badge,
  Button,
  DownloadIcon,
  HeartIcon,
  LockIcon,
  Marquee,
  ShoppingBagIcon,
  TextReveal,
} from "@holominimal/ui";
import Link from "next/link";
import { type CSSProperties, type RefObject, useEffect, useRef } from "react";
import { type ProtectedAsset, ProtectedImage } from "@/components/media";
import "./home.css";

export type HomePhoto = ProtectedAsset & { alt: string; category: string };
export type Subject = { slug: string; name: string };

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Scroll progress for a scene, written to `--p` on the element (0 when it starts, 1 when it is done), eased so the
 * composition glides. `pin` runs through a tall section with a sticky stage; `enter` runs while the section comes into
 * view. Reduced motion holds `--p` at `still` (the composition that reads best without movement).
 */
function useProgress(ref: RefObject<HTMLElement | null>, mode: "pin" | "enter" = "pin", still = 1) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty("--p", String(still));
      return;
    }
    let target = 0;
    let current = -1;
    let raf = 0;
    const write = () => {
      current = current < 0 ? target : current + (target - current) * 0.16;
      if (Math.abs(target - current) < 0.0008) current = target;
      el.style.setProperty("--p", current.toFixed(4));
      raf = current === target ? 0 : requestAnimationFrame(write);
    };
    const measure = () => {
      const r = el.getBoundingClientRect();
      target =
        mode === "enter"
          ? clamp((innerHeight - r.top) / (innerHeight * 0.85))
          : clamp(-r.top / Math.max(1, r.height - innerHeight));
      if (!raf) raf = requestAnimationFrame(write);
    };
    measure();
    addEventListener("scroll", measure, { passive: true });
    addEventListener("resize", measure);
    return () => {
      removeEventListener("scroll", measure);
      removeEventListener("resize", measure);
      cancelAnimationFrame(raf);
    };
  }, [ref, mode, still]);
}

/** Where each print sits: fanned in a stack at the start (`a`), laid out as a collage at the end (`b`). */
const PRINTS = [
  { a: [-6, 2, -9], b: [-72, -31, -3] },
  { a: [4, -3, 6], b: [0, -31, 2] },
  { a: [-2, 4, -2], b: [72, -31, -2] },
  { a: [7, 5, 11], b: [-36, 31, 3] },
  { a: [0, 0, 1], b: [36, 31, -2] },
] as const;

function Hero({ photos, subjects }: { photos: HomePhoto[]; subjects: Subject[] }) {
  const ref = useRef<HTMLElement>(null);
  useProgress(ref, "pin", 0);
  return (
    <section ref={ref} className="hx-hero" aria-labelledby="hx-title">
      <div className="hx-stick">
        <div className="hx-copy">
          <p className="hm-eyebrow">Jerry Qiu · Photography · New York</p>
          <h1 id="hx-title" className="hx-title">
            <TextReveal text="Pictures of people at work." step={70} />
          </h1>
          {/* TODO(owner): rewrite in your voice. Existing owner text from the original site. */}
          <p className="hx-lede">
            Photography is how I started, and it is still how I pay attention. I make pictures of people at work, then
            spend a long time trying to make them honest.
          </p>
          <div className="hx-actions">
            <Button asChild size="lg">
              <Link href="/portfolio">
                See the portfolio <ArrowRightIcon animate="nudge-right" animateOn="group" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/book">Book a shoot</Link>
            </Button>
          </div>
          {subjects.length ? (
            <ul className="hx-subjects" aria-label="What I photograph">
              {subjects.map((s) => (
                <li key={s.slug}>
                  <Link href={`/portfolio/${s.slug}`}>{s.name}</Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="hx-prints" aria-hidden="true">
          {photos.slice(0, PRINTS.length).map((p, i) => {
            const { a, b } = PRINTS[i] ?? PRINTS[0];
            return (
              <figure
                key={p.id ?? i}
                className="hx-print"
                style={
                  {
                    "--ax": `${a[0]}%`,
                    "--ay": `${a[1]}%`,
                    "--ar": `${a[2]}deg`,
                    "--bx": `${b[0]}%`,
                    "--by": `${b[1]}%`,
                    "--br": `${b[2]}deg`,
                    "--i": i,
                    zIndex: PRINTS.length - i,
                  } as CSSProperties
                }
              >
                <ProtectedImage asset={p} alt="" fill priority={i < 2} sizes="(min-width: 900px) 30vw, 70vw" />
                <figcaption>{p.category}</figcaption>
              </figure>
            );
          })}
        </div>
        <p className="hx-scroll" aria-hidden="true">
          Scroll
        </p>
      </div>
    </section>
  );
}

/** Two rows of photographs drifting in opposite directions (decorative), under one line about what I photograph. */
function Subjects({ photos }: { photos: HomePhoto[] }) {
  if (photos.length < 6) return null;
  const half = Math.ceil(photos.length / 2);
  const row = (list: HomePhoto[], reverse: boolean) => (
    <Marquee duration={70} reverse={reverse} gap="0.75rem" className="hx-row">
      {list.map((p, i) => (
        <span key={`${p.id ?? i}`} className="hx-tile">
          <ProtectedImage asset={p} alt="" fill sizes="22rem" />
        </span>
      ))}
    </Marquee>
  );
  return (
    <section className="hx-subjects-scene" aria-labelledby="hx-kinds">
      <div className="hx-scene-head">
        {/* TODO(owner): both lines are drafts; rewrite them in your voice. */}
        <h2 id="hx-kinds" className="hx-h2">
          Stage light, street light, <span>runway light.</span>
        </h2>
        <p>Theater and dance from the wings, events from the middle of the room, the city in snow, and planes.</p>
      </div>
      {/* decorative: the subjects are links in the hero, and every photograph is in the portfolio */}
      <div className="hx-rows" aria-hidden="true">
        {row(photos.slice(0, half), false)}
        {row(photos.slice(half), true)}
      </div>
    </section>
  );
}

/** A client gallery on a laptop and a phone: the windows are live markup with real photographs, not screenshots. */
function Delivery({ photos }: { photos: HomePhoto[] }) {
  const ref = useRef<HTMLElement>(null);
  useProgress(ref, "enter");
  if (photos.length < 6) return null;
  const [cover, ...rest] = photos;
  return (
    <section ref={ref} className="hx-delivery" aria-labelledby="hx-deliver">
      <div className="hx-delivery-copy">
        <p className="hm-eyebrow">After the shoot</p>
        <h2 id="hx-deliver" className="hx-h2">
          Your photographs arrive in a private gallery.
        </h2>
        <ul className="hx-points">
          <li>
            <LockIcon aria-hidden="true" /> A link and a passcode only you share.
          </li>
          <li>
            <HeartIcon aria-hidden="true" /> Mark favourites and send me your selection.
          </li>
          <li>
            <DownloadIcon aria-hidden="true" /> Download full size, or order prints.
          </li>
        </ul>
        <Button asChild variant="secondary">
          <Link href="/galleries">
            How galleries work <ArrowRightIcon animate="nudge-right" animateOn="group" />
          </Link>
        </Button>
      </div>
      <div className="hx-devices" aria-hidden="true">
        <div className="hx-laptop">
          <div className="hx-bar">
            <i />
            <i />
            <i />
            <span>photo.jerryqiu.com/g/your-gallery</span>
          </div>
          <div className="hx-screen">
            <div className="hx-cover">
              {cover ? <ProtectedImage asset={cover} alt="" fill sizes="40vw" /> : null}
              <div className="hx-cover-text">
                <small>Example gallery</small>
                <strong>Your gallery</strong>
              </div>
            </div>
            <div className="hx-mini-bar">
              <span>All · 248</span>
              <span>Favourites · 12</span>
              <Badge tone="accent">Selection 12 of 30</Badge>
            </div>
            <div className="hx-grid">
              {rest.slice(0, 6).map((p, i) => (
                <span key={p.id ?? i} className="hx-cell" data-fav={i === 1 || i === 4 ? "" : undefined}>
                  <ProtectedImage asset={p} alt="" fill sizes="12vw" />
                  <HeartIcon />
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="hx-phone">
          <div className="hx-notch" />
          <div className="hx-phone-photo">
            {rest[1] ? <ProtectedImage asset={rest[1]} alt="" fill sizes="14rem" /> : null}
          </div>
          <div className="hx-phone-actions">
            <span>
              <HeartIcon /> Favourite
            </span>
            <span>
              <ShoppingBagIcon /> Order a print
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/** The immersive top of the home page: the hero story, the subjects in motion, then how delivery looks. */
export function HomeStory({ photos, subjects }: { photos: HomePhoto[]; subjects: Subject[] }) {
  return (
    <div className="hx">
      <div className="hx-aurora" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <Hero photos={photos} subjects={subjects} />
      <Subjects photos={photos.slice(0, 16)} />
      <Delivery photos={photos.slice(5, 12).length >= 6 ? photos.slice(5, 12) : photos.slice(0, 7)} />
    </div>
  );
}
