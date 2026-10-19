"use client";

import {
  Accordion, Avatar, Badge, Breadcrumbs, Button, Card, Checkbox, CodeBlock, Dialog, DialogClose, Eyebrow, Field, IconButton,
  Input, Menu, Pagination, Popover, Progress, Quote, RadioGroup, Select, Sheet, Skeleton, Slider, Spinner, Stat, Switch, Table,
  Tabs, Textarea, ThemeToggle, Timeline, Tooltip, useToast,
} from "@halation/ui";
import { Gallery, Image } from "@halation/ui/media";
import {
  AmbientWash, ArrowLink, Colossal, Dissolve, FocusPull, HScroller, Lines, Marquee, MotionToggle, Runtime, ScrollCue,
  SiteFooter, SiteHeader, StackPanel, StickyStack, StickyStory, Wrap, applyTier, evaluateTier, type MotionTier,
} from "@halation/ui/v3";
import { useCallback, useState, type ReactNode } from "react";
import { photoList, photos } from "@/content/library-images";

const P = photos;
const nav = [
  ["foundations", "Foundations"], ["actions", "Actions"], ["forms", "Forms"], ["feedback", "Overlays"], ["content", "Content"],
  ["motion", "Motion"], ["scenes", "Scenes"], ["chrome", "Chrome"], ["media", "Media"],
] as const;

function Sec({ id, title, intro, children }: { id: string; title: string; intro: string; children: ReactNode }) {
  return (
    <section id={id} className="lib-sec">
      <Wrap>
        <header>
          <p className="hl3-mono">{id}</p>
          <h2 className="hl3-h1" style={{ fontSize: "clamp(2.5rem, 6vw, 6rem)" }}>{title}</h2>
          <p>{intro}</p>
        </header>
        {children}
      </Wrap>
    </section>
  );
}
const Card3 = ({ title, children, wide }: { title: string; children: ReactNode; wide?: boolean }) => (
  <div className="lib-card" style={wide ? { gridColumn: "1 / -1" } : undefined}>
    <h3>{title}</h3>
    {children}
  </div>
);

/** Remounts its children so entrance animations can be replayed. */
function Replay({ children, label = "Replay" }: { children: ReactNode; label?: string }) {
  const [k, setK] = useState(0);
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div key={k}>{children}</div>
      <div><Button variant="ghost" onClick={() => setK((n) => n + 1)}>{label}</Button></div>
    </div>
  );
}

function ToastBtn() {
  const toast = useToast();
  return <Button variant="ghost" onClick={() => toast("Saved. This is a toast.")}>Show toast</Button>;
}

const swatch = (name: string, v: string, fg = "var(--hl-ink)") => (
  <div className="lib-sw" key={name}>
    <i style={{ background: v }} />
    <span style={{ color: fg }}>{name}<br />{v.startsWith("var") ? "" : v}</span>
  </div>
);

export function Library() {
  const [preset, setPreset] = useState<"hub" | "photos" | "music">("photos");
  const [tier, setTier] = useState<MotionTier>("full");
  const [lb, setLb] = useState<number | null>(null);
  const [wash, setWash] = useState(0);

  const setT = useCallback(async (t: MotionTier | "auto") => {
    if (t === "auto") {
      setTier(await evaluateTier(false));
      return;
    }
    document.documentElement.classList.add("hl-js");
    applyTier(t);
    setTier(t);
    if (t === "static") document.querySelectorAll("[data-reveal],[data-pull]").forEach((e) => e.classList.add("is-in"));
  }, []);

  const slides = [P["jry0022-enhanced-nr"], P["jry0473"], P["2026-01-17-snow-7"], P["jetblue-a220-300-1"]];
  const links = [{ label: "Portfolio", href: "#portfolio" }, { label: "Work", href: "#work" }, { label: "About", href: "#about" }, { label: "Book", href: "#book" }];

  return (
    <div data-preset={preset} style={{ background: "var(--hl-field)" }}>
      <Runtime />
      <div className="lib-bar">
        <a href="#top" style={{ color: "var(--hl-ink)", font: "500 18px var(--hl-font-display)" }}>Halation UI</a>
        <nav aria-label="Library sections">
          {nav.map(([id, l]) => <a key={id} href={`#${id}`}>{l}</a>)}
        </nav>
        <div className="lib-seg" role="group" aria-label="Accent">
          {(["hub", "photos", "music"] as const).map((p) => (
            <button key={p} aria-pressed={preset === p} onClick={() => setPreset(p)}>{p === "photos" ? "photo" : p}</button>
          ))}
        </div>
        <div className="lib-seg" role="group" aria-label="Motion tier">
          {(["static", "reduced", "full"] as const).map((t) => (
            <button key={t} aria-pressed={tier === t} onClick={() => setT(t)}>{t}</button>
          ))}
        </div>
        <ThemeToggle />
      </div>

      <header id="top" className="lib-hero">
        <Wrap>
          <p className="hl3-mono" style={{ marginBottom: 24 }}>Halation UI · v3 · live library</p>
          <Colossal label="Halation UI" lines={["HALATION", "UI."]} size="lg" split />
          <p className="hl3-voice" style={{ marginTop: 32, maxWidth: "34ch" }}>
            Massive, dreamy, built from photographs and type. Every element below is real and interactive.
          </p>
          <div style={{ marginTop: 32 }}><ScrollCue /></div>
        </Wrap>
      </header>

      <Sec id="foundations" title="Foundations" intro="Color, type, space and motion tokens. Flip theme, accent and motion tier in the bar above: everything on the page follows.">
        <div className="lib-grid">
          <Card3 title="Field and ink" wide>
            <div className="lib-swatches">
              {swatch("Night", "#07080c", "#eceff5")}
              {swatch("Cinema", "#050506", "#eceff5")}
              {swatch("Day", "#f3f1ec", "#0b0d12")}
              {swatch("Field (live)", "var(--hl-field)")}
              {swatch("Ink (live)", "var(--hl-ink)", "var(--hl-field)")}
              {swatch("Dim (live)", "var(--hl-dim)", "var(--hl-field)")}
            </div>
          </Card3>
          <Card3 title="Accents: link, focus, button, rule, marker. Never panels." wide>
            <div className="lib-swatches">
              {swatch("Hub blue", "#6f9bff", "#07080c")}
              {swatch("Photo red", "#ff6a5e", "#07080c")}
              {swatch("Music amber", "#ffcb47", "#07080c")}
              {swatch("Accent (live)", "var(--hl-accent)", "var(--hl-accent-contrast)")}
            </div>
          </Card3>
          <Card3 title="Colossal · Anybody 400, 18vw" wide>
            <Colossal as="div" lines={["Colossal"]} size="lg" />
          </Card3>
          <Card3 title="H1 / H2"><div className="hl3-h1" style={{ fontSize: "clamp(2.5rem, 5vw, 5rem)" }}>Heading one</div><div className="hl3-h2">Heading two</div></Card3>
          <Card3 title="Voice · Newsreader italic"><p className="hl3-voice">Things I wrote, and sometimes played.</p></Card3>
          <Card3 title="Body · Hanken Grotesk 17/1.6"><p className="hl3-body" style={{ margin: 0 }}>Pictures of people at work. A body paragraph holds a measure of about sixty-two characters so a line is easy to follow.</p></Card3>
          <Card3 title="Data · Martian Mono 12"><p className="hl3-mono">Chicago · 2025 · 48 frames · 02 / 06</p></Card3>
          <Card3 title="Easing and duration" wide>
            <Table>
              <thead><tr><th scope="col">Token</th><th scope="col">Value</th><th scope="col">Used for</th></tr></thead>
              <tbody>
                <tr><td>arrive</td><td className="hl3-mono">cubic-bezier(.22,1,.36,1)</td><td>reveals, focus pull</td></tr>
                <tr><td>travel</td><td className="hl3-mono">cubic-bezier(.65,0,.35,1)</td><td>dissolves, wash</td></tr>
                <tr><td>exit</td><td className="hl3-mono">cubic-bezier(.5,0,.9,.4)</td><td>leaving</td></tr>
                <tr><td>durations</td><td className="hl3-mono">180 / 900 / 1000 / 1400 ms · 60 s</td><td>hover / reveal / dissolve / pull / marquee</td></tr>
              </tbody>
            </Table>
          </Card3>
          <Card3 title="Tiers" wide>
            <p className="lib-note">static: nothing moves (reduced motion, Calm, Save-Data, no JS). reduced: fades only. full: parallax, focus pull, dissolves. Current: <b>{tier}</b></p>
            <div className="lib-row">
              <Button variant="ghost" onClick={() => setT("auto")}>Re-detect (frame probe off)</Button>
              <MotionToggle className="hl3-link" />
            </div>
          </Card3>
        </div>
      </Sec>

      <Sec id="actions" title="Actions" intro="Primary is 52 px tall with a 6 px radius. The arrow slides 6 px on hover. Text links draw their underline from the left.">
        <div className="lib-grid">
          <Card3 title="Buttons">
            <div className="lib-row">
              <ArrowLink href="#actions" variant="primary">Book a shoot</ArrowLink>
              <ArrowLink href="#actions" variant="ghost">View portfolio</ArrowLink>
            </div>
            <div className="lib-row"><Button>Solid</Button><Button variant="accent">Accent</Button><Button variant="ghost">Ghost</Button><Button variant="quiet">Quiet</Button><Button loading>Loading</Button></div>
          </Card3>
          <Card3 title="Text link"><p><ArrowLink href="#actions">Read the case study</ArrowLink></p></Card3>
          <Card3 title="Icon buttons and tooltip">
            <div className="lib-row">
              <Tooltip content="Previous"><IconButton label="Previous" variant="ghost">←</IconButton></Tooltip>
              <Tooltip content="Pause"><IconButton label="Pause" variant="ghost">II</IconButton></Tooltip>
              <Tooltip content="Next"><IconButton label="Next" variant="ghost">→</IconButton></Tooltip>
            </div>
          </Card3>
          <Card3 title="Menu"><Menu trigger={<Button variant="ghost">Actions</Button>} items={[{ label: "Edit" }, { label: "Duplicate" }, { label: "Delete", destructive: true }]} /></Card3>
          <Card3 title="Badges">
            <div className="lib-row"><Badge>Draft</Badge><Badge tone="accent">New</Badge><Badge tone="success">Delivered</Badge><Badge tone="danger">Overdue</Badge></div>
          </Card3>
        </div>
      </Sec>

      <Sec id="forms" title="Forms" intro="Visible labels, 56 px fields in the booking form, clear errors. Controls never rely on color alone.">
        <div className="lib-grid">
          <Card3 title="Text"><Field label="Name"><Input placeholder="Ada Lovelace" /></Field><Field label="Email" hint="We reply by email." error="Please enter a valid address."><Input defaultValue="nope" /></Field></Card3>
          <Card3 title="Message and choice"><Field label="What do you need?"><Textarea rows={3} /></Field><Field label="Type of shoot"><Select><option>Event</option><option>Portrait</option><option>Theater</option></Select></Field></Card3>
          <Card3 title="Selection">
            <Checkbox label="I agree to the privacy notice" defaultChecked />
            <Switch label="Email me a copy" />
            <RadioGroup aria-label="Package" defaultValue="a" options={[{ value: "a", label: "Half day" }, { value: "b", label: "Full day" }]} />
            <Slider label="Volume" defaultValue={[40]} />
          </Card3>
        </div>
      </Sec>

      <Sec id="feedback" title="Overlays and feedback" intro="Dialog, sheet, popover, toast, tabs and accordion: all keyboard operable with focus handling.">
        <div className="lib-grid">
          <Card3 title="Dialog and sheet">
            <div className="lib-row">
              <Dialog title="Delete this gallery?" description="This cannot be undone." trigger={<Button variant="ghost">Open dialog</Button>}>
                <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
              </Dialog>
              <Sheet title="Filters" trigger={<Button variant="ghost">Open sheet</Button>}><p>Panel content</p></Sheet>
              <Popover trigger={<Button variant="ghost">Popover</Button>}><p style={{ margin: 0 }}>A small floating panel.</p></Popover>
              <ToastBtn />
            </div>
          </Card3>
          <Card3 title="Tabs"><Tabs tabs={[{ value: "a", label: "Details", content: "Shoot details" }, { value: "b", label: "Delivery", content: "Delivery notes" }]} /></Card3>
          <Card3 title="Accordion"><Accordion items={[{ value: "1", title: "How long until delivery?", content: "TODO(owner): your turnaround." }, { value: "2", title: "Do I get raw files?", content: "TODO(owner)." }]} /></Card3>
          <Card3 title="Progress, spinner, skeleton"><Progress value={62} label="Upload" /><div className="lib-row"><Spinner /><Skeleton style={{ height: 16, width: 160 }} /></div></Card3>
        </div>
      </Sec>

      <Sec id="content" title="Content" intro="Cards, stats, tables, quotes, timelines and navigation helpers.">
        <div className="lib-grid">
          <Card3 title="Card"><Card>Static card</Card><Card interactive as="a" href="#content">Interactive card</Card></Card3>
          <Card3 title="Stat and avatar"><div className="lib-row"><Stat value="48" label="Frames" /><Stat value="6" label="Series" /><Avatar name="Jerry Qiu" /></div></Card3>
          <Card3 title="Pull quote"><Quote cite="Someone, who said it">A real quote goes here, set in the voice face.</Quote></Card3>
          <Card3 title="Timeline"><Timeline items={[{ title: "Role", org: "Company", period: "2025", summary: "What I did." }, { title: "School", period: "2021 to 2025" }]} /></Card3>
          <Card3 title="Navigation"><Breadcrumbs items={[{ label: "Portfolio", href: "#content" }, { label: "Theater" }]} /><Pagination page={2} pages={5} hrefFor={(p) => `#${p}`} /></Card3>
          <Card3 title="Table (studio, dense)"><Table><thead><tr><th scope="col">Invoice</th><th scope="col">Status</th></tr></thead><tbody><tr><td>0042</td><td className="hl3-mono">● PAID</td></tr><tr><td>0043</td><td className="hl3-mono">○ DUE</td></tr></tbody></Table></Card3>
          <Card3 title="Code" wide><CodeBlock code={'import { Colossal, FocusPull } from "@halation/ui/v3";'} language="ts" /></Card3>
        </div>
      </Sec>

      <Sec id="motion" title="Motion" intro="Building blocks, all DOM and CSS. Use the Replay buttons; switch tier in the bar to see each fall back.">
        <div className="lib-grid">
          <Card3 title="Line reveal"><Replay><Lines as="h3" lines={["Pictures of", "people at work."]} className="hl3-h2" /></Replay></Card3>
          <Card3 title="Colossal, per letter"><Replay><Colossal as="div" lines={["JERRY"]} size="md" split /></Replay></Card3>
          <Card3 title="Focus pull (opacity + transform only)"><Replay><div className="lib-photo"><FocusPull asset={P["jry0473"]} alt={P["jry0473"].alt} fill sizes="400px" /></div></Replay></Card3>
          <Card3 title="Marquee (60 s loop)" wide><Marquee words={["Photographer", "Builder", "Drone pilot", "Musician"]} /></Card3>
          <Card3 title="Cursor label (fine pointers)"><div className="lib-cursorzone" data-cursor="View">Hover here</div></Card3>
          <Card3 title="Scroll cue"><ScrollCue /></Card3>
          <Card3 title="Depth layers (scroll, and move the pointer)" wide>
            <div className="lib-depth lib-stage">
              {[
                ["jetblue-a220-300-1", -0.12, "6%", "10%", "22%"], ["2026-01-17-snow-7", 0.06, "30%", "30%", "30%"],
                ["10-19-2025-maker-faire-coney-island-2025-129-1", 0.2, "55%", "8%", "36%"],
              ].map(([id, d, l, t, w]) => (
                <figure key={id as string} data-depth={d as number} style={{ left: l as string, top: t as string, width: w as string, ["--d" as string]: d as number }}>
                  <span data-scatter style={{ display: "block" }}><Image asset={P[id as string]} alt="" sizes="30vw" /></span>
                </figure>
              ))}
            </div>
          </Card3>
        </div>
      </Sec>

      <Sec id="scenes" title="Scenes" intro="The larger compositions the sites are built from. Scroll through each one.">
        <div className="lib-grid" style={{ gridTemplateColumns: "1fr" }}>
          <Card3 title="Dissolve: hero reel (7 s, Ken Burns, controls)">
            <div className="lib-stage" style={{ height: "60vh", minHeight: 380 }}>
              <Dissolve label="Featured photographs" drift controls interval={7000}
                slides={slides.map((s) => <Image key={s.files[0].src} asset={s} alt={s.alt} fill sizes="100vw" />)}
                captions={slides.map((s) => s.alt)} />
            </div>
          </Card3>
          <Card3 title="Ambient wash: the page glows in the photograph's colors">
            <div className="lib-stage" style={{ padding: 40, minHeight: 320 }}>
              <AmbientWash images={slides.map((s) => s.blur)} active={wash} strength={0.55} />
              <div className="lib-row" style={{ marginBottom: 24 }}>
                {slides.map((s, i) => <Button key={i} variant={wash === i ? "accent" : "ghost"} onClick={() => setWash(i)}>Photo {i + 1}</Button>)}
              </div>
              <p className="hl3-voice" style={{ maxWidth: "28ch" }}>Color comes from the photograph, behind the text.</p>
            </div>
          </Card3>
          <Card3 title="Sticky stack (panels pin and are covered)">
            <StickyStack className="lib-stack lib-stage" label="Stack demo">
              {slides.slice(0, 3).map((s, i) => (
                <StackPanel key={i}>
                  <FocusPull asset={s} alt="" fill sizes="100vw" />
                  <div className="lib-panel" style={{ background: "linear-gradient(to top, rgb(0 0 0 / .6), transparent 60%)" }}>
                    <span className="hl3-mono">0{i + 1} / 03</span>
                    <Colossal as="div" lines={[["PHOTO", "MUSIC", "FLYING"][i]]} size="lg" />
                  </div>
                </StackPanel>
              ))}
            </StickyStack>
          </Card3>
          <Card3 title="Horizontal scroller (native, snap, arrow keys)" wide>
            <HScroller label="Selected work demo" count={4}>
              {slides.map((s, i) => (
                <a key={i} href="#scenes" style={{ display: "grid", gap: 8, color: "inherit", textDecoration: "none" }}>
                  <div style={{ aspectRatio: "16/10", position: "relative" }}><FocusPull asset={s} alt="" fill sizes="62vw" /></div>
                  <span className="hl3-mono">Photography · 2025</span>
                  <span className="hl3-h2">Case study {i + 1}</span>
                </a>
              ))}
            </HScroller>
          </Card3>
        </div>
        <div style={{ marginTop: 24 }}>
          <p className="lib-note" style={{ marginBottom: 12 }}>Sticky story (statement over a changing image, 300vh). Keep scrolling.</p>
          <StickyStory label="Statement demo" items={[
            { text: "I take pictures of people at work.", wash: P["jry0022-enhanced-nr"].blur, image: <FocusPull asset={P["jry0022-enhanced-nr"]} alt={P["jry0022-enhanced-nr"].alt} fill sizes="40vw" /> },
            { text: "I build the tools I wish existed.", wash: P["jry0126-enhanced-nr"].blur, image: <FocusPull asset={P["jry0126-enhanced-nr"]} alt={P["jry0126-enhanced-nr"].alt} fill sizes="40vw" /> },
            { text: "I fly small things and write music.", wash: P["jry0473"].blur, image: <FocusPull asset={P["jry0473"]} alt={P["jry0473"].alt} fill sizes="40vw" /> },
          ]} />
        </div>
      </Sec>

      <Sec id="chrome" title="Chrome" intro="Header (72 px, no index control), mobile menu sheet, and the footer whose site name bleeds off the edge.">
        <div className="lib-grid" style={{ gridTemplateColumns: "1fr" }}>
          <Card3 title="Header (resize below 760 px for the Menu sheet)">
            <div className="lib-fixedbox"><SiteHeader name="Jerry Qiu" links={links} current="#portfolio" overHero={false} /></div>
          </Card3>
          <Card3 title="Footer (photo and music: one return button only)">
            <div className="lib-fixedbox lib-fixedbox--footer">
              <SiteFooter word="PHOTO" note="© 2026 Jerry Qiu. All photographs © Jerry Qiu unless stated." returnHref="#chrome" />
            </div>
          </Card3>
        </div>
      </Sec>

      <Sec id="media" title="Media" intro="Responsive images with blur-up, the justified grid, and the lightbox. The photo-site Theatre lightbox and protection come next.">
        <div className="lib-grid" style={{ gridTemplateColumns: "1fr" }}>
          <Card3 title="Justified gallery (click for the lightbox)">
            <Gallery images={photoList} rowHeight={220} />
          </Card3>
          <Card3 title="Image"><div style={{ maxWidth: 520 }}><Image asset={P["2026-01-17-snow-7"]} alt={P["2026-01-17-snow-7"].alt} sizes="520px" /></div></Card3>
        </div>
      </Sec>
      <div style={{ height: 80 }} />
      {lb === null ? null : null}
    </div>
  );
}
