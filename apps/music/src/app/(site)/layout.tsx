import type { ReactNode } from "react";
import { MusicChrome } from "@/components/MusicChrome";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return <MusicChrome>{children}</MusicChrome>;
}
