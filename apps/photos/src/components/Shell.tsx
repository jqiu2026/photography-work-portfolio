import type { ReactNode } from "react";
import { PublicChrome } from "./PublicChrome";

/**
 * Frame for every public page and the client pages. `cinema` is for a client gallery: no site bar or footer, so the gallery
 * has the whole window and its own navigation (the gallery page links back where it needs to).
 */
export function Shell({ children, cinema }: { children: ReactNode; cinema?: boolean }) {
  if (cinema) return <>{children}</>;
  return <PublicChrome>{children}</PublicChrome>;
}
