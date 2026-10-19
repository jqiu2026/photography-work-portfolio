"use client";

import { ArrowRightIcon, Button, Cursor, DownloadIcon, HeartIcon, LockIcon } from "@holominimal/ui";
import Link from "next/link";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { ProtectedImage } from "@/components/media";
import {
  BOOKING,
  CHAPTERS,
  DARKROOM,
  DELIVERED,
  ROOM,
  TIMELINE,
  HUD,
  MOMENT,
  RANGE,
  SEEING_LINES,
  THRESHOLD,
  type StoryPhoto,
  type StorySlots,
  focalOf,
} from "@/content/home-story";
import {
  type Mode,
  motionAllowed,
  useAutoplay,
  useProgress,
  useScrollStory,
  setStage,
  useStory,
  yForProgress,
} from "./story-engine";
import "./home-story.css";

export type Subject = { slug: string; name: string; count: number };
export type HomePackage = {
  id: string;
  name: string;
  tagline?: string | null;
  price: string;
  featured: boolean;
  isSample: boolean;
  deliverables: { label: string; value: string }[];
  fees: string[];
};

const vars = (o: Record<string, string | number>) => o as CSSProperties;

/** A photograph filling its box, cropped around the point the camera cares about. Always through ProtectedImage. */
function Ph({
  photo,
  className,
  sizes = "100vw",
  priority,
  label,
  pos,
}: {
  photo?: StoryPhoto;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Alt text when the photograph carries meaning; empty for decoration. */
  label?: string;
  pos?: readonly [number, number];
}) {
  if (!photo) return <div className={`hj-ph ${className ?? ""}`} />;
  const [fx, fy] = pos ?? focalOf(photo);
  return (
    <div className={`hj-ph ${className ?? ""}`} style={vars({ "--pos": `${fx}% ${fy}%` })}>
      <ProtectedImage asset={photo} alt={label ?? ""} fill priority={priority} sizes={sizes} />
    </div>
  );
}

/** Largest pan (0 to 1) that keeps the zoomed photograph covering the window while the focal point moves to the middle. */
function pan(f: number, s: number) {
  const d = Math.abs(50 - f);
  return d < 0.01 ? 1 : Math.min(1, ((s - 1) * Math.min(f, 100 - f)) / d);
}

/* ---- Chapter 0: the threshold ---- */

function Threshold({ photo }: { photo?: StoryPhoto }) {
  return (
    <section
      id="ch-threshold"
      className="hj-ch hj-threshold"
      data-chapter="threshold"
      data-scroll="pin"
      aria-labelledby="hj-title"
    >
      <div className="hj-stick">
        <div className="hj-aperture">
          <Ph photo={photo} priority label={photo?.alt} sizes="100vw" className="hj-depth" />
        </div>
        <div className="hj-scrim" aria-hidden="true" />
        <div className="hj-mask hj-title-mask">
          <h1 id="hj-title" className="hj-title">
            {THRESHOLD.title}
          </h1>
        </div>
        <p className="hj-cue" aria-hidden="true">
          {THRESHOLD.cue}
        </p>
      </div>
    </section>
  );
}

/** "03 / 08 · Booking": which step of the timeline this scene is. */
function Kicker({ i }: { i: number }) {
  return (
    <p className="hj-kicker" aria-hidden="true">
      <b>{String(i + 1).padStart(2, "0")}</b> / {String(TIMELINE.length).padStart(2, "0")} · {TIMELINE[i]?.label}
    </p>
  );
}

/* ---- Chapter 1: seeing ---- */

function Seeing({ photo }: { photo?: StoryPhoto }) {
  const [fx, fy] = focalOf(photo);
  const S = 1.55;
  const mx = pan(fx, S);
  const my = pan(fy, S);
  return (
    <section
      id="ch-seeing"
      className="hj-ch hj-seeing"
      data-chapter="seeing"
      data-scroll="pin"
      aria-label="Seeing"
      style={vars({
        "--fx": fx,
        "--fy": fy,
        "--panx": mx,
        "--pany": my,
        "--rx": fx + (50 - fx) * mx,
        "--ry": fy + (50 - fy) * my,
      })}
    >
      <div className="hj-stick">
        <div className="hj-seeing-photo">
          <Ph photo={photo} pos={[50, 50]} sizes="100vw" />
        </div>
        <div className="hj-scrim" aria-hidden="true" />
        <span className="hj-reticle" aria-hidden="true" />
        <span className="hj-closing" aria-hidden="true" />
        <ol className="hj-lines">
          {SEEING_LINES.map((l, i) => (
            <li key={l} style={vars({ "--k": i })}>
              <span className="hj-mask">
                <span className="hj-line">{l}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---- Chapter 2: a world of photographs ---- */

function Range({ sheet, subjects }: { sheet: StoryPhoto[]; subjects: Subject[] }) {
  const ref = useRef<HTMLElement>(null);
  const cats = subjects.filter((s) => sheet.some((p) => p.category === s.slug));
  const [on, setOn] = useState(0);
  useProgress(ref, (p) => {
    const n = Math.max(1, cats.length);
    setOn(Math.min(n - 1, Math.max(0, Math.floor(((p - 0.12) / 0.78) * n))));
  });
  const active = cats[on]?.slug;
  return (
    <section
      id="ch-range"
      ref={ref}
      className="hj-ch hj-range"
      data-chapter="range"
      data-scroll="pin"
      aria-labelledby="hj-range-title"
    >
      <div className="hj-stick">
        <div className="hj-sheet" aria-hidden="true">
          {sheet.map((p, i) => (
            <Link
              key={p.id ?? i}
              href={`/portfolio/${p.category}`}
              tabIndex={-1}
              className="hj-frame-cell"
              data-on={p.category === active ? "" : undefined}
              style={vars({ "--i": i })}
            >
              <Ph photo={p} sizes="(min-width: 900px) 24vw, 60vw" />
              <small>{String(i + 1).padStart(2, "0")}</small>
            </Link>
          ))}
        </div>
        <span className="hj-viewing" aria-hidden="true" />
        <div className="hj-range-copy">
          <h2 id="hj-range-title" className="hj-h2">
            {RANGE.title}
          </h2>
          <ul className="hj-cats" aria-label="What I photograph">
            {subjects.map((s) => (
              <li key={s.slug}>
                <Link href={`/portfolio/${s.slug}`} data-on={s.slug === active ? "" : undefined}>
                  {s.name}
                  <small>{s.count}</small>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/portfolio" className="hj-link">
            {RANGE.all} <ArrowRightIcon />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---- Chapter 4: from idea to booking ---- */

const OPEN_DAYS = [5, 6, 12, 13, 19, 20, 26] as const;

function Calendar() {
  const [day, setDay] = useState<number>(13);
  const days = Array.from({ length: 35 }, (_, i) => i - 2);
  return (
    <div className="hj-cal">
      <div className="hj-cal-grid">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <b key={`${d}${i}`}>{d}</b>
        ))}
        {days.map((d) =>
          (OPEN_DAYS as readonly number[]).includes(d) ? (
            <button
              type="button"
              key={d}
              data-open=""
              data-picked={d === day ? "" : undefined}
              aria-pressed={d === day}
              onClick={() => setDay(d)}
            >
              {d}
            </button>
          ) : (
            <span key={d} data-out={d < 1 || d > 30 ? "" : undefined}>
              {d < 1 ? d + 30 : d > 30 ? d - 30 : d}
            </span>
          ),
        )}
      </div>
    </div>
  );
}

function Booking({ packages, prep }: { packages: HomePackage[]; prep: StoryPhoto[] }) {
  const ref = useRef<HTMLElement>(null);
  const story = useStory();
  const [stage, setStageLocal] = useState(0);
  const [pick, setPick] = useState(
    Math.max(
      0,
      packages.findIndex((p) => p.featured),
    ),
  );
  useProgress(ref, (p) => {
    const n = Math.min(3, Math.max(0, Math.floor((p - 0.04) * 4.2)));
    setStageLocal(n);
    setStage(n);
  });
  const motion = story.motion;
  const pkg = packages[pick];
  const state = (i: number) => (!motion ? "now" : i === stage ? "now" : i < stage ? "past" : "next");
  useEffect(() => {
    const on = (e: Event) => go((e as CustomEvent<number>).detail);
    addEventListener("hj-stage", on);
    return () => removeEventListener("hj-stage", on);
  });
  const go = (i: number) => {
    const el = ref.current;
    if (!el) return;
    if (!motion) return document.getElementById(`sheet-${BOOKING.stages[i]?.id}`)?.scrollIntoView({ block: "center" });
    scrollTo({ top: yForProgress(el, (i + 0.5) / 4.2 + 0.04), behavior: "smooth" });
  };
  return (
    <section
      id="ch-booking"
      ref={ref}
      className="hj-ch hj-booking"
      data-chapter="booking"
      data-scroll="pin"
      aria-labelledby="hj-booking-title"
    >
      <div className="hj-stick">
        <div className="hj-booking-grid">
          <div className="hj-booking-copy">
            <p className="hj-eyebrow">
              {BOOKING.eyebrow} · {BOOKING.timeline}
            </p>
            <h2 id="hj-booking-title" className="hj-h2">
              {BOOKING.title}
            </h2>
            <p className="hj-intro">{BOOKING.intro}</p>
            <ol className="hj-stages" aria-label="The first four steps">
              {BOOKING.stages.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => go(i)}
                    aria-current={motion && i === stage ? "step" : undefined}
                    data-done={motion && i < stage ? "" : undefined}
                  >
                    <b>{s.n}</b>
                    {s.label}
                  </button>
                </li>
              ))}
            </ol>
          </div>
          <div className="hj-desk" data-hold="">
            <article
              id="sheet-inquiry"
              className="hj-paper"
              data-hm-scheme="light"
              data-state={state(0)}
              style={vars({ "--k": 0 })}
              inert={motion && stage !== 0}
              aria-labelledby="sh-inquiry"
            >
              <small className="hj-paper-n">01</small>
              <h3 id="sh-inquiry">{BOOKING.inquiry.heading}</h3>
              <ul className="hj-prompts">
                {BOOKING.inquiry.prompts.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
              <Link href={BOOKING.inquiry.cta.href} className="hj-btn" data-kind="primary">
                {BOOKING.inquiry.cta.label} <ArrowRightIcon />
              </Link>
            </article>

            <article
              id="sheet-quote"
              className="hj-paper"
              data-hm-scheme="light"
              data-state={state(1)}
              style={vars({ "--k": 1 })}
              inert={motion && stage !== 1}
              aria-labelledby="sh-quote"
            >
              <small className="hj-paper-n">02</small>
              <h3 id="sh-quote">{BOOKING.quote.heading}</h3>
              {pkg ? (
                <>
                  <div className="hj-pick" role="group" aria-label="Packages">
                    {packages.map((p, i) => (
                      <button type="button" key={p.id} aria-pressed={i === pick} onClick={() => setPick(i)}>
                        {p.name}
                      </button>
                    ))}
                  </div>
                  <div className="hj-quote">
                    <strong className="hj-price">{pkg.price}</strong>
                    {pkg.tagline ? <p>{pkg.tagline}</p> : null}
                    <dl>
                      {pkg.deliverables.slice(0, 4).map((d) => (
                        <div key={d.label}>
                          <dt>{d.label}</dt>
                          <dd>{d.value}</dd>
                        </div>
                      ))}
                    </dl>
                    {pkg.isSample ? <small>Sample price, not final.</small> : null}
                  </div>
                </>
              ) : (
                <p>{BOOKING.quote.empty}</p>
              )}
              <Link href={BOOKING.quote.cta.href} className="hj-btn" data-kind="secondary">
                {BOOKING.quote.cta.label} <ArrowRightIcon />
              </Link>
            </article>

            <article
              id="sheet-booking"
              className="hj-paper"
              data-hm-scheme="light"
              data-state={state(2)}
              style={vars({ "--k": 2 })}
              inert={motion && stage !== 2}
              aria-labelledby="sh-booking"
            >
              <small className="hj-paper-n">03</small>
              <h3 id="sh-booking">{BOOKING.booking.heading}</h3>
              <Calendar />
              <p className="hj-note">{BOOKING.booking.note}</p>
              <p>{BOOKING.booking.terms}</p>
              <Link href={BOOKING.booking.cta.href} className="hj-btn" data-kind="primary">
                {BOOKING.booking.cta.label} <ArrowRightIcon />
              </Link>
            </article>

            <article
              id="sheet-prep"
              className="hj-paper"
              data-hm-scheme="light"
              data-state={state(3)}
              style={vars({ "--k": 3 })}
              inert={motion && stage !== 3}
              aria-labelledby="sh-prep"
            >
              <small className="hj-paper-n">04</small>
              <h3 id="sh-prep">{BOOKING.prep.heading}</h3>
              <div className="hj-refs" aria-hidden="true">
                {prep.map((p, i) => (
                  <Ph key={p.id ?? i} photo={p} sizes="12rem" />
                ))}
              </div>
              <ul className="hj-checks">
                {BOOKING.prep.items.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <p className="hj-note">{BOOKING.prep.note}</p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---- Chapter 5: the moment ---- */

function Moment({ photo }: { photo?: StoryPhoto }) {
  const [fx, fy] = focalOf(photo);
  return (
    <section
      id="ch-moment"
      className="hj-ch hj-moment"
      data-chapter="moment"
      data-scroll="pin"
      aria-label="The shoot"
      style={vars({ "--fx": fx, "--fy": fy })}
    >
      <div className="hj-stick">
        <Kicker i={4} />
        <div className="hj-shot">
          <Ph photo={photo} sizes="100vw" />
        </div>
        <span className="hj-thirds" aria-hidden="true" />
        <span className="hj-af" aria-hidden="true" />
        <ol className="hj-phases" aria-hidden="true">
          {MOMENT.phases.map((t, i) => (
            <li key={t} style={vars({ "--k": i })}>
              {t}
            </li>
          ))}
        </ol>
        <span className="hj-dim" aria-hidden="true" />
      </div>
    </section>
  );
}

/* ---- Chapter 6: the darkroom ---- */

function Darkroom({ photo }: { photo?: StoryPhoto }) {
  const stage = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLElement>(null);
  const range = useRef<HTMLInputElement>(null);
  const user = useRef(false);
  useProgress(ref, (p) => {
    if (user.current) return;
    const v = 100 - Math.min(1, Math.max(0, (p - 0.12) * 1.45)) * 100;
    stage.current?.style.setProperty("--split", `${v.toFixed(2)}%`);
    if (range.current) range.current.value = String(Math.round(v));
  });
  const ratio = photo ? photo.width / photo.height : 1.5;
  return (
    <section
      id="ch-darkroom"
      ref={ref}
      className="hj-ch hj-darkroom"
      data-chapter="darkroom"
      data-scroll="pin"
      aria-labelledby="hj-dark-title"
    >
      <div className="hj-stick">
        <Kicker i={5} />
        <div className="hj-dark-copy">
          <h2 id="hj-dark-title" className="hj-h2">
            {DARKROOM.title}
          </h2>
          <ul className="hj-edits" aria-hidden="true">
            {DARKROOM.steps.map((t, i) => (
              <li key={t} style={vars({ "--k": i })}>
                <span>{t}</span>
                <i>
                  <b />
                </i>
              </li>
            ))}
          </ul>
        </div>
        <div ref={stage} className="hj-dark-stage" style={vars({ "--ratio": ratio, "--split": "50%" })}>
          <div className="hj-print">
            <div className="hj-dark-img">
              <Ph photo={photo} sizes="(min-width: 900px) 60vw, 92vw" />
              <div className="hj-raw">
                <Ph photo={photo} sizes="(min-width: 900px) 60vw, 92vw" />
              </div>
              <span className="hj-split" aria-hidden="true" />
              <small className="hj-tag hj-tag--l">{DARKROOM.before}</small>
              <small className="hj-tag hj-tag--r">{DARKROOM.after}</small>
            </div>
          </div>
          <label className="hj-compare">
            <span className="hm-sr-only">{DARKROOM.control}</span>
            <input
              ref={range}
              type="range"
              min={0}
              max={100}
              defaultValue={50}
              onInput={(e) => {
                user.current = true;
                stage.current?.style.setProperty("--split", `${e.currentTarget.value}%`);
              }}
            />
          </label>
          <p className="hj-note">{DARKROOM.note}</p>
        </div>
      </div>
    </section>
  );
}

/* ---- Chapter 7: delivered ---- */

function Delivered({ cover, photos }: { cover?: StoryPhoto; photos: StoryPhoto[] }) {
  const [hearts, setHearts] = useState<Record<number, boolean>>({});
  const [phoneHeart, setPhoneHeart] = useState(false);
  const phonePhoto = photos[3] ?? cover;
  return (
    <section
      id="ch-delivered"
      className="hj-ch hj-delivered"
      data-chapter="delivered"
      data-scroll="pin"
      aria-labelledby="hj-del-title"
    >
      <div className="hj-stick">
        <Kicker i={6} />
        <div className="hj-devices" data-hold="">
          <div className="hj-laptop">
            <div className="hj-screen">
              <div className="hj-scroll">
                <div className="hj-cover">
                  <Ph photo={cover} sizes="(min-width: 900px) 80vw, 100vw" />
                  <div className="hj-cover-text">
                    <small>{DELIVERED.demo}</small>
                    <strong>Your gallery</strong>
                  </div>
                </div>
                <div className="hj-grid">
                  {photos.slice(0, 12).map((p, i) => (
                    <div key={`${p.id ?? "p"}-${i}`} className="hj-cell">
                      <Ph photo={p} sizes="(min-width: 900px) 22vw, 45vw" />
                      <button
                        type="button"
                        aria-pressed={Boolean(hearts[i])}
                        aria-label={`Favourite photograph ${i + 1} in the example gallery`}
                        onClick={() => setHearts((h) => ({ ...h, [i]: !h[i] }))}
                      >
                        <HeartIcon />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="hj-bar">
                <i />
                <i />
                <i />
                <span>
                  <LockIcon aria-hidden="true" /> {DELIVERED.demo}
                </span>
              </div>
            </div>
          </div>
          <div className="hj-phone" aria-hidden="true">
            <div className="hj-phone-photo">
              <Ph photo={phonePhoto} sizes="16rem" />
            </div>
            <div className="hj-phone-actions">
              <button
                type="button"
                tabIndex={-1}
                data-on={phoneHeart ? "" : undefined}
                onClick={() => setPhoneHeart((v) => !v)}
              >
                <HeartIcon /> Favourite
              </button>
              <span>
                <DownloadIcon /> Download
              </span>
            </div>
          </div>
        </div>
        <div className="hj-del-copy">
          <h2 id="hj-del-title" className="hj-h2">
            {DELIVERED.line}
          </h2>
          <ul className="hj-points">
            {DELIVERED.points.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <Link href={DELIVERED.cta.href} className="hj-link">
            {DELIVERED.cta.label} <ArrowRightIcon />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---- Chapter 8: keep it: prints in real-looking rooms (CSS 3D; the photographs stay ordinary protected images) ---- */

type FrameKind = "black" | "oak" | "white" | "canvas";

/** A framed print on a wall: a small 3D box (front, sides) with a mat, glass sheen and a soft shadow on the wall. */
function Frame({
  photo,
  long,
  x,
  y,
  kind,
  tilt = 0,
}: { photo?: StoryPhoto; long: number; x: number; y: number; kind: FrameKind; tilt?: number }) {
  const r = photo ? photo.width / photo.height : 1.5;
  const w = Math.round(r >= 1 ? long : long * r);
  const h = Math.round(r >= 1 ? long / r : long);
  const d = kind === "canvas" ? 34 : 22;
  const left = 900 + x - w / 2;
  const top = 520 + y - h / 2;
  return (
    <>
      <span
        className="hj-shadow"
        style={vars({ left: left + 10, top: top + 18, width: w, height: h })}
        aria-hidden="true"
      />
      <div
        className="hj-b3 hj-frame"
        data-kind={kind}
        style={vars({
          left,
          top,
          "--w": `${w}px`,
          "--h": `${h}px`,
          "--d": `${d}px`,
          "--mat": `${kind === "canvas" ? 0 : Math.round(long * 0.075)}px`,
          transform: `translateZ(${d / 2 + 1}px) rotate(${tilt}deg)`,
        })}
      >
        <div className="hj-f hj-front">
          <div className="hj-art">
            <Ph photo={photo} sizes="(min-width: 900px) 30vw, 60vw" />
          </div>
        </div>
        <i className="hj-f hj-side hj-s-r" />
        <i className="hj-f hj-side hj-s-l" />
        <i className="hj-f hj-side hj-s-t" />
        <i className="hj-f hj-side hj-s-b" />
      </div>
    </>
  );
}

/** A plain box (furniture): front and side faces coloured with a light from the left. */
function Piece({
  x,
  y,
  z,
  w,
  h,
  d,
  tone,
  className,
}: { x: number; y: number; z: number; w: number; h: number; d: number; tone: string; className?: string }) {
  return (
    <div
      className={`hj-b3 hj-piece ${className ?? ""}`}
      style={vars({
        left: 900 + x - w / 2,
        top: 856 - y - h,
        "--w": `${w}px`,
        "--h": `${h}px`,
        "--d": `${d}px`,
        "--tone": tone,
        transform: `translateZ(${z}px)`,
      })}
    >
      <i className="hj-f hj-front" />
      <i className="hj-f hj-side hj-s-r" />
      <i className="hj-f hj-side hj-s-l" />
      <i className="hj-f hj-side hj-s-t" />
    </div>
  );
}

function Room({ photos }: { photos: StoryPhoto[] }) {
  const stick = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = stick.current;
    if (!el) return;
    const fit = () => {
      const k = Math.min(innerHeight / 900, innerWidth / 700);
      el.style.setProperty("--k", Math.max(0.4, Math.min(1.2, k)).toFixed(3));
    };
    fit();
    addEventListener("resize", fit);
    return () => removeEventListener("resize", fit);
  }, []);
  const ph = (i: number) => photos[i % Math.max(1, photos.length)];
  return (
    <section
      id="ch-room"
      className="hj-ch hj-room"
      data-chapter="room"
      data-scroll="pin"
      aria-labelledby="hj-room-title"
    >
      <div className="hj-stick" ref={stick}>
        <Kicker i={7} />
        <div className="hj-room-copy">
          <h2 id="hj-room-title" className="hj-h2">
            {ROOM.title}
          </h2>
          <Link href={ROOM.cta.href} className="hj-link">
            {ROOM.cta.label} <ArrowRightIcon />
          </Link>
        </div>
        <div className="hj-cam" aria-hidden="true">
          {/* a living room: one large framed print over the sofa */}
          <div className="hj-set" data-room="a" style={vars({ "--n": 0 })}>
            <div className="hj-floor" />
            <div className="hj-wall3">
              <div className="hj-glow hj-glow--window" />
              <div className="hj-baseboard" />
              <Frame photo={ph(0)} long={540} x={0} y={-120} kind="oak" />
              <Frame photo={ph(1)} long={300} x={560} y={-90} kind="black" />
              <Frame photo={ph(2)} long={190} x={-520} y={-160} kind="white" />
            </div>
            <div className="hj-stage3">
              {" "}
              <Piece x={0} y={0} z={150} w={860} h={92} d={300} tone="#5d6b73" className="hj-sofa" />
              <Piece x={0} y={92} z={70} w={860} h={110} d={90} tone="#566268" className="hj-sofa" />
              <Piece x={-470} y={0} z={150} w={110} h={150} d={300} tone="#4f5b61" className="hj-sofa" />
              <Piece x={470} y={0} z={150} w={110} h={150} d={300} tone="#4f5b61" className="hj-sofa" />
              <span
                className="hj-flat hj-pole"
                style={vars({ left: 900 - 690, top: 856 - 420 - 0, transform: "translateZ(260px)" })}
              />
              <span
                className="hj-flat hj-lampshade"
                style={vars({ left: 900 - 750, top: 856 - 520, transform: "translateZ(260px)" })}
              />
            </div>
          </div>
          {/* a gallery wall: frames of different sizes and finishes */}
          <div className="hj-set" data-room="b" style={vars({ "--n": 1 })}>
            <div className="hj-floor" />
            <div className="hj-wall3">
              <div className="hj-glow hj-glow--spot" />
              <div className="hj-baseboard" />
              <Frame photo={ph(3)} long={330} x={-430} y={-110} kind="black" />
              <Frame photo={ph(4)} long={200} x={-110} y={-220} kind="white" />
              <Frame photo={ph(5)} long={200} x={-110} y={0} kind="oak" />
              <Frame photo={ph(6)} long={310} x={230} y={-100} kind="black" />
              <Frame photo={ph(7)} long={210} x={550} y={-210} kind="oak" />
              <Frame photo={ph(1)} long={170} x={550} y={-20} kind="white" />
            </div>
            <div className="hj-stage3">
              {" "}
              <Piece x={0} y={0} z={160} w={720} h={74} d={200} tone="#a98863" className="hj-bench" />
            </div>
          </div>
          {/* an office: a canvas print over a desk */}
          <div className="hj-set" data-room="c" style={vars({ "--n": 2 })}>
            <div className="hj-floor" />
            <div className="hj-wall3">
              <div className="hj-glow hj-glow--window" />
              <div className="hj-baseboard" />
              <Frame photo={ph(8)} long={560} x={0} y={-150} kind="canvas" />
              <Frame photo={ph(2)} long={180} x={-470} y={-40} kind="black" />
            </div>
            <div className="hj-stage3">
              {" "}
              <Piece x={0} y={238} z={170} w={900} h={26} d={340} tone="#b08a5c" className="hj-table" />
              <Piece x={-410} y={0} z={170} w={26} h={238} d={320} tone="#2d2d2d" />
              <Piece x={410} y={0} z={170} w={26} h={238} d={320} tone="#2d2d2d" />
              <Piece x={-260} y={264} z={150} w={190} h={12} d={120} tone="#1d1d1d" />
              <Piece x={300} y={264} z={110} w={14} h={150} d={14} tone="#222" />
              <Piece x={300} y={414} z={110} w={90} h={60} d={90} tone="#f2e4c4" className="hj-shade" />
            </div>
          </div>
        </div>
        <ul className="hj-caps" aria-label="The scenes">
          {ROOM.scenes.map((s, i) => (
            <li key={s.label} style={vars({ "--i": i })}>
              <span className="hj-mask">
                <span className="hj-cap">
                  <b>{s.label}</b> {s.note}
                </span>
              </span>
            </li>
          ))}
        </ul>
        <p className="hj-room-note">{ROOM.note}</p>
      </div>
    </section>
  );
}

/* ---- the heads-up display: skip, progress through the chapters, play and pause ---- */

function Hud({
  send,
  onCalm,
  calm,
  bare,
}: { send: (m: Mode) => void; onCalm: () => void; calm: boolean; bare?: boolean }) {
  const { chapter, mode, motion, stage } = useStory();
  const step = chapter === 3 ? stage : chapter >= 4 ? chapter : -1;
  const toChapter = (i: number) => {
    const el = document.getElementById(`ch-${CHAPTERS[i]?.id}`);
    if (!el) return;
    send("manual");
    scrollTo({ top: el.getBoundingClientRect().top + scrollY, behavior: "smooth" });
  };
  const toStep = (i: number) => {
    if (i >= 4) return toChapter(i);
    if (chapter === 3) return dispatchEvent(new CustomEvent("hj-stage", { detail: i }));
    toChapter(3);
    setTimeout(() => dispatchEvent(new CustomEvent("hj-stage", { detail: i })), 900);
  };
  const status = mode === "auto" ? HUD.auto : mode === "paused" ? HUD.paused : mode === "done" ? HUD.done : HUD.manual;
  return (
    <>
      <div className="hj-top">
        <a
          href="#finale"
          className="hj-skip"
          onClick={(e) => {
            e.preventDefault();
            send("manual");
            const f = document.getElementById("finale");
            if (!f) return;
            scrollTo({ top: f.getBoundingClientRect().top + scrollY, behavior: motion ? "smooth" : "auto" });
            document.getElementById("hj-finale-title")?.focus({ preventScroll: true });
          }}
        >
          {HUD.skip} <ArrowRightIcon />
        </a>
        {motion && step >= 0 ? (
          <ol className="hj-timeline" aria-label="Timeline">
            {TIMELINE.map((t, i) => (
              <li key={t.id} data-state={i < step ? "done" : i === step ? "now" : "next"}>
                <button type="button" onClick={() => toStep(i)} aria-current={i === step ? "step" : undefined}>
                  <i />
                  <span>{t.label}</span>
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <p className="hj-id">{THRESHOLD.mark}</p>
        )}
        {motion && step < 0 ? (
          <p className="hj-chapter" aria-hidden="true">
            <b>{String(chapter + 1).padStart(2, "0")}</b> / {String(CHAPTERS.length).padStart(2, "0")}{" "}
            {CHAPTERS[chapter]?.label}
          </p>
        ) : null}
      </div>
      {bare ? null : (
        <div className="hj-hud" role="group" aria-label="Story controls" data-mode={mode}>
          {motion ? (
            <>
              <button
                type="button"
                className="hj-play"
                aria-label={mode === "auto" ? HUD.pause : HUD.play}
                onClick={() => {
                  if (mode === "auto") send("paused");
                  else if (mode === "done") {
                    scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
                    send("auto");
                  } else send("auto");
                }}
              >
                {mode === "auto" ? (
                  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                    <path d="M4 3h3v10H4zM9 3h3v10H9z" fill="currentColor" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                    <path d="M4 2.5v11l9-5.5z" fill="currentColor" />
                  </svg>
                )}
              </button>
              <ol className="hj-segs" aria-label="Chapters">
                {CHAPTERS.map((c, i) => (
                  <li key={c.id} style={{ flexGrow: c.seconds }}>
                    <button
                      type="button"
                      data-seg=""
                      aria-label={c.label}
                      aria-current={i === chapter ? "step" : undefined}
                      onClick={() => toChapter(i)}
                    >
                      <i />
                    </button>
                  </li>
                ))}
              </ol>
              <p className="hj-status" aria-live="polite">
                {status}
              </p>
              {mode === "manual" ? (
                <button type="button" className="hj-resume" onClick={() => send("auto")}>
                  {HUD.resume}
                </button>
              ) : null}
            </>
          ) : null}
          <button type="button" className="hj-calm" aria-pressed={calm} onClick={onCalm}>
            {calm ? "Motion on" : "Calm"}
          </button>
        </div>
      )}
    </>
  );
}

/**
 * The home page (docs/project/HOME-VISION.md): eight chapters from a photograph to a framed print on a wall, in one continuous
 * scroll, which also plays by itself (the bar at the bottom) until the reader scrolls. Everything stands without motion:
 * no script, reduced motion or the Calm button show each chapter finished, in ordinary page flow.
 */
export function HomeStory({
  slots,
  subjects,
  packages,
}: {
  slots: StorySlots;
  subjects: Subject[];
  packages: HomePackage[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [motion, setMotion] = useState(false);
  const [calm, setCalm] = useState(false);
  useEffect(() => {
    let isCalm = false;
    try {
      isCalm = localStorage.getItem("hj-calm") === "1";
    } catch {}
    setCalm(isCalm);
    const root = document.documentElement;
    // page.tsx sets this before the first paint; this covers arriving by a link inside the site
    if (!isCalm && !matchMedia("(prefers-reduced-motion: reduce)").matches) root.setAttribute("data-hj-motion", "");
    setMotion(motionAllowed());
    return () => root.removeAttribute("data-hj-motion");
  }, []);
  useScrollStory(ref, motion);
  const send = useAutoplay(ref, motion);

  // the pointer gives the opening a little depth (desktop, motion only)
  useEffect(() => {
    const el = ref.current;
    if (!el || !motion || !matchMedia("(pointer: fine)").matches) return;
    let raf = 0;
    const move = (e: PointerEvent) => {
      const x = (e.clientX / innerWidth) * 2 - 1;
      const y = (e.clientY / innerHeight) * 2 - 1;
      raf ||= requestAnimationFrame(() => {
        raf = 0;
        el.style.setProperty("--mx", x.toFixed(3));
        el.style.setProperty("--my", y.toFixed(3));
      });
    };
    addEventListener("pointermove", move, { passive: true });
    return () => {
      removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, [motion]);

  const toggleCalm = () => {
    const next = !calm;
    // keep the reader on the chapter they are in when the layout changes
    const list = [...document.querySelectorAll<HTMLElement>("[data-chapter]")];
    const here = list.find((c) => c.getBoundingClientRect().bottom > innerHeight / 2);
    setCalm(next);
    try {
      localStorage.setItem("hj-calm", next ? "1" : "0");
    } catch {}
    const root = document.documentElement;
    if (next) root.removeAttribute("data-hj-motion");
    else if (!matchMedia("(prefers-reduced-motion: reduce)").matches) root.setAttribute("data-hj-motion", "");
    setMotion(motionAllowed());
    requestAnimationFrame(() => requestAnimationFrame(() => here?.scrollIntoView()));
  };

  return (
    <div className="hj" ref={ref} data-hm-scheme="dark">
      {motion ? (
        <Cursor shape="dot-ring" magnetic={0.3} morph smoothing={30} ringSmoothing={55} ripple blend="difference" />
      ) : null}
      {motion || calm ? (
        <Hud send={send} onCalm={toggleCalm} calm={calm} />
      ) : (
        <Hud send={send} onCalm={toggleCalm} calm={false} bare />
      )}
      <Threshold photo={slots.threshold} />
      <Seeing photo={slots.seeing} />
      <Range sheet={slots.sheet} subjects={subjects} />
      <Booking packages={packages} prep={slots.prep} />
      <Moment photo={slots.moment} />
      <Darkroom photo={slots.darkroom} />
      <Delivered cover={slots.delivered[0]} photos={slots.gallery} />
      <Room photos={slots.room} />
    </div>
  );
}
