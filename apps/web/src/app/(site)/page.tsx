import { Button, Container, Heading, Eyebrow, Grid, Avatar, ProfileHeader, SitePreviewCard, Section, Text } from "@placeholder/ui";
import { Image } from "@placeholder/ui/media";
import { ImageSequence } from "@placeholder/ui/media";
import { HorizontalShowcase, InView, PinnedScene, RevealText, ScrollHighlight, StepSequence } from "@placeholder/ui/motion";
import { ShaderHero } from "@placeholder/ui/webgl";
import { getSite } from "@jerryqiu/sites";
import NextLink from "next/link";
import type { Metadata } from "next";
import { SiteShell } from "@/components/site/SiteShell";
import "@/components/home/home.css";
import { person, socials, todo } from "@/content/site";
import { getImage } from "@/lib/images";
import { getProjects, getWriting, imageId, projectCover } from "@/lib/content";

export const metadata: Metadata = { title: { absolute: "Jerry Qiu" }, description: "Photographs, projects and writing by Jerry Qiu, a photographer and builder in New York." };

const frames = Array.from({ length: 96 }, (_, i) => `/sequence/hero/frame-${String(i).padStart(3, "0")}.webp`);
const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" });

export default function Home() {
  const hero = getImage("gallery", "jry0126-enhanced-nr");
  const heroFiles = [...hero.files].sort((a, b) => a.width - b.width);
  const heroSrc = (heroFiles.find((f) => f.width >= 1600) ?? heroFiles[heroFiles.length - 1]).src;
  const portrait = getImage("site", "avatar");
  const projects = getProjects().filter((p) => projectCover(p)).slice(0, 6);
  const posts = getWriting().slice(0, 3);

  // TODO(owner): rewrite these beats in your voice. Facts come from the original About page.
  const steps = [
    { title: "I take photographs.", body: "Events, theatre and street, mostly around New York." },
    { title: "I build things.", body: "Python, Lua and the web: small tools and sites." },
    { title: "I fly drones.", body: "I'm a certified drone pilot (FAA Part 107)." },
    { title: "I play music.", body: todo("a line about the music you play") },
  ].filter((s): s is { title: string; body: string } => !!s.body);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name,
    url: getSite("hub").url,
    image: `${getSite("hub").url}${getImage("site", "avatar").files.at(-1)?.src ?? ""}`,
    sameAs: socials.filter((s) => s.href.startsWith("http")).map((s) => s.href),
  };

  return (
    <SiteShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="home-hero" style={{ marginTop: "-68px", paddingTop: "calc(68px + 0.5rem)" }}>
        <ShaderHero src={heroSrc} srcSet={heroFiles.map((f) => `${f.src} ${f.width}w`).join(", ")} sizes="100vw" alt="A person seen from behind, standing next to a video camera on a tripod." className="home-hero__frame" intensity={1}>
          <div className="home-hero__inner">
            <Eyebrow>{person.name} · {person.location}</Eyebrow>
            <RevealText as="h1" text="Hello, I'm Jerry." className="ph-heading ph-heading--display" delay={0.15} />
            <div className="home-hero__meta">
              <span>Photograph by {person.name}</span>
              <span className="home-scroll" aria-hidden>Scroll ↓</span>
            </div>
          </div>
        </ShaderHero>
      </div>

      <Section className="home-profile" as="section">
        <Container>
          <div className="home-profile__grid">
            <ProfileHeader
              stacked
              nameAs="h2"
              nameSize="4xl"
              portrait={<Image asset={portrait} alt={`Portrait of ${person.name}`} sizes="320px" style={{ borderRadius: "var(--ph-radius-lg)" }} />}
              name={person.name}
              headline={person.headline}
              location={person.location}
              currently={person.currently}
              links={socials}
              actions={<><Button as={NextLink} href="/about" variant="solid">About me</Button><Button as={NextLink} href="/work" variant="ghost">See my work</Button></>}
            />
            <ScrollHighlight className="home-intro" text="Photography is how I started, and it is still how I pay attention. I make pictures of people at work, then spend a long time trying to make them honest." />
          </div>
        </Container>
      </Section>

      <PinnedScene length={Math.max(3, steps.length + 1)} label="A few things about me" className="home-scene-wrap">
        <div className="home-scene">
          <div className="home-scene__media"><ImageSequence frames={frames} alt="" /></div>
          <div className="home-scene__text">
            <div>
              <Eyebrow>A few things about me</Eyebrow>
              <StepSequence steps={steps} />
            </div>
          </div>
        </div>
      </PinnedScene>

      <Section>
        <Container>
          <div className="home-head">
            <div><Eyebrow>More rooms</Eyebrow><Heading size="4xl" display>Elsewhere</Heading></div>
            <Text tone="muted" style={{ maxWidth: "34ch" }}>Photography, music and flying each have a small site of their own.</Text>
          </div>
          <Grid min="17rem" gap={6}>
            {([
              ["photos", "Photography", "The portfolio: events, theatre and street.", getImage("gallery", "jry1082")],
              ["music", "Music", "What I play and where to hear it.", getImage("gallery", "jry0473")],
              ["flying", "Flying", "Notes on learning to fly.", getImage("gallery", "jetblue-a220-300-1")],
            ] as const).map(([id, title, text, img]) => (
              <InView key={id}>
                <SitePreviewCard title={title} description={text} href={getSite(id).url} image={<Image asset={img} alt="" sizes="(min-width: 900px) 30vw, 90vw" fill />} />
              </InView>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section tone="surface" style={{ paddingBottom: 0 }}>
        <Container>
          <div className="home-head" style={{ marginBottom: 0 }}>
            <div><Eyebrow>Selected work</Eyebrow><Heading size="4xl" display>Recent projects</Heading></div>
            <Button as={NextLink} href="/work" variant="ghost">All work</Button>
          </div>
        </Container>
        <HorizontalShowcase>
          {projects.map((p) => {
            const cover = projectCover(p);
            return (
              <NextLink key={p.slug} href={`/work/${p.slug}`} className="home-work-card">
                {cover ? <Image asset={getImage(cover.group, cover.id)} alt="" sizes="(min-width: 900px) 34rem, 78vw" /> : null}
                <h3>{p.metadata.title}</h3>
                <p>{[fmt(p.metadata.publishedAt), p.metadata.summary].filter(Boolean).join(" · ")}</p>
              </NextLink>
            );
          })}
        </HorizontalShowcase>
      </Section>

      <Section>
        <Container size="md">
          <div className="home-head"><div><Eyebrow>Writing</Eyebrow><Heading size="4xl" display>Notes</Heading></div><Button as={NextLink} href="/writing" variant="ghost">All writing</Button></div>
          <div className="home-writing">
            {posts.map((p) => (
              <NextLink key={p.slug} href={`/writing/${p.slug}`}>
                <time dateTime={p.metadata.publishedAt}>{fmt(p.metadata.publishedAt)}</time>
                <div><h3>{p.metadata.title}</h3>{p.metadata.summary ? <p>{p.metadata.summary}</p> : null}</div>
              </NextLink>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="surface" className="home-close">
        <Container>
          <RevealText as="h2" text="Say hello." className="ph-heading ph-heading--display" />
          <div className="ph-profile__actions">
            <Button as={NextLink} href="/connect" size="lg">Get in touch</Button>
            <Button as="a" href={`mailto:${person.email}`} variant="ghost" size="lg">{person.email}</Button>
          </div>
        </Container>
      </Section>
    </SiteShell>
  );
}
