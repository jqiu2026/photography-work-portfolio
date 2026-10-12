import { SiteShell } from "@jerryqiu/sites/shell";
import { sitePath } from "@jerryqiu/sites";
import type { ReactNode } from "react";

const navs = {
  music: [
    ["Listen", "/listen"],
    ["Performances", "/performances"],
    ["About", "/about"],
  ],
  flying: [
    ["Log", "/log"],
    ["Aircraft", "/aircraft"],
    ["About", "/about"],
  ],
} as const;

/** Shared chrome for the music and flying sites (same shell as every site, own navigation). */
export function InterestShell({
  id,
  children,
  transparentTop = false,
}: { id: "music" | "flying"; children: ReactNode; transparentTop?: boolean }) {
  const links = navs[id].map(([label, path]) => ({ label, href: sitePath(id, path) }));
  return (
    <SiteShell currentId={id} links={links} transparentTop={transparentTop}>
      {children}
    </SiteShell>
  );
}
