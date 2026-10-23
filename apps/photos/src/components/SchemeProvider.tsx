"use client";

import { IconButton, SunMoonIcon, Theme, Tooltip } from "@holominimal/ui";
import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from "react";
import { flushSync } from "react-dom";

/** Holominimal's three color schemes: Dark (the default), Dawn (warm) and Dusk (dark brightened with the accent). */
export type Scheme = "dark" | "dawn" | "dusk";
const SCHEMES: Scheme[] = ["dark", "dawn", "dusk"];
const KEY = "jq-scheme";

const Ctx = createContext<{ scheme: Scheme; setScheme: (s: Scheme) => void }>({ scheme: "dark", setScheme: () => {} });

/**
 * The page's Holominimal theme with a visitor-chosen color scheme, remembered in this browser only (localStorage, with
 * the page still working if it is unavailable). The first paint is Dark; a saved choice applies right after hydration.
 */
export function SchemeProvider({ children }: { children: ReactNode }) {
  const [scheme, setState] = useState<Scheme>("dark");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved && (SCHEMES as string[]).includes(saved)) setState(saved as Scheme);
    } catch {}
  }, []);
  const setScheme = useCallback((s: Scheme) => {
    try {
      localStorage.setItem(KEY, s);
    } catch {}
    // the whole page cross-fades to the new theme, unless the visitor asked for reduced motion
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (doc.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches)
      doc.startViewTransition(() => flushSync(() => setState(s)));
    else setState(s);
  }, []);
  return (
    <Ctx value={{ scheme, setScheme }}>
      <Theme theme={{ accent: "blue", scheme }}>{children}</Theme>
    </Ctx>
  );
}

export const useScheme = () => useContext(Ctx);

const MODE = { dark: "moon", dawn: "dawn", dusk: "sun" } as const;
const LABEL = { dark: "Dark", dawn: "Dawn", dusk: "Dusk" } as const;

/** One button that cycles Dark, Dawn and Dusk; its icon morphs into each theme (Holominimal's sun and moon). */
export function SchemeSwitch({ className }: { className?: string }) {
  const { scheme, setScheme } = useScheme();
  const next = SCHEMES[(SCHEMES.indexOf(scheme) + 1) % SCHEMES.length] ?? "dark";
  return (
    <Tooltip content={`Theme: ${LABEL[scheme]}. Switch to ${LABEL[next]}`}>
      <IconButton
        variant="secondary"
        className={className}
        aria-label={`Color theme: ${LABEL[scheme]}. Switch to ${LABEL[next]}`}
        onClick={() => setScheme(next)}
      >
        <SunMoonIcon mode={MODE[scheme]} />
      </IconButton>
    </Tooltip>
  );
}
