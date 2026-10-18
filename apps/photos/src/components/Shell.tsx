import type { ReactNode } from "react";
import { PublicChrome } from "./PublicChrome";

/**
 * Frame for every public page and the client pages. `bare` is for a client gallery: no site bar or footer, so the gallery
 * has the whole window and its own navigation (the gallery page links back where it needs to).
 */
/** (`cinema` is kept so older call sites compile; it changes nothing.) */
export function Shell({
  children,
  bare,
  cta = true,
}: { children: ReactNode; bare?: boolean; cinema?: boolean; cta?: boolean }) {
  if (bare) return <>{children}</>;
  return <PublicChrome cta={cta}>{children}</PublicChrome>;
}
