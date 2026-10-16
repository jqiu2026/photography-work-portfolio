"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Preset, Theme } from "../tokens";
import { KEY } from "./ThemeScript";

type Choice = Theme | "system";
type Ctx = { choice: Choice; theme: Theme; preset: Preset; setChoice: (c: Choice) => void };

const ThemeContext = createContext<Ctx | null>(null);

export function ThemeProvider({
  preset = "hub",
  defaultTheme = "system",
  children,
}: { preset?: Preset; defaultTheme?: Theme | "system"; children: ReactNode }) {
  const [choice, setChoiceState] = useState<Choice>(defaultTheme);
  const [theme, setTheme] = useState<Theme>("light");

  const resolve = useCallback((c: Choice): Theme => {
    if (c !== "system") return c;
    return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }, []);

  useEffect(() => {
    let stored: Choice = defaultTheme;
    try {
      stored = (localStorage.getItem(KEY) as Choice) || defaultTheme;
    } catch {}
    setChoiceState(stored);
    setTheme(resolve(stored));
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if ((localStorage.getItem(KEY) || defaultTheme) === "system") {
        const t = resolve("system");
        setTheme(t);
        document.documentElement.setAttribute("data-theme", t);
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [resolve, defaultTheme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-preset", preset);
  }, [preset]);

  const setChoice = useCallback(
    (c: Choice) => {
      setChoiceState(c);
      const t = resolve(c);
      setTheme(t);
      document.documentElement.setAttribute("data-theme", t);
      try {
        localStorage.setItem(KEY, c);
      } catch {}
    },
    [resolve],
  );

  const value = useMemo(() => ({ choice, theme, preset, setChoice }), [choice, theme, preset, setChoice]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
