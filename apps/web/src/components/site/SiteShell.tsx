import { SiteShell as Shell } from "@jerryqiu/sites/shell";
import type { ReactNode } from "react";
import { nav as defaultNav } from "@/content/site";
import { siteSettings } from "@/lib/site-settings";

/** Hub chrome: the shared shell with the hub's navigation. */
export async function SiteShell({
  children,
  transparentTop = true,
}: { children: ReactNode; transparentTop?: boolean }) {
  const { nav: custom } = await siteSettings("hub");
  const nav = custom.items.length ? custom.items : defaultNav;
  return (
    <Shell currentId="hub" links={nav} transparentTop={transparentTop}>
      {children}
    </Shell>
  );
}
