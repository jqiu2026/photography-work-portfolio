import { SiteShell as Shell } from "@jerryqiu/sites/shell";
import type { ReactNode } from "react";
import { nav as defaultNav } from "@/content/site";
import { siteSettings } from "@/lib/site-settings";

/** Hub chrome for inner pages: quiet mark, index control (this site's routes only), hub footer. */
export async function SiteShell({ children }: { children: ReactNode }) {
  const { nav: custom } = await siteSettings("hub");
  const nav = custom.items.length ? custom.items : defaultNav;
  return (
    <Shell currentId="hub" links={[{ label: "Home", href: "/" }, ...nav]}>
      {children}
    </Shell>
  );
}
