"use client";

import { ChevronDown, Menu as MenuIcon, Moon, Sun } from "lucide-react";
import { useEffect, useState, type CSSProperties, type ElementType, type ReactNode } from "react";
import { cx } from "./cx";
import { IconButton } from "./Button";
import { Popover, Sheet } from "./overlays";
import { useTheme } from "./ThemeProvider";

export type NavLink = { label: string; href: string; current?: boolean };
export type SiteEntry = {
  id: string;
  name: string;
  description: string;
  url: string;
  color?: "blue" | "red" | "green" | "yellow";
};

export function SkipLink({ href = "#main", children = "Skip to content" }: { href?: string; children?: ReactNode }) {
  return (
    <a href={href} className="ph-skip">
      {children}
    </a>
  );
}

export function ThemeToggle() {
  const { theme, setChoice } = useTheme();
  return (
    <IconButton
      label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setChoice(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </IconButton>
  );
}

/** Quiet wordmark with a chevron that lists every site in the family. */
export function SiteSwitcher({
  sites,
  currentId,
  label = "Jerry Qiu",
}: { sites: SiteEntry[]; currentId: string; label?: string }) {
  return (
    <Popover
      trigger={
        <button type="button" className="ph-switcher">
          <span>{label}</span>
          <ChevronDown size={14} aria-hidden />
          <span className="ph-sr-only">Switch site</span>
        </button>
      }
    >
      <nav aria-label="All sites" className="ph-switcher__list">
        {sites.map((s) => (
          <a
            key={s.id}
            href={s.url}
            aria-current={s.id === currentId ? "page" : undefined}
            className="ph-switcher__item"
            style={s.color ? ({ "--site": `var(--ph-${s.color})` } as CSSProperties) : undefined}
          >
            <strong>{s.name}</strong>
            <span>{s.description}</span>
          </a>
        ))}
      </nav>
    </Popover>
  );
}

/** Header: transparent over hero, turns to a glass bar after scroll. Mobile navigation opens a sheet. */
export function Header({
  brand,
  links,
  actions,
  linkAs: LinkAs = "a",
  transparentTop = true,
}: { brand: ReactNode; links: NavLink[]; actions?: ReactNode; linkAs?: ElementType; transparentTop?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={cx("ph-header", scrolled || !transparentTop ? "ph-header--solid" : "ph-header--over")}>
      <div className="ph-header__inner">
        <div className="ph-header__brand">{brand}</div>
        <nav aria-label="Primary" className="ph-header__nav">
          {links.map((l) => (
            <LinkAs key={l.label} href={l.href} aria-current={l.current ? "page" : undefined}>
              {l.label}
            </LinkAs>
          ))}
        </nav>
        <div className="ph-header__actions">
          {actions}
          <Sheet
            title="Menu"
            side="right"
            trigger={
              <IconButton label="Open menu" className="ph-header__burger">
                <MenuIcon size={20} />
              </IconButton>
            }
          >
            <nav aria-label="Mobile" className="ph-mobilenav">
              {links.map((l) => (
                <a key={l.label} href={l.href} aria-current={l.current ? "page" : undefined}>
                  {l.label}
                </a>
              ))}
            </nav>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export function TableOfContents({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id);
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-30% 0px -60% 0px" },
    );
    for (const i of items) {
      const el = document.getElementById(i.id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, [items]);
  return (
    <nav aria-label="On this page" className="ph-toc">
      <ul>
        {items.map((i) => (
          <li key={i.id}>
            <a href={`#${i.id}`} aria-current={active === i.id ? "location" : undefined}>
              {i.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
