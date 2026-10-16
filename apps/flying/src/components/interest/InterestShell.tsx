import { mocksEnabled } from "@jerryqiu/mocks";
import { SiteShell } from "@jerryqiu/sites/shell";
import { sitePath } from "@jerryqiu/sites";
import type { ReactNode } from "react";

/** Routes that exist only as local mocks (Phase 3 makes them real); hidden from navigation in production builds. */
const MOCK_ONLY = new Set(["/compositions", "/scores", "/map"]);

const navs = {
  music: [
    ["Compositions", "/compositions"],
    ["Scores", "/scores"],
    ["Listen", "/listen"],
    ["Performances", "/performances"],
    ["About", "/about"],
  ],
  flying: [
    ["Log", "/log"],
    ["Map", "/map"],
    ["Aircraft", "/aircraft"],
    ["About", "/about"],
  ],
} as const;

/** Shared chrome for the music and flying inner pages (quiet mark, own index routes, one return button). */
export function InterestShell({ id, children }: { id: "music" | "flying"; children: ReactNode }) {
  const links = [
    { label: "Home", href: sitePath(id) },
    ...navs[id]
      .filter(([, path]) => mocksEnabled() || !MOCK_ONLY.has(path))
      .map(([label, path]) => ({ label, href: sitePath(id, path) })),
  ];
  return (
    <SiteShell currentId={id} links={links}>
      {children}
    </SiteShell>
  );
}
