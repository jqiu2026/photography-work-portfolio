"use client";

import {
  Animate,
  ArrowRightIcon,
  Badge,
  Button,
  CheckIcon,
  Cursor,
  DownloadIcon,
  HeartIcon,
  LockIcon,
  Marquee,
  ShoppingBagIcon,
  TextReveal,
  useInView,
  useReducedMotion,
} from "@holominimal/ui";
import Link from "next/link";
import { type CSSProperties, type ReactNode, type RefObject, useEffect, useRef, useState } from "react";
import { type ProtectedAsset, ProtectedImage } from "@/components/media";
import "./home.css";

export type HomePhoto = ProtectedAsset & { alt: string; category: string };
export type Subject = { slug: string; name: string };
export type HomePackage = { id: string; name: string; tagline?: string | null; price: string; featured: boolean };

const vars = (o: Record<string, string | number>) => o as CSSProperties;
const clamp = (v: number) => Math.min(1, Math.max(0, v));

/* TODO(owner): every line of copy on this page outside the hero lede is a draft; rewrite it in your voice. */

/**
 * One scroll engine for the whole page. Every element marked `data-scroll` gets `--p` (0 to 1, eased so it glides):
 *  - `pin`: through a tall section with a sticky stage (0 at its top, 1 when its end reaches the bottom of the window),
 *  - `center`: from entering the bottom of the window to sitting in the middle of it,
 *  - `pass`: the whole way from entering at the bottom to leaving at the top,
 *  - `track`: while the middle of the window runs from its top to its bottom (the journey's rail).
 * Elements near the screen also get `data-live`, which runs their CSS loops (and stops them when they leave). The page
 * root gets `--page` (0 to 1 down the whole page). Reduced motion writes each element's `data-still` (default 1) once
 * and does nothing else.
 */
function useScrollStory(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const items = [...el.querySelectorAll<HTMLElement>("[data-scroll]")];
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      for (const it of items) {
        it.style.setProperty("--p", it.dataset.still ?? "1");
        it.setAttribute("data-live", "");
      }
      return;
    }
    const state = items.map(() => ({ target: 0, current: -1 }));
    const page = { target: 0, current: -1 };
    let raf = 0;
    const ease = (s: { target: number; current: number }) => {
      if (s.current < 0) s.current = s.target;
      else s.current += (s.target - s.current) * 0.14;
      if (Math.abs(s.target - s.current) < 0.0007) s.current = s.target;
      return s.current === s.target;
    };
    const frame = () => {
      let done = true;
      items.forEach((it, i) => {
        const s = state[i];
        if (!s) return;
        done = ease(s) && done;
        it.style.setProperty("--p", s.current.toFixed(4));
      });
      done = ease(page) && done;
      el.style.setProperty("--page", page.current.toFixed(4));
      raf = done ? 0 : requestAnimationFrame(frame);
    };
    const measure = () => {
      const vh = innerHeight;
      items.forEach((it, i) => {
        const r = it.getBoundingClientRect();
        const mode = it.dataset.scroll;
        const t =
          mode === "pin"
            ? -r.top / Math.max(1, r.height - vh)
            : mode === "center"
              ? (vh - r.top) / Math.max(1, vh / 2 + r.height / 2)
              : mode === "track"
                ? (vh / 2 - r.top) / Math.max(1, r.height)
                : (vh - r.top) / (vh + r.height);
        const s = state[i];
        if (s) s.target = clamp(t);
        it.toggleAttribute("data-live", r.bottom > -vh * 0.2 && r.top < vh * 1.2);
      });
      page.target = clamp(scrollY / Math.max(1, document.documentElement.scrollHeight - vh));
      if (!raf) raf = requestAnimationFrame(frame);
    };
    measure();
    addEventListener("scroll", measure, { passive: true });
    addEventListener("resize", measure);
    return () => {
      removeEventListener("scroll", measure);
      removeEventListener("resize", measure);
      cancelAnimationFrame(raf);
    };
  }, [root]);
}

/** Steps 0..n-1 every `ms` while `ref` is on screen (the mockups' little routines). */
function useCycle(n: number, ms: number, ref: RefObject<Element | null>) {
  const [i, setI] = useState(0);
  const visible = useInView(ref, { threshold: 0.2 });
  useEffect(() => {
    if (!visible || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((v) => (v + 1) % n), ms);
    return () => clearInterval(t);
  }, [n, ms, visible]);
  return i;
}

/** The process at a glance; each entry jumps to its step further down. */
const STEPS = [
  { id: "step-package", title: "Pick a package" },
  { id: "step-date", title: "Book your date" },
  { id: "step-shoot", title: "I take the photographs" },
  { id: "step-edit", title: "I edit every frame" },
  { id: "step-gallery", title: "Your private gallery" },
  { id: "step-keep", title: "Download or print" },
] as const;

/**
 * Seven prints. `a` is the fan beside the headline (the last two wait off stage), `b` the collage they are dealt into
 * as the page scrolls (x in vw and y in vh from the middle of the stage, then the turn in degrees), `d` how far each
 * drifts with the mouse.
 */
const PRINTS = [
  { a: [12, 3, -11], b: [-30, -19, -4], d: 1.2 },
  { a: [17, -1, -5], b: [-10, -19, 3], d: 2 },
  { a: [22, 1, 1], b: [10, -19, -2], d: 2.8 },
  { a: [27, -2, 7], b: [30, -19, 4], d: 1.6 },
  { a: [32, 3, 13], b: [-20, 19, 3], d: 2.4 },
  { a: [70, -40, 30], b: [0, 19, -3], d: 3.2 },
  { a: [70, 40, -30], b: [20, 19, 2], d: 1.4 },
] as const;

function Hero({ photos, subjects }: { photos: HomePhoto[]; subjects: Subject[] }) {
  const ref = useRef<HTMLElement>(null);
  // the prints drift against the mouse (a few vw at most)
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let x = 0;
    let y = 0;
    const move = (e: PointerEvent) => {
      x = (e.clientX / innerWidth) * 2 - 1;
      y = (e.clientY / innerHeight) * 2 - 1;
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
  }, []);
  return (
    <section ref={ref} className="hj-hero" data-scroll="pin" data-still="0" aria-labelledby="hj-title">
      <div className="hj-stick">
        <div className="hj-hero-copy">
          <Animate animation="fade-down" className="hm-eyebrow" as="p">
            Jerry Qiu · Photography · New York
          </Animate>
          <h1 id="hj-title" className="hj-title">
            <TextReveal text="Pictures of people at work." step={90} animation="blur-in" />
          </h1>
          {/* TODO(owner): rewrite in your voice. Existing owner text from the original site. */}
          <Animate animation="fade-up" delay={500} as="p" className="hj-lede">
            Photography is how I started, and it is still how I pay attention. I make pictures of people at work, then
            spend a long time trying to make them honest.
          </Animate>
          <Animate animation="fade-up" delay={700} className="hj-actions">
            <Button asChild size="lg">
              <Link href="/book">
                Book a shoot <ArrowRightIcon animate="nudge-right" animateOn="group" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <a href="#how">See how it works</a>
            </Button>
          </Animate>
          {subjects.length ? (
            <ul className="hj-chips" aria-label="What I photograph">
              {subjects.map((s, i) => (
                <li key={s.slug} style={vars({ "--i": i })}>
                  <Link href={`/portfolio/${s.slug}`}>{s.name}</Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="hj-fan" aria-hidden="true">
          {photos.slice(0, PRINTS.length).map((p, i) => {
            const { a, b, d } = PRINTS[i] ?? PRINTS[0];
            return (
              <figure
                key={p.id ?? i}
                className="hj-print"
                style={vars({
                  "--ax": `${a[0]}vw`,
                  "--ay": `${a[1]}vh`,
                  "--ar": `${a[2]}deg`,
                  "--bx": `${b[0]}vw`,
                  "--by": `${b[1]}vh`,
                  "--br": `${b[2]}deg`,
                  "--d": d,
                  "--i": i,
                  zIndex: i === 2 ? 9 : i,
                })}
              >
                <ProtectedImage asset={p} alt="" fill priority sizes="(min-width: 900px) 20vw, 50vw" />
                <figcaption>{p.category}</figcaption>
              </figure>
            );
          })}
        </div>
        <div className="hj-howline" aria-hidden="true">
          Here's how it <span className="hj-holo">works.</span>
        </div>
        <nav className="hj-glance" aria-label="How it works, step by step">
          <ol>
            {STEPS.map((s, i) => (
              <li key={s.id} style={vars({ "--i": i })}>
                <a href={`#${s.id}`}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <p className="hj-scroll" aria-hidden="true">
          Scroll
        </p>
      </div>
    </section>
  );
}

/** Two rows of photographs drifting past, tilting up and sliding against each other with the scroll (decorative). */
function Work({ photos }: { photos: HomePhoto[] }) {
  if (photos.length < 6) return null;
  const half = Math.ceil(photos.length / 2);
  const row = (list: HomePhoto[], reverse: boolean) => (
    <Marquee duration={60} reverse={reverse} gap="0.75rem" className="hj-row">
      {list.map((p, i) => (
        <span key={`${p.id ?? i}`} className="hj-tile">
          <ProtectedImage asset={p} alt="" fill sizes="22rem" />
          <small>{p.category}</small>
        </span>
      ))}
    </Marquee>
  );
  return (
    <section className="hj-work" data-scroll="pass" aria-labelledby="hj-work-title">
      <div className="hj-head">
        <Animate animation="fade-right" trigger="view" as="p" className="hm-eyebrow">
          My work
        </Animate>
        <Animate animation="blur-in" trigger="view" as="h2" id="hj-work-title" className="hj-h2">
          Stage light, street light, <span className="hj-holo">runway light.</span>
        </Animate>
        <Animate animation="fade-up" trigger="view" delay={150} as="p">
          Theater and dance from the wings, events from the middle of the room, the city in snow, and planes.
        </Animate>
        <Animate animation="pop" trigger="view" delay={300}>
          <Button asChild variant="secondary">
            <Link href="/portfolio">
              See the portfolio <ArrowRightIcon animate="nudge-right" animateOn="group" />
            </Link>
          </Button>
        </Animate>
      </div>
      <div className="hj-rows" aria-hidden="true">
        <div className="hj-row-shift" data-dir="1">
          {row(photos.slice(0, half), false)}
        </div>
        <div className="hj-row-shift" data-dir="-1">
          {row(photos.slice(half), true)}
        </div>
      </div>
    </section>
  );
}

function Step({
  id,
  n,
  title,
  children,
  link,
  mock,
}: {
  id: string;
  n: number;
  title: string;
  children: ReactNode;
  link?: { href: string; label: string };
  mock: ReactNode;
}) {
  return (
    <li id={id} className="hj-step" data-scroll="center" data-side={n % 2 ? "l" : "r"}>
      <span className="hj-num" aria-hidden="true">
        <b>{String(n).padStart(2, "0")}</b>
      </span>
      <div className="hj-step-copy">
        <p className="hj-step-kicker">Step {n}</p>
        <h3>{title}</h3>
        {children}
        {link ? (
          <Link href={link.href} className="hj-link">
            {link.label} <ArrowRightIcon animate="nudge-right" animateOn="group" />
          </Link>
        ) : null}
      </div>
      <div className="hj-mock" aria-hidden="true">
        {mock}
      </div>
    </li>
  );
}

/* ---- the mockups: live markup with real photographs, never screenshots ---- */

function PackagesMock({ packages }: { packages: HomePackage[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const list = packages.length
    ? packages.slice(0, 3)
    : [
        { id: "a", name: "Portrait", price: "$XX", featured: false },
        { id: "b", name: "Event", price: "$XX", featured: true },
        { id: "c", name: "Performance", price: "$XX", featured: false },
      ];
  const pick = useCycle(list.length, 2600, ref);
  return (
    <div className="hj-packages" ref={ref} style={vars({ "--pick": pick })}>
      {list.map((p, i) => (
        <div key={p.id} className="hj-pack" data-picked={i === pick ? "" : undefined} style={vars({ "--i": i })}>
          <small>{p.featured ? "Most booked" : "Package"}</small>
          <strong>{p.name}</strong>
          <span className="hj-price">{p.price}</span>
          <i />
          <i />
          <i />
          <span className="hj-choose">
            {i === pick ? (
              <>
                <CheckIcon /> Chosen
              </>
            ) : (
              "Choose"
            )}
          </span>
        </div>
      ))}
      <span className="hj-pointer" key={pick} />
    </div>
  );
}

const OPEN_DAYS = [5, 6, 12, 13, 19, 20, 26] as const;
const TIMES = ["10:00", "13:30", "16:00"] as const;

function CalendarMock() {
  const ref = useRef<HTMLDivElement>(null);
  const tick = useCycle(OPEN_DAYS.length * 2, 1300, ref);
  const day = OPEN_DAYS[Math.floor(tick / 2)] ?? 13;
  const time = tick % 2 ? Math.floor(tick / 2) % TIMES.length : -1;
  const days = Array.from({ length: 35 }, (_, i) => i - 2);
  return (
    <div className="hj-cal" ref={ref}>
      <div className="hj-cal-head">
        <strong>Pick a day</strong>
        <span>‹ ›</span>
      </div>
      <div className="hj-cal-grid">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <b key={`${d}${i}`}>{d}</b>
        ))}
        {days.map((d) => (
          <span
            key={d}
            data-open={(OPEN_DAYS as readonly number[]).includes(d) ? "" : undefined}
            data-picked={d === day ? "" : undefined}
            data-out={d < 1 || d > 30 ? "" : undefined}
          >
            {d < 1 ? d + 30 : d > 30 ? d - 30 : d}
          </span>
        ))}
      </div>
      <div className="hj-slots">
        {TIMES.map((t, i) => (
          <span key={t} data-picked={i === time ? "" : undefined}>
            {t}
          </span>
        ))}
      </div>
      <Badge tone="accent" className="hj-cal-note" key={time >= 0 ? `t${tick}` : "n"}>
        {time >= 0 ? "Held with a deposit" : "A deposit holds your date"}
      </Badge>
    </div>
  );
}

const FOCUS = [
  ["33%", "33%"],
  ["62%", "40%"],
  ["45%", "62%"],
] as const;

function ShootMock({ photo }: { photo?: HomePhoto }) {
  const ref = useRef<HTMLDivElement>(null);
  const tick = useCycle(FOCUS.length, 1800, ref);
  const [fx, fy] = FOCUS[tick] ?? FOCUS[0];
  return (
    <div className="hj-viewfinder" ref={ref} style={vars({ "--fx": fx, "--fy": fy })}>
      <div className="hj-kenburns">{photo ? <ProtectedImage asset={photo} alt="" fill sizes="40vw" /> : null}</div>
      <span className="hj-thirds" />
      <span className="hj-corners" />
      <span className="hj-focus" key={`a${tick}`} />
      <span className="hj-flash" key={`f${tick}`} />
      <span className="hj-rec">
        <i /> Frame {String(128 + tick * 7).padStart(4, "0")}
      </span>
    </div>
  );
}

function EditMock({ photo }: { photo?: HomePhoto }) {
  return (
    <div className="hj-edit-wrap">
      <div className="hj-edit">
        {photo ? <ProtectedImage asset={photo} alt="" fill sizes="40vw" /> : null}
        <div className="hj-raw">{photo ? <ProtectedImage asset={photo} alt="" fill sizes="40vw" /> : null}</div>
        <span className="hj-split" />
        <small className="hj-tag hj-tag--l">From the camera</small>
        <small className="hj-tag hj-tag--r">Edited</small>
      </div>
      <div className="hj-sliders">
        {["Light", "Colour", "Contrast"].map((l, i) => (
          <span key={l} style={vars({ "--i": i })}>
            {l}
            <i>
              <b />
            </i>
          </span>
        ))}
      </div>
    </div>
  );
}

function GalleryMock({ photos }: { photos: HomePhoto[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const tick = useCycle(7, 900, ref);
  const [cover, ...rest] = photos;
  return (
    <div className="hj-devices" ref={ref}>
      <div className="hj-laptop">
        <div className="hj-bar">
          <i />
          <i />
          <i />
          <span>
            <LockIcon /> photo.jerryqiu.com/g/your-gallery
          </span>
        </div>
        <div className="hj-screen">
          <div className="hj-cover">
            {cover ? <ProtectedImage asset={cover} alt="" fill sizes="40vw" /> : null}
            <div className="hj-cover-text">
              <small>Example gallery</small>
              <strong>Your gallery</strong>
            </div>
          </div>
          <div className="hj-mini-bar">
            <span>All</span>
            <span>Favourites</span>
            <Badge tone="accent" key={tick}>
              Your selection · {tick}
            </Badge>
          </div>
          <div className="hj-grid">
            {rest.slice(0, 6).map((p, i) => (
              <span key={p.id ?? i} className="hj-cell" data-fav={i < tick ? "" : undefined}>
                <ProtectedImage asset={p} alt="" fill sizes="12vw" />
                <HeartIcon />
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="hj-phone">
        <div className="hj-notch" />
        <div className="hj-phone-photo">
          {rest[1] ? <ProtectedImage asset={rest[1]} alt="" fill sizes="14rem" /> : null}
          <span className="hj-burst" key={tick}>
            <HeartIcon />
          </span>
        </div>
        <div className="hj-phone-actions">
          <span>
            <HeartIcon /> Favourite
          </span>
          <span>
            <DownloadIcon /> Download
          </span>
        </div>
      </div>
    </div>
  );
}

function KeepMock({ photo }: { photo?: HomePhoto }) {
  return (
    <div className="hj-wall">
      <span className="hj-lamp" />
      <div className="hj-frame">
        <div className="hj-mat">{photo ? <ProtectedImage asset={photo} alt="" fill sizes="30vw" /> : null}</div>
      </div>
      <div className="hj-pills">
        <span className="hj-dl">
          <DownloadIcon /> Full size download
          <i>
            <b />
          </i>
        </span>
        <span className="hj-printed">
          <ShoppingBagIcon /> Print ordered
          <CheckIcon />
        </span>
      </div>
    </div>
  );
}

function Journey({ photos, packages }: { photos: HomePhoto[]; packages: HomePackage[] }) {
  const pick = (i: number) => photos[i % Math.max(1, photos.length)];
  return (
    <section id="how" className="hj-journey" aria-labelledby="hj-how-title">
      <div className="hj-head">
        <Animate animation="fade-right" trigger="view" as="p" className="hm-eyebrow">
          Working with me
        </Animate>
        <Animate animation="blur-in" trigger="view" as="h2" id="hj-how-title" className="hj-h2">
          From the first message to <span className="hj-holo">prints on your wall.</span>
        </Animate>
        <Animate animation="fade-up" trigger="view" delay={150} as="p">
          Six steps. You only have to do the first two; I do the rest and keep you posted by email.
        </Animate>
      </div>
      <div className="hj-track" data-scroll="track">
        <span className="hj-rail" aria-hidden="true">
          <i />
        </span>
        <ol className="hj-steps">
          <Step
            id="step-package"
            n={1}
            title="Pick a package"
            link={{ href: "/packages", label: "See the packages" }}
            mock={<PackagesMock packages={packages} />}
          >
            <p>
              Each package lists what you receive: how long I'm there, how many edited photographs, and how long your
              gallery stays online. Extras are priced on their own, so you can compare.
            </p>
          </Step>
          <Step
            id="step-date"
            n={2}
            title="Book your date"
            link={{ href: "/book", label: "Book a shoot" }}
            mock={<CalendarMock />}
          >
            <p>
              Pick a free time, or tell me about your event and I'll reply myself. A deposit holds the date, and the
              contract and invoice arrive by email, signed and paid online.
            </p>
          </Step>
          <Step id="step-shoot" n={3} title="I take the photographs" mock={<ShootMock photo={pick(7)} />}>
            <p>
              I work quietly and stay out of the way, waiting for the half second where someone forgets I'm there.
              Stage, street, a room full of people: the job is the same.
            </p>
          </Step>
          <Step id="step-edit" n={4} title="I edit every frame" mock={<EditMock photo={pick(2)} />}>
            <p>
              Back home I choose the best frames and edit each one by hand: colour, light and crop, so the set looks
              like one evening, not a hundred separate pictures.
            </p>
          </Step>
          <Step
            id="step-gallery"
            n={5}
            title="Your private gallery"
            link={{ href: "/galleries", label: "How galleries work" }}
            mock={<GalleryMock photos={photos.slice(5, 12).length >= 6 ? photos.slice(5, 12) : photos.slice(0, 7)} />}
          >
            <ul className="hj-points">
              <li>
                <LockIcon aria-hidden="true" /> A link and a passcode only you share.
              </li>
              <li>
                <HeartIcon aria-hidden="true" /> Mark favourites and send me your selection.
              </li>
            </ul>
          </Step>
          <Step
            id="step-keep"
            n={6}
            title="Download or print"
            link={{ href: "/prints", label: "About prints" }}
            mock={<KeepMock photo={pick(4)} />}
          >
            <p>
              Download your photographs full size, or order prints straight from the gallery. Download them before the
              gallery expires if you want to keep them.
            </p>
          </Step>
        </ol>
      </div>
    </section>
  );
}

/**
 * The home page: a pinned hero where the prints are dealt into a collage and the six steps rise into view, my work in
 * tilting, drifting rows, then the six steps, each flying in with a live, looping mockup. A custom cursor glides over
 * it all (mouse and pen only). Reduced motion shows every scene still.
 */
export function HomeJourney({
  photos,
  subjects,
  packages,
}: {
  photos: HomePhoto[];
  subjects: Subject[];
  packages: HomePackage[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();
  useScrollStory(ref);
  return (
    <div className="hj" ref={ref}>
      {still ? null : <Cursor shape="dot-ring" magnetic={0.25} morph spotlight={420} ripple blend="difference" />}
      <div className="hj-aurora" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <Hero photos={photos} subjects={subjects} />
      <Work photos={photos.slice(0, 16)} />
      <Journey photos={photos} packages={packages} />
    </div>
  );
}
