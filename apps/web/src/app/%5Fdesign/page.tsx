import { notFound } from "next/navigation";
import { Geist, Geist_Mono, Instrument_Serif, Inter_Tight, Newsreader } from "next/font/google";
import "./design.css";

export const metadata = { title: "Design directions (dev)", robots: { index: false } };

const instrument = Instrument_Serif({ weight: "400", subsets: ["latin"], variable: "--f-instrument" });
const intertight = Inter_Tight({ subsets: ["latin"], variable: "--f-intertight" });
const geist = Geist({ subsets: ["latin"], variable: "--f-geist" });
const geistmono = Geist_Mono({ subsets: ["latin"], variable: "--f-geistmono" });
const newsreader = Newsreader({ subsets: ["latin"], weight: ["300", "400"], style: ["normal", "italic"], variable: "--f-newsreader" });

const img = (id: string, w = 960) => `url(/opt/gallery/${id}-${w}.webp)`;

const DIRS = [
  { k: "a", name: "A · Gallery white", note: "Warm paper, high-contrast serif display (Instrument Serif) with Inter Tight. Editorial, quiet, pill buttons.", eyebrow: "Photographer · Builder · Pilot in training", h: "Hello, I'm Jerry.", p: "I take photos, write code and am learning to fly. This is where it all lives." },
  { k: "b", name: "B · Midnight cinema", note: "Near-black, one cool accent, huge tight grotesk (Geist) with Geist Mono details. Sharp 6px corners.", eyebrow: "Jerry Qiu — Portfolio", h: "Pictures, code, and the sky.", p: "A personal site with a few rooms: photography, music and flying." },
  { k: "c", name: "C · Soft neutral", note: "Stone and sage, light-weight serif (Newsreader) with mono captions. Understated, almost printed.", eyebrow: "New York · 2026", h: "Jerry Qiu, in plain words.", p: "Some photographs, some projects, and notes on what I'm learning." },
];

function Frame({ k, mode, d }: { k: string; mode: "light" | "dark"; d: (typeof DIRS)[number] }) {
  const sw = ["--bg", "--surface", "--line", "--muted", "--text", "--accent"];
  return (
    <div className={`dx dx${k}`} data-mode={mode}>
      <header>
        <b>Jerry Qiu ▾</b>
        <nav><span>Work</span><span>Writing</span><span>About</span><span className="accent">Connect</span></nav>
      </header>
      <section className="hero">
        <div>
          <div className="eyebrow">{d.eyebrow}</div>
          <h2>{d.h}</h2>
          <p>{d.p}</p>
          <div className="btns"><span className="btn solid">See my work</span><span className="btn">About me</span></div>
        </div>
        <div className="ph" style={{ backgroundImage: img(k === "a" ? "gf4a9402-2-3" : k === "b" ? "jry0011" : "jry0473") }} />
      </section>
      <div className="row">
        {["jry0473", "gf4a9402-2-3", "jry0011"].map((i, n) => (
          <div className="card" key={i}><div className="im" style={{ backgroundImage: img(i, 480) }} /><div className="t"><span>Project {n + 1}</span><small>2026</small></div></div>
        ))}
      </div>
      <div className="sw">{sw.map((v) => <span key={v} style={{ background: `var(${v})`, border: "1px solid var(--line)" }}>{mode === "light" && v === "--bg" ? v : ""}</span>)}</div>
      <div className="specimen"><i>Aa 123</i><span>Display</span><span>Body text in the sans face, <a className="lnk">with a link</a>.</span></div>
    </div>
  );
}

export default function DesignPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const fonts = [instrument, intertight, geist, geistmono, newsreader].map((f) => f.variable).join(" ");
  return (
    <main className={fonts} style={{ width: "100%", maxWidth: 1200, padding: "2rem 0 6rem" }}>
      <h1 style={{ fontSize: 28, marginBottom: 6 }}>Design directions</h1>
      <p style={{ opacity: 0.7, marginBottom: 32 }}>Three directions for the hub, each in light and dark. Decision and scoring: docs/project/design-language.md</p>
      {DIRS.map((d) => (
        <section key={d.k} id={d.k}>
          <h2 style={{ fontSize: 20, margin: "28px 0 4px" }}>{d.name}</h2>
          <p style={{ opacity: 0.7, marginBottom: 14 }}>{d.note}</p>
          <Frame k={d.k} mode="light" d={d} />
          <Frame k={d.k} mode="dark" d={d} />
        </section>
      ))}
    </main>
  );
}
