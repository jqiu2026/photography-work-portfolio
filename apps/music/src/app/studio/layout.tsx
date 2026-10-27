import type { ReactNode } from "react";
import { StudioChrome } from "@/components/studio/StudioChrome";

export const metadata = { title: "Studio", robots: { index: false, follow: false } };

export default function StudioLayout({ children }: { children: ReactNode }) {
  return <StudioChrome>{children}</StudioChrome>;
}
