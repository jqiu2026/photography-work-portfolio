"use client";

export type Preset = "hub" | "photos" | "music" | "flying" | "make";
export type Theme = "light" | "dark";
const KEY = "site-theme";

/** Inline script for <head>: sets data-theme and data-preset before the first paint, so there is no flash. */
export function themeScript(preset: Preset, defaultTheme: Theme | "system" = "system") {
  return `(function(){var d=document.documentElement;try{var c=localStorage.getItem("${KEY}")||"${defaultTheme}";var t=c==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):c;d.setAttribute("data-theme",t)}catch(e){d.setAttribute("data-theme","${defaultTheme === "system" ? "dark" : defaultTheme}")}d.setAttribute("data-preset","${preset}")})()`;
}

/**
 * Sets data-theme and data-preset before first paint. The script only exists in the server HTML: React 19 warns when a
 * <script> element is created on the client, and the page has already been themed by then. (Same approach as next-themes.)
 */
export function ThemeScript({
  preset = "hub",
  defaultTheme = "system",
}: { preset?: Preset; defaultTheme?: Theme | "system" }) {
  if (typeof window !== "undefined") return null;
  return <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: themeScript(preset, defaultTheme) }} />;
}
