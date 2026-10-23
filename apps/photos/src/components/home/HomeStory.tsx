"use client";

import {
  ArrowRightIcon,
  Button,
  Calendar,
  Cursor,
  DownloadIcon,
  HeartIcon,
  IconButton,
  LockIcon,
  Segment,
  SegmentedControl,
  Slider,
} from "@holominimal/ui";
import Link from "next/link";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { ProtectedImage } from "@/components/media";
import {
  BOOKING,
  CHAPTERS,
  DARKROOM,
  DELIVERED,
  KEEP,
  HUD,
  MOMENT,
  RANGE,
  ABOUT_LINES,
  TIMELINE,
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
        <span className="hj-seam" aria-hidden="true" />
        <div className="hj-scrim" aria-hidden="true" />
        <div className="hj-mask hj-title-mask">
          <h1 id="hj-title" className="hj-title">
            {THRESHOLD.title}
          </h1>
        </div>
        <span className="hj-corners" aria-hidden="true" />
        <p className="hj-cue" aria-hidden="true">
          {THRESHOLD.cue}
        </p>
      </div>
    </section>
  );
}

/**
 * The process as a bar across the top, from the shoot to the end. It starts as the vertical timeline of the booking
 * chapter: when that chapter ends, each dot flies from its place in the list to its place in the bar (FLIP).
 */
function TimelineBar() {
  const { chapter, motion, bar } = useStory();
  const ref = useRef<HTMLOListElement>(null);
  const shown = motion && (chapter >= 4 || bar);
  const was = useRef(false);
  const at = chapter >= 4 ? chapter : 3;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (shown && !was.current) {
      const dots = [...document.querySelectorAll<HTMLElement>(".hj-tl .hj-tl-dot")];
      const items = [...el.children] as HTMLElement[];
      if (dots.length === items.length) {
        items.forEach((li, i) => {
          const to = li.querySelector("i")?.getBoundingClientRect();
          const from = dots[i]?.getBoundingClientRect();
          if (!to || !from || from.bottom < 0 || from.top > innerHeight) return;
          li.style.transition = "none";
          li.style.translate = `${from.x - to.x}px ${from.y - to.y}px`;
          li.setAttribute("data-fly", "");
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              li.style.transition = `translate 0.5s var(--hm-ease-curtain) ${i * 22}ms`;
              li.style.translate = "0 0";
              setTimeout(() => {
                li.removeAttribute("data-fly");
                li.style.transition = "";
              }, 700);
            }),
          );
        });
      }
    }
    was.current = shown;
  }, [shown]);
  const go = (i: number) => {
    const id = ["booking", "booking", "booking", "booking", "moment", "darkroom", "delivered", "keep"][i];
    const el = document.getElementById(`ch-${id}`);
    if (!el) return;
    scrollTo({ top: el.getBoundingClientRect().top + scrollY, behavior: "smooth" });
    if (i < 4) setTimeout(() => dispatchEvent(new CustomEvent("hj-stage", { detail: i })), 700);
  };
  return (
    <ol className="hj-mini" ref={ref} data-show={shown ? "" : undefined} aria-label="Timeline">
      {TIMELINE.map((t, i) => (
        <li key={t.id} data-state={i < at ? "done" : i === at ? "now" : "next"}>
          <i />
          <button
            type="button"
            onClick={() => go(i)}
            aria-current={i === at ? "step" : undefined}
            tabIndex={shown ? 0 : -1}
          >
            {t.label}
          </button>
        </li>
      ))}
    </ol>
  );
}

/* ---- Chapter 1: a few lines about me ---- */

function About({ photo }: { photo?: StoryPhoto }) {
  const [fx, fy] = focalOf(photo);
  const S = 1.3;
  return (
    <section
      id="ch-about"
      className="hj-ch hj-seeing"
      data-chapter="about"
      data-scroll="pin"
      aria-label="About me"
      style={vars({ "--fx": fx, "--fy": fy, "--panx": pan(fx, S), "--pany": pan(fy, S) })}
    >
      <div className="hj-stick">
        <div className="hj-seeing-photo">
          <Ph photo={photo} pos={[50, 50]} sizes="100vw" />
        </div>
        <div className="hj-scrim" aria-hidden="true" />
        <ol className="hj-lines">
          {ABOUT_LINES.map((l, i) => (
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
  // TODO(owner): the sheet repeats the portfolio's photographs until there are enough different ones
  const wall = Array.from({ length: sheet.length ? 25 : 0 }, (_, i) => sheet[i % sheet.length] as StoryPhoto);
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
          {wall.map((p, i) => (
            <div
              key={`${p.id ?? "p"}-${i}`}
              className="hj-frame-cell"
              data-on={p.category === active ? "" : undefined}
              style={vars({ "--i": i })}
            >
              <Ph photo={p} sizes="(min-width: 900px) 24vw, 60vw" />
              <small>{String(i + 1).padStart(2, "0")}</small>
            </div>
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
                <Button asChild size="sm" shape="pill" variant={s.slug === active ? "primary" : "secondary"}>
                  <Link href={`/portfolio/${s.slug}`}>
                    {s.name}
                    <small>{s.count}</small>
                  </Link>
                </Button>
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

/** Days of the month that are open in the example calendar. */
const OPEN_DAYS = [5, 6, 12, 13, 19, 20, 26];

/** The example calendar in the booking sheet is Holominimal's own Calendar, with only some days open. */
function ExampleCalendar() {
  const [month] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth() + 1, 1);
  });
  return (
    <Calendar
      aria-label="Example calendar"
      defaultMonth={month}
      defaultValue={new Date(month.getFullYear(), month.getMonth(), 13)}
      isDisabled={(d) => !OPEN_DAYS.includes(d.getDate()) || d.getMonth() !== month.getMonth()}
    />
  );
}

/** Where in the booking chapter each of the four cards takes over (Connect is short; a card then every 2 s of autoplay). */
const STAGE_AT = [0, 0.15, 0.39, 0.63] as const;

function Booking({ packages, prep }: { packages: HomePackage[]; prep: StoryPhoto[] }) {
  const ref = useRef<HTMLElement>(null);
  const story = useStory();
  const [stage, setStage] = useState(0);
  const [pick, setPick] = useState(
    Math.max(
      0,
      packages.findIndex((p) => p.featured),
    ),
  );
  useProgress(ref, (p) => {
    setStage(STAGE_AT.filter((at) => p >= at).length - 1);
  });
  const motion = story.motion;
  const pkg = packages[pick];
  const state = (i: number) => (!motion ? "now" : i === stage ? "now" : i < stage ? "past" : "next");
  const go = (i: number) => {
    const el = ref.current;
    if (!el) return;
    if (!motion) return document.getElementById(`sheet-${BOOKING.stages[i]?.id}`)?.scrollIntoView({ block: "center" });
    const from = STAGE_AT[i] ?? 0;
    scrollTo({ top: yForProgress(el, (from + (STAGE_AT[i + 1] ?? 1)) / 2), behavior: "smooth" });
  };
  // the timeline bar can ask for one of the four cards
  // biome-ignore lint/correctness/useExhaustiveDependencies: go reads the latest section only
  useEffect(() => {
    const on = (e: Event) => go((e as CustomEvent<number>).detail);
    addEventListener("hj-stage", on);
    return () => removeEventListener("hj-stage", on);
  }, []);
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
            <ol
              className="hj-tl"
              data-gone={motion && story.bar ? "" : undefined}
              aria-label="The process, step by step"
              style={vars({ "--s": motion ? stage : 7 })}
            >
              {TIMELINE.map((t, i) => {
                const body = (
                  <>
                    <b>{t.label}</b>
                    <span>{t.text}</span>
                  </>
                );
                const later = ["moment", "darkroom", "delivered", "keep"][i - 4];
                return (
                  <li key={t.id} data-state={!motion ? "now" : i < stage ? "done" : i === stage ? "now" : "next"}>
                    <div className="hj-tl-dot" aria-hidden="true" />
                    {i < 4 ? (
                      <button
                        type="button"
                        onClick={() => go(i)}
                        aria-current={motion && i === stage ? "step" : undefined}
                      >
                        {body}
                      </button>
                    ) : (
                      <a href={`#ch-${later}`}>{body}</a>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
          <div className="hj-desk" data-hold="" style={vars({ "--stage": stage })}>
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
              <Button asChild shape="pill" variant="primary">
                <Link href={BOOKING.inquiry.cta.href}>
                  {BOOKING.inquiry.cta.label} <ArrowRightIcon />
                </Link>
              </Button>
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
                  <SegmentedControl
                    className="hj-pick"
                    aria-label="Packages"
                    value={String(pick)}
                    onValueChange={(v) => setPick(Number(v))}
                  >
                    {packages.map((p, i) => (
                      <Segment key={p.id} value={String(i)}>
                        {p.name}
                      </Segment>
                    ))}
                  </SegmentedControl>
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
              <Button asChild shape="pill" variant="secondary">
                <Link href={BOOKING.quote.cta.href}>
                  {BOOKING.quote.cta.label} <ArrowRightIcon />
                </Link>
              </Button>
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
              <ExampleCalendar />
              <p className="hj-note">{BOOKING.booking.note}</p>
              <p>{BOOKING.booking.terms}</p>
              <Button asChild shape="pill" variant="primary">
                <Link href={BOOKING.booking.cta.href}>
                  {BOOKING.booking.cta.label} <ArrowRightIcon />
                </Link>
              </Button>
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
  return (
    <section
      id="ch-moment"
      className="hj-ch hj-moment"
      data-chapter="moment"
      data-scroll="pin"
      aria-labelledby="hj-moment-title"
      style={vars({ "--fx": focalOf(photo)[0], "--fy": focalOf(photo)[1] })}
    >
      <div className="hj-stick">
        <div className="hj-shot">
          <Ph photo={photo} sizes="100vw" />
          <span className="hj-thirds" aria-hidden="true" />
          <span className="hj-af" aria-hidden="true" />
        </div>
        <div className="hj-scrim" aria-hidden="true" />
        <h2 id="hj-moment-title" className="hj-mask hj-big">
          <span className="hj-big-line">{MOMENT.line}</span>
        </h2>
        <span className="hj-dim" aria-hidden="true" />
      </div>
    </section>
  );
}

/* ---- Chapter 6: the darkroom ---- */

function Darkroom({ photo }: { photo?: StoryPhoto }) {
  const stage = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLElement>(null);
  const [split, setSplit] = useState(50);
  const user = useRef(false);
  useProgress(ref, (p) => {
    if (user.current) return;
    setSplit(Math.round(100 - Math.min(1, Math.max(0, (p - 0.12) * 1.45)) * 100));
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
        <div ref={stage} className="hj-dark-stage" style={vars({ "--ratio": ratio, "--split": `${split}%` })}>
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
          <div className="hj-compare">
            <Slider
              aria-label={DARKROOM.control}
              min={0}
              max={100}
              value={split}
              onValueChange={(v) => {
                user.current = true;
                setSplit(v);
              }}
            />
          </div>
          <p className="hj-note">{DARKROOM.note}</p>
        </div>
      </div>
    </section>
  );
}

/* ---- Chapter 7: galleries: a private proofing gallery, then a public showcase (laptop and phone mirror each other) ---- */

type Unlock = "locked" | "typing" | "open";

function Delivered({ cover, photos }: { cover?: StoryPhoto; photos: StoryPhoto[] }) {
  const ref = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState(0);
  const [unlock, setUnlock] = useState<Unlock>("locked");
  const [zoom, setZoom] = useState(false);
  const [hearts, setHearts] = useState<Record<number, boolean>>({});
  const [toast, setToast] = useState("");
  const timers = useRef<number[]>([]);
  const priv = DELIVERED.private;
  const pub = DELIVERED.public;
  const hearted = Object.values(hearts).filter(Boolean).length;
  const say = (m: string) => {
    setToast(m);
    for (const t of timers.current.filter((_, i) => i === 0)) clearTimeout(t);
    timers.current[0] = window.setTimeout(() => setToast(""), 2600);
  };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useProgress(ref, (p) => setPhase(p > 0.55 ? 1 : 0));
  // the stage zooms in first when it is half in view; then the passcode is entered
  const stageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.intersectionRatio >= 0.5) {
            setUnlock((u) => {
              if (u !== "locked") return u;
              // the laptop zooms in (0.7 s), the screen waits a beat (0.25 s), then the dots fill and the screen lifts
              timers.current[1] = window.setTimeout(() => setUnlock("typing"), 700 + 250);
              timers.current[2] = window.setTimeout(() => setUnlock("open"), 700 + 250 + 550);
              return u;
            });
            setZoom(true);
          } else if (e.intersectionRatio === 0) {
            clearTimeout(timers.current[1]);
            clearTimeout(timers.current[2]);
            setUnlock("locked");
            setZoom(false);
          }
        }
      },
      { threshold: [0, 0.5] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (unlock === "locked") {
      clearTimeout(timers.current[1]);
      clearTimeout(timers.current[2]);
    }
  }, [unlock]);
  const acts = (
    <div className="hj-acts">
      <Button
        type="button"
        size="sm"
        shape="pill"
        className="hj-act hj-act--send"
        onClick={() =>
          say(`Selection sent (example): ${hearted} favorite${hearted === 1 ? "" : "s"}. Nothing was actually sent.`)
        }
      >
        <HeartIcon aria-hidden="true" /> Send my selection
      </Button>
      <Button
        type="button"
        size="sm"
        shape="pill"
        variant="secondary"
        className="hj-act"
        onClick={() => say("Download started (example). No file is downloaded.")}
      >
        <DownloadIcon aria-hidden="true" /> Download
      </Button>
      <Button
        type="button"
        size="sm"
        shape="pill"
        variant="secondary"
        className="hj-act"
        onClick={() => say("Print order placed (example). Nothing was ordered.")}
      >
        Order prints
      </Button>
      <Button
        type="button"
        size="sm"
        shape="pill"
        variant="secondary"
        className="hj-act"
        onClick={() => say("Link copied (example): photo.jerryqiu.com/g/example")}
      >
        Share
      </Button>
    </div>
  );
  const lock = (
    <div className="hj-lock" data-state={unlock} aria-hidden="true">
      <LockIcon />
      <strong>{priv.passcode}</strong>
      <span className="hj-dots">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <i key={i} style={vars({ "--i": i })} />
        ))}
      </span>
    </div>
  );
  const heart = (i: number) => (
    <IconButton
      type="button"
      variant="ghost"
      aria-pressed={Boolean(hearts[i])}
      aria-label={`Favorite photograph ${i + 1} in the example gallery`}
      onClick={() => {
        setHearts((h) => ({ ...h, [i]: !h[i] }));
        say(hearts[i] ? "Removed from your favorites (example)" : "Added to your favorites (example)");
      }}
    >
      <HeartIcon />
    </IconButton>
  );
  const toastEl = (
    <div className="hj-toast" data-show={toast ? "" : undefined} aria-hidden="true">
      {toast}
    </div>
  );
  return (
    <section
      id="ch-delivered"
      ref={ref}
      className="hj-ch hj-delivered"
      data-chapter="delivered"
      data-scroll="pin"
      aria-labelledby="hj-del-title"
    >
      <div className="hj-stick" data-phase={phase} data-zoom={zoom ? "" : undefined} ref={stageRef}>
        <div className="hm-sr-only" role="status">
          {toast}
        </div>
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
                      {heart(i)}
                    </div>
                  ))}
                </div>
              </div>
              <div className="hj-bar">
                <i />
                <i />
                <i />
                <span>
                  <LockIcon aria-hidden="true" /> {phase ? pub.label : priv.label}
                </span>
              </div>
              {lock}
              {acts}
              {toastEl}
            </div>
          </div>
          <div className="hj-phone">
            <div className="hj-phone-screen">
              <div className="hj-pscroll">
                <div className="hj-pcover">
                  <Ph photo={cover} sizes="(min-width: 900px) 20vw, 80vw" />
                  <div className="hj-cover-text">
                    <small>{DELIVERED.demo}</small>
                    <strong>Your gallery</strong>
                  </div>
                </div>
                <div className="hj-pgrid">
                  {photos.slice(0, 12).map((p, i) => (
                    <div key={`${p.id ?? "p"}-m${i}`} className="hj-cell">
                      <Ph photo={p} sizes="(min-width: 900px) 10vw, 40vw" />
                      {heart(i)}
                    </div>
                  ))}
                </div>
              </div>
              <div className="hj-pbar">{phase ? pub.label : priv.label}</div>
              {lock}
              {acts}
              {toastEl}
            </div>
          </div>
        </div>
        <div className="hj-del-copy">
          <h2 id="hj-del-title" className="hj-h2">
            <span className="hj-mask">
              <span className="hj-swap" data-on={phase === 0 ? "" : undefined}>
                {priv.line}
              </span>
            </span>
            <span className="hj-mask">
              <span className="hj-swap" data-on={phase === 1 ? "" : undefined}>
                {pub.line}
              </span>
            </span>
          </h2>
          <ul className="hj-points" data-for="0">
            {priv.points.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <ul className="hj-points" data-for="1">
            {pub.points.map((t) => (
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

/* ---- Chapter 8: keep it: one photograph, standing on a table in a few sizes and formats (plain DOM) ---- */

function Keep({ photo }: { photo?: StoryPhoto }) {
  const r = photo ? photo.width / photo.height : 1.5;
  // the four formats drop onto the table one after another once the stage is mostly in view
  const stageRef = useRef<HTMLDivElement>(null);
  const [drop, setDrop] = useState(false);
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.intersectionRatio >= 0.5) setDrop(true);
          else if (e.intersectionRatio === 0) setDrop(false);
        }
      },
      { threshold: [0, 0.5] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const art = (sizes: string) => <Ph photo={photo} sizes={sizes} />;
  return (
    <section
      id="ch-keep"
      className="hj-ch hj-keep"
      data-chapter="keep"
      data-scroll="pin"
      aria-labelledby="hj-keep-title"
    >
      <div className="hj-stick" ref={stageRef}>
        <div className="hj-keep-copy">
          <h2 id="hj-keep-title" className="hj-h2">
            {KEEP.title}
          </h2>
          <p className="hj-note">{KEEP.note}</p>
          <Link href={KEEP.cta.href} className="hj-link">
            {KEEP.cta.label} <ArrowRightIcon />
          </Link>
        </div>
        <div className="hj-spread" style={vars({ "--r": r })} data-drop={drop ? "" : undefined}>
          <figure className="hj-fmt hj-fmt--wall" style={vars({ "--i": 0 })}>
            <div className="hj-fmt-frame">
              <div className="hj-fmt-mat">{art("(min-width: 900px) 34vw, 60vw")}</div>
            </div>
            <figcaption>{KEEP.items[0].label}</figcaption>
          </figure>
          <figure className="hj-fmt hj-fmt--frame" style={vars({ "--i": 1 })}>
            <div className="hj-fmt-frame hj-fmt-frame--oak">
              <div className="hj-fmt-mat">{art("20vw")}</div>
            </div>
            <figcaption>{KEEP.items[1].label}</figcaption>
          </figure>
          <figure className="hj-fmt hj-fmt--post" style={vars({ "--i": 2 })}>
            <div className="hj-fmt-post">
              <div className="hj-fmt-print hj-fmt-print--back">{art("12vw")}</div>
              <div className="hj-fmt-print">{art("12vw")}</div>
            </div>
            <figcaption>{KEEP.items[2].label}</figcaption>
          </figure>
          <figure className="hj-fmt hj-fmt--wallet" style={vars({ "--i": 3 })}>
            <div className="hj-fmt-wallet">
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="hj-fmt-id">
                  {art("6vw")}
                </div>
              ))}
            </div>
            <figcaption>{KEEP.items[3].label}</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

/**
 * One eased glide of fixed length to a place far down the page. The browser's own smooth scroll takes as long as the
 * distance and repaints every pinned chapter on the way; this one lasts under a second and tells the stylesheet
 * (html.hj-gliding) to drop the costly effects while it runs.
 */
let gliding = 0;
function glideTo(top: number, then?: () => void) {
  cancelAnimationFrame(gliding);
  const from = scrollY;
  const dist = top - from;
  const ms = Math.min(1100, 450 + Math.abs(dist) / 12);
  const root = document.documentElement;
  const start = performance.now();
  root.classList.add("hj-gliding");
  const stop = () => {
    cancelAnimationFrame(gliding);
    removeEventListener("wheel", stop);
    removeEventListener("touchstart", stop);
    removeEventListener("keydown", stop);
    root.classList.remove("hj-gliding");
  };
  addEventListener("wheel", stop, { passive: true, once: true });
  addEventListener("touchstart", stop, { passive: true, once: true });
  addEventListener("keydown", stop, { once: true });
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / ms);
    const e = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
    scrollTo({ top: from + dist * e, behavior: "instant" as ScrollBehavior });
    if (t < 1) gliding = requestAnimationFrame(step);
    else {
      stop();
      then?.();
    }
  };
  gliding = requestAnimationFrame(step);
}

/* ---- the heads-up display: skip, progress through the chapters, play and pause ---- */

function Hud({
  send,
  onCalm,
  calm,
  bare,
}: { send: (m: Mode) => void; onCalm: () => void; calm: boolean; bare?: boolean }) {
  const { chapter, mode, motion } = useStory();
  const toChapter = (i: number) => {
    const el = document.getElementById(`ch-${CHAPTERS[i]?.id}`);
    if (!el) return;
    send("manual");
    scrollTo({ top: el.getBoundingClientRect().top + scrollY, behavior: "smooth" });
  };
  const status = mode === "auto" ? HUD.auto : mode === "paused" ? HUD.paused : mode === "done" ? HUD.done : HUD.manual;
  return (
    <>
      <div className="hj-top">
        <p className="hj-id">{THRESHOLD.mark}</p>
        {motion ? (
          <p className="hj-chapter" aria-hidden="true">
            <b>{String(chapter + 1).padStart(2, "0")}</b> / {String(CHAPTERS.length).padStart(2, "0")}{" "}
            {CHAPTERS[chapter]?.label}
          </p>
        ) : null}
      </div>
      <div className="hj-hud" role="group" aria-label="Story controls" data-mode={mode}>
        {motion ? (
          <>
            <IconButton
              type="button"
              variant="primary"
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
            </IconButton>
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
              <Button type="button" size="sm" shape="pill" className="hj-resume" onClick={() => send("auto")}>
                {HUD.resume}
              </Button>
            ) : null}
          </>
        ) : null}
        {bare ? null : (
          <IconButton
            type="button"
            variant="secondary"
            className="hj-calm"
            aria-pressed={calm}
            aria-label="Reduce motion"
            title={calm ? "Motion is reduced. Turn motion back on" : "Reduce motion"}
            onClick={onCalm}
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M3 8c2.2-2 3.8 2 6 0s3.8 2 6 0 3.8 2 6 0M3 14c2.2-2 3.8 2 6 0s3.8 2 6 0 3.8 2 6 0" />
              {calm ? <path d="M4 20 20 4" /> : null}
            </svg>
          </IconButton>
        )}
        <Button asChild size="sm" shape="pill" variant="secondary" className="hj-skip">
          <a
            href="#finale"
            onClick={(e) => {
              e.preventDefault();
              send("manual");
              const f = document.getElementById("finale");
              if (!f) return;
              const done = () => document.getElementById("hj-finale-title")?.focus({ preventScroll: true });
              if (motion) glideTo(f.getBoundingClientRect().top + scrollY, done);
              else {
                scrollTo({ top: f.getBoundingClientRect().top + scrollY, behavior: "auto" });
                done();
              }
            }}
          >
            {HUD.skip} <ArrowRightIcon />
          </a>
        </Button>
      </div>
    </>
  );
}

/**
 * The home page (docs/project/HOME-VISION.md): nine chapters from a seam of light to a framed print, in one continuous
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
      {motion ? <TimelineBar /> : null}
      <Threshold photo={slots.threshold} />
      <About photo={slots.seeing} />
      <Range sheet={slots.sheet} subjects={subjects} />
      <Booking packages={packages} prep={slots.prep} />
      <Moment photo={slots.moment} />
      <Darkroom photo={slots.darkroom} />
      <Delivered cover={slots.delivered[0]} photos={slots.sheet} />
      <Keep photo={slots.finale} />
    </div>
  );
}
