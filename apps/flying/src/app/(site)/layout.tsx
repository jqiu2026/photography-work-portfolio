import type { ReactNode } from "react";
import { FlyingChrome } from "@/components/FlyingChrome";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return <FlyingChrome>{children}</FlyingChrome>;
}
