"use client";

import { Container, Heading, Text, Eyebrow, Card } from "@placeholder/ui";
import { Image, Gallery, BeforeAfter, type ImageAsset } from "@placeholder/ui/media";
import { CountUp, InView, Marquee, Parallax, PinnedScene, RevealText, ScrollHighlight, StepSequence, TiltCard, MagneticButton, StackingCards, ScrollProgress } from "@placeholder/ui/motion";
import { Button } from "@placeholder/ui";

type Manifest = Record<string, ImageAsset>;

export function MotionGallery({ manifest }: { manifest: Manifest }) {
  const ids = Object.keys(manifest);
  const pick = (n: number) => ids.slice(0, n).map((id) => ({ ...manifest[id], alt: `Sample photograph ${id}` }));
  const hero = manifest[ids[3]] ?? manifest[ids[0]];
  return (
    <div className="ph-root" data-preset="hub" data-theme="light" style={{ minHeight: 0, borderRadius: 20, border: "1px solid var(--ph-line)", overflow: "clip", marginTop: 40 }}>
      <ScrollProgress />
      <Container size="md" style={{ paddingBlock: "3rem" }}>
        <Eyebrow>Motion and media</Eyebrow>
        <RevealText as="h2" text="Words rise out of a quiet mask." className="ph-heading ph-heading--display" />
        <div style={{ height: 24 }} />
        <ScrollHighlight text="I take photos, write code and I'm learning to fly. Most of what I make starts as a small question and a camera." className="ph-text" />
        <div style={{ height: 40 }} />
        <div style={{ display: "flex", gap: 48 }}>
          <div><div className="ph-stat__value"><CountUp to={23} /></div><Text size="sm" tone="muted">photos</Text></div>
          <div><div className="ph-stat__value"><CountUp to={5} /></div><Text size="sm" tone="muted">projects</Text></div>
          <MagneticButton><Button>Magnetic</Button></MagneticButton>
        </div>
        <div style={{ height: 40 }} />
        <InView><Card>InView card lifts into place once.</Card></InView>
        <div style={{ height: 24 }} />
        <div style={{ maxWidth: 360 }}><TiltCard><Card interactive>Tilts toward the pointer (mouse only).</Card></TiltCard></div>
        <div style={{ height: 24 }} />
        <Marquee speed={30}>{["Photography", "Music", "Flying", "Writing", "Code"].map((w) => <span key={w} className="ph-heading ph-heading--display" style={{ fontSize: "var(--ph-text-3xl)" }}>{w}</span>)}</Marquee>
        <div style={{ height: 40 }} />
        <Gallery images={pick(8)} rowHeight={220} />
        <div style={{ height: 40 }} />
        <div style={{ maxWidth: 560 }}>
          <BeforeAfter before={<Image asset={hero} alt="Before" sizes="560px" />} after={<Image asset={hero} alt="After" sizes="560px" style={{ filter: "grayscale(1) contrast(1.1)" }} />} />
        </div>
        <div style={{ height: 40 }} />
        <Parallax speed={0.2}><Image asset={manifest[ids[1]]} alt="Parallax sample" sizes="900px" /></Parallax>
      </Container>
      <PinnedScene length={3} label="Pinned scene demo">
        <div style={{ height: "100%", display: "grid", placeItems: "center", background: "var(--ph-surface)", padding: "0 var(--ph-gutter)" }}>
          <div style={{ width: "min(60rem, 100%)" }}>
            <Eyebrow>Pinned scene</Eyebrow>
            <StepSequence steps={[{ title: "A camera first.", body: "Photography came before anything else." }, { title: "Then code.", body: "Building small tools and sites." }, { title: "Now the sky.", body: "Learning to fly." }]} />
          </div>
        </div>
      </PinnedScene>
      <Container size="md" style={{ paddingBlock: "3rem" }}>
        <StackingCards items={[1, 2, 3].map((n) => <Card key={n} style={{ minHeight: 220 }}><Heading size="2xl" display>Card {n}</Heading></Card>)} />
      </Container>
    </div>
  );
}
