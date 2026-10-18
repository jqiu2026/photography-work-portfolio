"use client";

import { themeScript } from "@halation/ui";
import type { Preset, Theme } from "@halation/ui";

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
