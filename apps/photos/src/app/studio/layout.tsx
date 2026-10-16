import type { ReactNode } from "react";
import { StudioChrome } from "@/components/studio/StudioChrome";

export default function StudioLayout({ children }: { children: ReactNode }) {
  return <StudioChrome>{children}</StudioChrome>;
}
