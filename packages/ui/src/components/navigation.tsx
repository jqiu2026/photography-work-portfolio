"use client";

import { ChevronDown, Menu as MenuIcon, Moon, Sun } from "lucide-react";
import {
  Suspense,
  lazy,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";
import { cx } from "./cx";
import { IconButton } from "./Button";
import { useTheme } from "./ThemeProvider";

// The mobile menu sheet pulls in Radix Dialog; load it only when the menu is opened.
const LazySheet = lazy(() => import("./overlays").then((m) => ({ default: m.Sheet })));

export function SkipLink({ href = "#main", children = "Skip to content" }: { href?: string; children?: ReactNode }) {
  return (
    <a href={href} className="hl-skip">
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
    <nav aria-label="On this page" className="hl-toc">
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
