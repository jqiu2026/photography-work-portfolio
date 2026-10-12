"use client";

import { Container, Heading, Text, Eyebrow, Card } from "@halation/ui";
import { Image, Gallery, BeforeAfter, ImageSequence, type ImageAsset } from "@halation/ui/media";
import { ShaderHero } from "@halation/ui/webgl";
import {
  CountUp,
  InView,
  Marquee,
  Parallax,
  PinnedScene,
  RevealText,
  ScrollHighlight,
  StepSequence,
  TiltCard,
  MagneticButton,
  StackingCards,
  ScrollProgress,
} from "@halation/ui/motion";
import { Button } from "@halation/ui";

type Manifest = Record<string, ImageAsset>;
const frames = Array.from({ length: 96 }, (_, i) => `/sequence/hero/frame-${String(i).padStart(3, "0")}.webp`);

export function MotionGallery({ manifest }: { manifest: Manifest }) {
  const ids = Object.keys(manifest);
  const pick = (n: number) => ids.slice(0, n).map((id) => ({ ...manifest[id], alt: `Sample photograph ${id}` }));
  const hero = manifest[ids[3]] ?? manifest[ids[0]];
  return (
    <div
      className="hl-root"
      data-preset="hub"
      data-theme="light"
      style={{ minHeight: 0, borderRadius: 20, border: "1px solid var(--hl-line)", overflow: "clip", marginTop: 40 }}
    >
      <ScrollProgress />
      <ShaderHero src={hero.files[hero.files.length - 1].src} alt="Sample hero photograph" className="demo-hero">
        <div
          style={{
            height: "70vh",
            display: "flex",
            alignItems: "flex-end",
            padding: "var(--hl-gutter)",
            color: "#fff",
          }}
        >
          <Heading as="h2" size="4xl" display>
            WebGL hero
          </Heading>
        </div>
      </ShaderHero>
      <Container size="md" style={{ paddingBlock: "3rem" }}>
        <Eyebrow>Motion and media</Eyebrow>
        <RevealText as="h2" text="Words rise out of a quiet mask." className="hl-heading hl-heading--display" />
        <div style={{ height: 24 }} />
        <ScrollHighlight
          text="I take photos, write code and I'm learning to fly. Most of what I make starts as a small question and a camera."
          className="hl-text"
        />
        <div style={{ height: 40 }} />
        <div style={{ display: "flex", gap: 48 }}>
          <div>
            <div className="hl-stat__value">
              <CountUp to={23} />
            </div>
            <Text size="sm" tone="muted">
              photos
            </Text>
          </div>
          <div>
            <div className="hl-stat__value">
              <CountUp to={5} />
            </div>
            <Text size="sm" tone="muted">
              projects
            </Text>
          </div>
          <MagneticButton>
            <Button>Magnetic</Button>
          </MagneticButton>
        </div>
        <div style={{ height: 40 }} />
        <InView>
          <Card>InView card lifts into place once.</Card>
        </InView>
        <div style={{ height: 24 }} />
        <div style={{ maxWidth: 360 }}>
          <TiltCard>
            <Card interactive>Tilts toward the pointer (mouse only).</Card>
          </TiltCard>
        </div>
        <div style={{ height: 24 }} />
        <Marquee speed={30}>
          {["Photography", "Music", "Flying", "Writing", "Code"].map((w) => (
            <span key={w} className="hl-heading hl-heading--display" style={{ fontSize: "var(--hl-text-3xl)" }}>
              {w}
            </span>
          ))}
        </Marquee>
        <div style={{ height: 40 }} />
        <Gallery images={pick(8)} rowHeight={220} />
        <div style={{ height: 40 }} />
        <div style={{ maxWidth: 560 }}>
          <BeforeAfter
            before={<Image asset={hero} alt="Before" sizes="560px" />}
            after={<Image asset={hero} alt="After" sizes="560px" style={{ filter: "grayscale(1) contrast(1.1)" }} />}
          />
        </div>
        <div style={{ height: 40 }} />
        <Parallax speed={0.2}>
          <Image asset={manifest[ids[1]]} alt="Parallax sample" sizes="900px" />
        </Parallax>
      </Container>
      <PinnedScene length={3} label="Pinned scene demo">
        <div
          style={{
            height: "100%",
            display: "grid",
            placeItems: "center",
            background: "var(--hl-surface)",
            padding: "0 var(--hl-gutter)",
          }}
        >
          <div style={{ width: "min(60rem, 100%)" }}>
            <Eyebrow>Pinned scene</Eyebrow>
            <StepSequence
              steps={[
                { title: "A camera first.", body: "Photography came before anything else." },
                { title: "Then code.", body: "Building small tools and sites." },
                { title: "Now the sky.", body: "Learning to fly." },
              ]}
            />
          </div>
        </div>
      </PinnedScene>
      <PinnedScene length={4} label="Sequence demo">
        <div style={{ height: "100%", position: "relative" }}>
          <ImageSequence frames={frames} alt="Placeholder image sequence" />
        </div>
      </PinnedScene>
      <Container size="md" style={{ paddingBlock: "3rem" }}>
        <StackingCards
          items={[1, 2, 3].map((n) => (
            <Card key={n} style={{ minHeight: 220 }}>
              <Heading size="2xl" display>
                Card {n}
              </Heading>
            </Card>
          ))}
        />
      </Container>
    </div>
  );
}
