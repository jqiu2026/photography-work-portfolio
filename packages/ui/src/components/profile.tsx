import type { ElementType, ReactNode } from "react";
import { cx } from "./cx";
import { BrandIcon } from "./icons";
import { Eyebrow, Heading, Text } from "./typography";

export type SocialLink = { label: string; href: string; icon: string };

/** Social/account links. `rel="me"` lets other sites verify the identity link. */
export function SocialLinks({
  links,
  variant = "labels",
  className,
}: { links: SocialLink[]; variant?: "labels" | "icons"; className?: string }) {
  return (
    <ul className={cx("hl-social", `hl-social--${variant}`, className)}>
      {links.map((l) => (
        <li key={l.href}>
          <a
            href={l.href}
            rel="me noopener noreferrer"
            target={l.href.startsWith("mailto:") ? undefined : "_blank"}
            aria-label={variant === "icons" ? l.label : undefined}
          >
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
    <ul className={cx("hl-tags", className)}>
      {tags.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}

/** Portrait, name, headline, location, "currently" line and social links. No Jerry-specific content lives here. */
export function ProfileHeader({
  portrait,
  name,
  nameAs = "h1",
  nameSize = "display",
  stacked,
  headline,
  location,
  currently,
  links,
  actions,
  className,
}: {
  portrait?: ReactNode;
  name: string;
  nameAs?: ElementType;
  nameSize?: "3xl" | "4xl" | "display";
  stacked?: boolean;
  headline: string;
  location?: string;
  currently?: string;
  links?: SocialLink[];
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cx("hl-profile", stacked && "hl-profile--stacked", className)}>
      {portrait ? <div className="hl-profile__portrait">{portrait}</div> : null}
      <div className="hl-profile__body">
        {location ? <Eyebrow>{location}</Eyebrow> : null}
        <Heading as={nameAs} size={nameSize} display>
          {name}
        </Heading>
        <Text size="xl" className="hl-profile__headline">
          {headline}
        </Text>
        {currently ? (
          <Text tone="muted" className="hl-profile__now">
            <span className="hl-dot" aria-hidden /> {currently}
          </Text>
        ) : null}
        {actions ? <div className="hl-profile__actions">{actions}</div> : null}
        {links?.length ? <SocialLinks links={links} /> : null}
      </div>
    </header>
  );
}

export type TimelineItem = { title: string; org?: string; period: string; summary?: ReactNode; category?: string };
/** Vertical timeline: work, school, leadership, flying, music. */
export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <ol className={cx("hl-timeline", className)}>
      {items.map((it) => (
        <li key={`${it.title}-${it.period}`} className="hl-timeline__item">
          <p className="hl-timeline__period">{it.period}</p>
          <div>
            <h3 className="hl-timeline__title">
              {it.title}
              {it.org ? <span> · {it.org}</span> : null}
            </h3>
            {it.summary ? <div className="hl-timeline__summary">{it.summary}</div> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
