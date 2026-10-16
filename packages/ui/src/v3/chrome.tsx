import type { ReactNode } from "react";
import { ThemeToggle } from "../components/navigation";
import { Colossal } from "./components";
import { MobileMenu } from "./MobileMenu";
import { MotionToggle } from "./Runtime";

export type NavLink = { label: string; href: string };

/** 72 px header: wordmark left, text links, theme button and (mobile) a menu sheet. No index control, no progress ring. */
export function SiteHeader({
  name,
  homeHref = "/",
  links,
  current,
  overHero = true,
}: { name: string; homeHref?: string; links: NavLink[]; current?: string; overHero?: boolean }) {
  return (
    <header className="hl3-header" data-over-hero={overHero ? "" : undefined}>
      <a className="hl3-header__mark" href={homeHref}>
        {name}
      </a>
      <nav className="hl3-header__nav" aria-label="Primary">
        {links.map((l) => (
          <a key={l.href} href={l.href} aria-current={current === l.href ? "page" : undefined}>
            {l.label}
          </a>
        ))}
      </nav>
      <div className="hl3-header__tools">
        <ThemeToggle />
        <MobileMenu links={links} current={current} />
      </div>
    </header>
  );
}

/**
 * Footer: the site name in colossal type bleeding off the bottom edge (decorative), above small columns. Photo and music
 * pass a single `returnHref` and nothing else cross-site (cross-site rule, Q45).
 */
export function SiteFooter({
  word,
  note,
  columns,
  returnHref,
  children,
}: {
  word: string;
  note: string;
  columns?: { title: string; links: NavLink[] }[];
  returnHref?: string;
  children?: ReactNode;
}) {
  return (
    <footer className="hl3-footer">
      <div className="hl3-wrap hl3-footer__cols">
        {columns?.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h2 className="hl3-mono">{c.title}</h2>
            <ul>
              {c.links.map((l) => (
                <li key={l.href}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <div className="hl3-footer__meta">
          <p>{note}</p>
          {children}
          <MotionToggle className="hl3-footer__motion" />
          {returnHref ? (
            <a className="hl3-btn hl3-btn--ghost hl-return" href={returnHref} data-return-to-hub>
              <span>jerryqiu.com</span>
              <i aria-hidden className="hl3-arrow">
                →
              </i>
            </a>
          ) : null}
        </div>
      </div>
      <div className="hl3-footer__word" aria-hidden>
        <Colossal as="div" lines={[word]} size="xl" />
      </div>
    </footer>
  );
}
