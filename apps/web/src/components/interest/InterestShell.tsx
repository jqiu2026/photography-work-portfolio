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

/** Shared chrome for the music and flying inner pages (quiet mark, own index routes, one return button). */
export function InterestShell({ id, children }: { id: "music" | "flying"; children: ReactNode }) {
  const links = [
    { label: "Home", href: sitePath(id) },
    ...navs[id].map(([label, path]) => ({ label, href: sitePath(id, path) })),
  ];
  return (
    <SiteShell currentId={id} links={links}>
      {children}
    </SiteShell>
  );
}
