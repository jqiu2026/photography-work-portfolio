import type { ReactNode } from "react";
import { MakeChrome } from "@/components/MakeChrome";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return <MakeChrome>{children}</MakeChrome>;
}
