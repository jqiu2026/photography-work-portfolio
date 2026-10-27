import type { Metadata } from "next";
import NextLink from "next/link";
import { PageHeader } from "@/components/site/PageHeader";
import { Button, Tag } from "@/components/site/ui";
import { managed } from "@/content/about";
import { person as staticPerson } from "@/content/site";
import { getImage, srcSet } from "@/lib/images";
import { getPerson } from "@/lib/profile";

export const metadata: Metadata = {
  title: "About",
  description: `About ${staticPerson.name}: background, skills and where to find me.`,
};

export default async function About() {
  const { person, socials, timeline, skills, skillTags, intro } = await getPerson();
  const portrait = getImage("site", "avatar");
  return (
    <div>
      <PageHeader eyebrow="About" title={person.name} intro={person.headline} />
      <div className="hb-wrap hb-section hb-about">
        <div className="hb-stack">
          <p className="hb-mono" style={{ margin: 0 }}>
            {person.location} · {person.languages.join(", ")}
          </p>
          {person.currently ? (
            <p style={{ margin: 0 }}>
              <span className="hb-muted">Right now: </span>
              {person.currently}
            </p>
          ) : null}
          <ul className="hb-social" aria-label="Elsewhere">
            {socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}>
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
          <div>
            <Button asChild>
              <NextLink href="/connect">Get in touch</NextLink>
            </Button>
          </div>
        </div>
        <figure className="hb-portrait">
          <img
            src={portrait.files[0].src}
            srcSet={srcSet(portrait)}
            sizes="(min-width: 860px) 16rem, 60vw"
            width={portrait.width}
            height={portrait.height}
            alt={`Portrait of ${person.name}`}
            style={{ backgroundColor: portrait.color }}
          />
        </figure>
      </div>

      <div className="hb-wrap hb-section">
        <h2 className="hb-h2">Introduction</h2>
        {/* TODO(owner): rewrite in your own voice (first person) */}
        <p className="hb-lede">{intro}</p>
      </div>

      <div className="hb-wrap hb-section">
        <h2 className="hb-h2">Timeline</h2>
        <ul className="hb-timeline">
          {timeline.map((t) => (
            <li key={`${t.title}-${t.period}`}>
              <span className="hb-mono">{t.period}</span>
              <strong>{t.title}</strong>
              {t.org ? <span className="hb-muted">{t.org}</span> : null}
              {t.summary ? <span>{t.summary}</span> : null}
            </li>
          ))}
        </ul>
      </div>

      <div className="hb-wrap hb-section hb-stack">
        <h2 className="hb-h2">Skills and interests</h2>
        {skillTags.length ? (
          <div className="hb-tags">
            {skillTags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        ) : null}
        {skills.length ? (
          <div className="hb-two">
            {skills.map((s) => (
              <div key={s.title} className="hb-stack">
                <h3 style={{ margin: 0, fontSize: "var(--hm-text-lg)" }}>{s.title}</h3>
                <p className="hb-muted" style={{ margin: 0 }}>
                  {s.body}
                </p>
                <div className="hb-tags">
                  {s.tags.map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}
        <h3 style={{ margin: "2rem 0 0", fontSize: "var(--hm-text-lg)" }}>Accounts I manage</h3>
        <ul className="hb-list">
          {managed.map((m) => (
            <li key={m.href}>
              <a className="hb-link" href={m.href} rel="noopener noreferrer">
                {m.label}
              </a>
              <span className="hb-muted">({m.period})</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
