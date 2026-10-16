import type { ReactNode } from "react";
import { PublicChrome } from "./PublicChrome";

/** Frame for every public page and the client pages. (`cinema` is kept so older call sites compile; the black page is the default.) */
export function Shell({ children }: { children: ReactNode; cinema?: boolean }) {
  return <PublicChrome>{children}</PublicChrome>;
}
