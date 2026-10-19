import {
  ArrowRightIcon,
  Badge,
  Button,
  CheckIcon,
  DownloadIcon,
  HeartIcon,
  LockIcon,
  Marquee,
  Reveal,
  ShoppingBagIcon,
  TextReveal,
} from "@holominimal/ui";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { type ProtectedAsset, ProtectedImage } from "@/components/media";
import "./home.css";

export type HomePhoto = ProtectedAsset & { alt: string; category: string };
export type Subject = { slug: string; name: string };
export type HomePackage = { id: string; name: string; tagline?: string | null; price: string; featured: boolean };

const vars = (o: Record<string, string | number>) => o as CSSProperties;

/* TODO(owner): every line of copy on this page outside the hero lede is a draft; rewrite it in your voice. */

/** The process at a glance; each entry jumps to its step further down. */
const STEPS = [
  { id: "step-package", title: "Pick a package" },
  { id: "step-date", title: "Book your date" },
  { id: "step-shoot", title: "I take the photographs" },
  { id: "step-edit", title: "I edit every frame" },
  { id: "step-gallery", title: "Your private gallery" },
  { id: "step-keep", title: "Download or print" },
] as const;

/** Five prints, fanned. They are dealt in once on load; nothing on this page is pinned to the scroll. */
const FAN = [
  [-34, 6, -10],
  [-14, -4, -4],
  [6, 2, 3],
  [26, -6, 8],
  [44, 6, 13],
] as const;

function Hero({ photos, subjects }: { photos: HomePhoto[]; subjects: Subject[] }) {
  return (
    <section className="hj-hero" aria-labelledby="hj-title">
      <div className="hj-hero-copy">
        <p className="hm-eyebrow">Jerry Qiu · Photography · New York</p>
        <h1 id="hj-title" className="hj-title">
          <TextReveal text="Pictures of people at work." step={70} />
        </h1>
        {/* TODO(owner): rewrite in your voice. Existing owner text from the original site. */}
        <p className="hj-lede">
          Photography is how I started, and it is still how I pay attention. I make pictures of people at work, then
          spend a long time trying to make them honest.
        </p>
        <div className="hj-actions">
          <Button asChild size="lg">
            <Link href="/book">
              Book a shoot <ArrowRightIcon animate="nudge-right" animateOn="group" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <a href="#how">See how it works</a>
          </Button>
        </div>
        {subjects.length ? (
          <ul className="hj-chips" aria-label="What I photograph">
            {subjects.map((s) => (
              <li key={s.slug}>
                <Link href={`/portfolio/${s.slug}`}>{s.name}</Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="hj-fan" aria-hidden="true">
        {photos.slice(0, FAN.length).map((p, i) => {
          const [x, y, r] = FAN[i] ?? FAN[0];
          return (
            <figure
              key={p.id ?? i}
              className="hj-print"
              style={vars({ "--x": `${x}%`, "--y": `${y}%`, "--r": `${r}deg`, "--i": i, zIndex: i === 2 ? 9 : i })}
            >
              <ProtectedImage asset={p} alt="" fill priority sizes="(min-width: 900px) 22vw, 50vw" />
              <figcaption>{p.category}</figcaption>
            </figure>
          );
        })}
      </div>
      <nav className="hj-glance" aria-label="How it works, step by step">
        <ol>
          {STEPS.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </section>
  );
}

/** Two rows of photographs drifting past (decorative: every photograph is in the portfolio). */
function Work({ photos }: { photos: HomePhoto[] }) {
  if (photos.length < 6) return null;
  const half = Math.ceil(photos.length / 2);
  const row = (list: HomePhoto[], reverse: boolean) => (
    <Marquee duration={80} reverse={reverse} gap="0.75rem" className="hj-row">
      {list.map((p, i) => (
        <span key={`${p.id ?? i}`} className="hj-tile">
          <ProtectedImage asset={p} alt="" fill sizes="22rem" />
        </span>
      ))}
    </Marquee>
  );
  return (
    <section className="hj-work" aria-labelledby="hj-work-title">
      <div className="hj-head">
        <p className="hm-eyebrow">My work</p>
        <h2 id="hj-work-title" className="hj-h2">
          Stage light, street light, <span className="hj-holo">runway light.</span>
        </h2>
        <p>Theater and dance from the wings, events from the middle of the room, the city in snow, and planes.</p>
        <Button asChild variant="secondary">
          <Link href="/portfolio">
            See the portfolio <ArrowRightIcon animate="nudge-right" animateOn="group" />
          </Link>
        </Button>
      </div>
      <div className="hj-rows" aria-hidden="true">
        {row(photos.slice(0, half), false)}
        {row(photos.slice(half), true)}
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
    <li id={id} className="hj-step" data-hm-reveal="">
      <span className="hj-num" aria-hidden="true">
        {String(n).padStart(2, "0")}
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
  const list = packages.length
    ? packages.slice(0, 3)
    : [
        { id: "a", name: "Portrait", price: "$XX", featured: false },
        { id: "b", name: "Event", price: "$XX", featured: true },
        { id: "c", name: "Performance", price: "$XX", featured: false },
      ];
  const pick = Math.max(
    0,
    list.findIndex((p) => p.featured),
  );
  return (
    <div className="hj-packages">
      {list.map((p, i) => (
        <div key={p.id} className="hj-pack" data-picked={i === pick ? "" : undefined}>
          <small>{i === pick ? "Most booked" : "Package"}</small>
          <strong>{p.name}</strong>
          <span className="hj-price">{p.price}</span>
          <i />
          <i />
          <i />
          <span className="hj-choose">{i === pick ? "Chosen" : "Choose"}</span>
        </div>
      ))}
    </div>
  );
}

function CalendarMock() {
  const days = Array.from({ length: 35 }, (_, i) => i - 2);
  const open = new Set([5, 6, 12, 13, 19, 20, 26]);
  return (
    <div className="hj-cal">
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
            data-open={open.has(d) ? "" : undefined}
            data-picked={d === 13 ? "" : undefined}
            data-out={d < 1 || d > 30 ? "" : undefined}
          >
            {d < 1 ? d + 30 : d > 30 ? d - 30 : d}
          </span>
        ))}
      </div>
      <div className="hj-slots">
        <span>10:00</span>
        <span data-picked="">13:30</span>
        <span>16:00</span>
      </div>
      <Badge tone="accent" className="hj-cal-note">
        A deposit holds your date
      </Badge>
    </div>
  );
}

function ShootMock({ photo }: { photo?: HomePhoto }) {
  return (
    <div className="hj-viewfinder">
      {photo ? <ProtectedImage asset={photo} alt="" fill sizes="40vw" /> : null}
      <span className="hj-thirds" />
      <span className="hj-corners" />
      <span className="hj-focus" />
    </div>
  );
}

function EditMock({ photo }: { photo?: HomePhoto }) {
  return (
    <div className="hj-edit">
      {photo ? <ProtectedImage asset={photo} alt="" fill sizes="40vw" /> : null}
      <div className="hj-raw">{photo ? <ProtectedImage asset={photo} alt="" fill sizes="40vw" /> : null}</div>
      <span className="hj-split" />
      <small className="hj-tag hj-tag--l">From the camera</small>
      <small className="hj-tag hj-tag--r">Edited</small>
    </div>
  );
}

function GalleryMock({ photos }: { photos: HomePhoto[] }) {
  const [cover, ...rest] = photos;
  return (
    <div className="hj-devices">
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
            <Badge tone="accent">Your selection</Badge>
          </div>
          <div className="hj-grid">
            {rest.slice(0, 6).map((p, i) => (
              <span key={p.id ?? i} className="hj-cell" data-fav={i === 1 || i === 4 ? "" : undefined}>
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
      <div className="hj-frame">
        <div className="hj-mat">{photo ? <ProtectedImage asset={photo} alt="" fill sizes="30vw" /> : null}</div>
      </div>
      <div className="hj-pills">
        <span>
          <DownloadIcon /> Full size download
        </span>
        <span>
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
        <p className="hm-eyebrow">Working with me</p>
        <h2 id="hj-how-title" className="hj-h2">
          From the first message to <span className="hj-holo">prints on your wall.</span>
        </h2>
        <p>Six steps. You only have to do the first two; I do the rest and keep you posted by email.</p>
      </div>
      <Reveal>
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
      </Reveal>
    </section>
  );
}

/** The home page: a hero with the process at a glance, my work in motion, then the six steps with live mockups. */
export function HomeJourney({
  photos,
  subjects,
  packages,
}: {
  photos: HomePhoto[];
  subjects: Subject[];
  packages: HomePackage[];
}) {
  return (
    <div className="hj">
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
