import { themeScript } from "@halation/ui";
import type { Preset, Theme } from "@halation/ui";
import Script from "next/script";

/**
 * Sets data-theme and data-preset before first paint. Uses next/script (beforeInteractive) because React warns when a plain
 * <script> element from a server layout is rendered on the client in development.
 */
export function ThemeScript({
  preset = "hub",
  defaultTheme = "system",
}: { preset?: Preset; defaultTheme?: Theme | "system" }) {
  return (
    <Script
      id="hl-theme"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: themeScript(preset, defaultTheme) }}
    />
  );
}
