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
  FINALE,
  HUD,
  MOMENT,
  RANGE,
  SEEING_LINES,
  THRESHOLD,
  WORLDS,
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

/* ---- Chapter 3: the worlds I enter ---- */

function Worlds({ photos }: { photos: (StoryPhoto | undefined)[] }) {
  return (
    <section
      id="ch-worlds"
      className="hj-ch hj-worlds"
      data-chapter="worlds"
      data-scroll="pin"
      aria-label="The worlds I enter"
    >
      <div className="hj-stick">
        {WORLDS.map((w, i) => {
          const photo = photos[i];
          const [fx, fy] = focalOf(photo);
          return (
            <figure
              key={w.id}
              className="hj-world"
              data-open={w.open}
              style={vars({ "--i": i, "--fx": `${fx}%`, "--fy": `${fy}%` })}
            >
              <Ph photo={photo} sizes="100vw" label={photo?.alt} />
              <div className="hj-scrim" aria-hidden="true" />
              <figcaption className="hj-mask">
                <Link href={w.href} className="hj-world-name">
                  <span>{w.label}</span>
                  <ArrowRightIcon />
                </Link>
              </figcaption>
            </figure>
          );
        })}
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
  const [stage, setStage] = useState(0);
  const [pick, setPick] = useState(
    Math.max(
      0,
      packages.findIndex((p) => p.featured),
    ),
  );
  useProgress(ref, (p) => setStage(Math.min(3, Math.max(0, Math.floor((p - 0.04) * 4.2)))));
  const motion = story.motion;
  const pkg = packages[pick];
  const state = (i: number) => (!motion ? "now" : i === stage ? "now" : i < stage ? "past" : "next");
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
            <p className="hj-eyebrow">{BOOKING.eyebrow}</p>
            <h2 id="hj-booking-title" className="hj-h2">
              {BOOKING.title}
            </h2>
            <ol className="hj-stages" aria-label="The four stages">
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
      aria-label="The moment"
      style={vars({ "--fx": fx, "--fy": fy })}
    >
      <div className="hj-stick">
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

function Delivered({ photos }: { photos: StoryPhoto[] }) {
  const [cover, ...rest] = photos;
  const [hearts, setHearts] = useState<Record<number, boolean>>({});
  const [phoneHeart, setPhoneHeart] = useState(false);
  return (
    <section
      id="ch-delivered"
      className="hj-ch hj-delivered"
      data-chapter="delivered"
      data-scroll="pin"
      aria-labelledby="hj-del-title"
    >
      <div className="hj-stick">
        <div className="hj-del-copy">
          <h2 id="hj-del-title" className="hj-h2">
            {DELIVERED.line}
          </h2>
          <ul className="hj-points">
            {DELIVERED.points.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <Button asChild variant="secondary">
            <Link href={DELIVERED.cta.href}>
              {DELIVERED.cta.label} <ArrowRightIcon animate="nudge-right" animateOn="group" />
            </Link>
          </Button>
        </div>
        <div className="hj-devices" data-hold="">
          <div className="hj-laptop">
            <div className="hj-bar">
              <i />
              <i />
              <i />
              <span>
                <LockIcon aria-hidden="true" /> {DELIVERED.demo}
              </span>
            </div>
            <div className="hj-screen">
              <div className="hj-cover">
                <Ph photo={cover} sizes="(min-width: 900px) 40vw, 90vw" />
              </div>
              <div className="hj-grid">
                {rest.slice(0, 5).map((p, i) => (
                  <div key={p.id ?? i} className="hj-cell">
                    <Ph photo={p} sizes="14vw" />
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
          </div>
          <div className="hj-phone" aria-hidden="true">
            <div className="hj-phone-photo">
              <Ph photo={rest[1] ?? cover} sizes="14rem" />
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
      </div>
    </section>
  );
}

/* ---- Chapter 8: the photograph stays ---- */

function Finale({ photo }: { photo?: StoryPhoto }) {
  return (
    <section
      id="finale"
      className="hj-ch hj-finale"
      data-chapter="finale"
      data-scroll="pin"
      aria-labelledby="hj-finale-title"
    >
      <div className="hj-stick">
        <div className="hj-wall" aria-hidden="true">
          <span className="hj-lamp" />
          <div className="hj-framed">
            <div className="hj-mat">
              <Ph photo={photo} sizes="(min-width: 900px) 40vw, 80vw" />
            </div>
          </div>
        </div>
        <div className="hj-finale-copy">
          <h2 id="hj-finale-title" className="hj-mask" tabIndex={-1}>
            <span className="hj-final-line">{FINALE.line}</span>
          </h2>
          <div className="hj-actions">
            <Button asChild size="lg">
              <Link href={FINALE.primary.href}>
                {FINALE.primary.label} <ArrowRightIcon animate="nudge-right" animateOn="group" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href={FINALE.secondary.href}>{FINALE.secondary.label}</Link>
            </Button>
          </div>
        </div>
      </div>
      {/* the dock and the top bar arrive here (ChromeReveal) */}
      <span className="hj-bar-end" data-bar-end="" aria-hidden="true" />
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
  const { chapter, mode, motion } = useStory();
  const toChapter = (i: number) => {
    const el = document.getElementById(i === CHAPTERS.length - 1 ? "finale" : `ch-${CHAPTERS[i]?.id}`);
    if (!el) return;
    send("manual");
    scrollTo({ top: el.getBoundingClientRect().top + scrollY, behavior: "smooth" });
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
        <p className="hj-id">{THRESHOLD.mark}</p>
        {motion ? (
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
      {motion ? <Cursor shape="dot-ring" magnetic={0.25} morph spotlight={380} ripple blend="difference" /> : null}
      {motion || calm ? (
        <Hud send={send} onCalm={toggleCalm} calm={calm} />
      ) : (
        <Hud send={send} onCalm={toggleCalm} calm={false} bare />
      )}
      <Threshold photo={slots.threshold} />
      <Seeing photo={slots.seeing} />
      <Range sheet={slots.sheet} subjects={subjects} />
      <Worlds photos={slots.worlds} />
      <Booking packages={packages} prep={slots.prep} />
      <Moment photo={slots.moment} />
      <Darkroom photo={slots.darkroom} />
      <Delivered photos={slots.delivered} />
      <Finale photo={slots.finale} />
    </div>
  );
}
