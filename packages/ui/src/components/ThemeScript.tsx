import type { Preset, Theme } from "../tokens";

// No "use client": the script must render on the server, where React emits it as a real <script>.
export const KEY = "hl-theme";
type Choice = Theme | "system";

/**
 * Inline script (render in <head>) that sets data-theme and data-preset before first paint,
 * so there is no flash. Pass the same preset the provider uses.
 */
export function themeScript(preset: Preset, defaultTheme: Choice = "system") {
  return `(function(){try{var d=document.documentElement,c=localStorage.getItem("${KEY}")||"${defaultTheme}";var t=c==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):c;d.setAttribute("data-theme",t);d.setAttribute("data-preset","${preset}");var n=navigator,k=n.connection||{},slow=localStorage.getItem("hl-motion")==="calm"||k.saveData===true||/^(slow-2g|2g|3g)$/.test(k.effectiveType||"");if(matchMedia("(prefers-reduced-motion: reduce)").matches)d.setAttribute("data-hl-tier","static");else if(slow)d.setAttribute("data-hl-tier","static");else d.classList.add("hl-js")}catch(e){document.documentElement.setAttribute("data-preset","${preset}")}})()`;
}

export function ThemeScript({
  preset = "hub",
  defaultTheme = "system",
}: { preset?: Preset; defaultTheme?: Theme | "system" }) {
  return <script dangerouslySetInnerHTML={{ __html: themeScript(preset, defaultTheme) }} />;
}
