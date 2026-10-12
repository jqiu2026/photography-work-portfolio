import type { ElementType, ReactNode } from "react";
import { cx } from "./cx";
import { BrandIcon } from "./icons";
import { Eyebrow, Heading, Text } from "./typography";

export type SocialLink = { label: string; href: string; icon: string };

/** Social/account links. `rel="me"` lets other sites verify the identity link. */
export function SocialLinks({ links, variant = "labels", className }: { links: SocialLink[]; variant?: "labels" | "icons"; className?: string }) {
  return (
    <ul className={cx("ph-social", `ph-social--${variant}`, className)}>
      {links.map((l) => (
        <li key={l.href}>
          <a href={l.href} rel="me noopener noreferrer" target={l.href.startsWith("mailto:") ? undefined : "_blank"} aria-label={variant === "icons" ? l.label : undefined}>
            <BrandIcon name={l.icon} />
            {variant === "labels" ? <span>{l.label}</span> : null}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function SkillTags({ tags, className }: { tags: string[]; className?: string }) {
  return (
    <ul className={cx("ph-tags", className)}>
      {tags.map((t) => <li key={t}>{t}</li>)}
    </ul>
  );
}

/** Portrait, name, headline, location, "currently" line and social links. No Jerry-specific content lives here. */
export function ProfileHeader({ portrait, name, headline, location, currently, links, actions, className }: { portrait?: ReactNode; name: string; headline: string; location?: string; currently?: string; links?: SocialLink[]; actions?: ReactNode; className?: string }) {
  return (
    <header className={cx("ph-profile", className)}>
      {portrait ? <div className="ph-profile__portrait">{portrait}</div> : null}
      <div className="ph-profile__body">
        {location ? <Eyebrow>{location}</Eyebrow> : null}
        <Heading as="h1" size="display" display>{name}</Heading>
        <Text size="xl" className="ph-profile__headline">{headline}</Text>
        {currently ? <Text tone="muted" className="ph-profile__now"><span className="ph-dot" aria-hidden /> {currently}</Text> : null}
        {actions ? <div className="ph-profile__actions">{actions}</div> : null}
        {links?.length ? <SocialLinks links={links} /> : null}
      </div>
    </header>
  );
}

export type TimelineItem = { title: string; org?: string; period: string; summary?: ReactNode; category?: string };
/** Vertical timeline: work, school, leadership, flying, music. */
export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <ol className={cx("ph-timeline", className)}>
      {items.map((it) => (
        <li key={`${it.title}-${it.period}`} className="ph-timeline__item">
          <p className="ph-timeline__period">{it.period}</p>
          <div>
            <h3 className="ph-timeline__title">{it.title}{it.org ? <span> · {it.org}</span> : null}</h3>
            {it.summary ? <div className="ph-timeline__summary">{it.summary}</div> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function SitePreviewCard({ title, description, href, image, as: As = "a", className }: { title: string; description: string; href: string; image?: ReactNode; as?: ElementType; className?: string }) {
  return (
    <As href={href} className={cx("ph-preview", className)}>
      {image ? <div className="ph-preview__media">{image}</div> : null}
      <div className="ph-preview__body">
        <h3>{title}</h3>
        <p>{description}</p>
        <span className="ph-preview__go" aria-hidden>Visit →</span>
      </div>
    </As>
  );
}

/** Opening block for the music and flying sites (interest-site template). */
export function InterestHero({ eyebrow, title, intro, media, actions }: { eyebrow?: string; title: string; intro?: string; media?: ReactNode; actions?: ReactNode }) {
  return (
    <section className="ph-interest">
      <div className="ph-interest__text">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <Heading as="h1" size="display" display>{title}</Heading>
        {intro ? <Text size="xl" tone="muted">{intro}</Text> : null}
        {actions ? <div className="ph-profile__actions">{actions}</div> : null}
      </div>
      {media ? <div className="ph-interest__media">{media}</div> : null}
    </section>
  );
}

export function ResumeButton({ href, label = "Download résumé (PDF)" }: { href: string; label?: string }) {
  return <a className="ph-btn ph-btn--ghost ph-btn--md" href={href} download><span>{label}</span></a>;
}
