"use client";

import { Segment, SegmentedControl, Theme } from "@holominimal/ui";
import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from "react";

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
    setState(s);
    try {
      localStorage.setItem(KEY, s);
    } catch {}
  }, []);
  return (
    <Ctx value={{ scheme, setScheme }}>
      <Theme theme={{ accent: "blue", scheme }}>{children}</Theme>
    </Ctx>
  );
}

export const useScheme = () => useContext(Ctx);

/** Dark, Dawn or Dusk. */
export function SchemeSwitch({ className }: { className?: string }) {
  const { scheme, setScheme } = useScheme();
  return (
    <SegmentedControl
      aria-label="Color theme"
      value={scheme}
      onValueChange={(v) => setScheme(v as Scheme)}
      className={className}
    >
      <Segment value="dark">Dark</Segment>
      <Segment value="dawn">Dawn</Segment>
      <Segment value="dusk">Dusk</Segment>
    </SegmentedControl>
  );
}
