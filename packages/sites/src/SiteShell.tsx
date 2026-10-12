import { Footer, SkipLink } from "@placeholder/ui";
import type { ReactNode } from "react";
import { type SiteId, getSite, getSites } from "./index";
import { legalPaths, person, socials } from "./profile";
import { SiteHeader } from "./SiteHeader";

/**
 * Shared chrome for every site: skip link, header with the site switcher, footer with "More from me"
 * and the hub's canonical legal pages (absolute links from the sub-sites).
 */
export function SiteShell({
  children,
  currentId = "hub",
  links,
  transparentTop = true,
}: {
  children: ReactNode;
  currentId?: SiteId;
  links: { label: string; href: string }[];
  transparentTop?: boolean;
}) {
  const sites = getSites().map(({ id, name, description, url, color }) => ({ id, name, description, url, color }));
  const hub = getSite("hub").url;
  const own = currentId === "hub" ? "" : hub;
  return (
    <>
      <SkipLink />
      <SiteHeader
        sites={sites}
        currentId={currentId}
        links={links}
        transparentTop={transparentTop}
        connectHref={`${own}/connect`}
      />
      <main id="main">{children}</main>
      <Footer
        sites={sites}
        currentId={currentId}
        social={socials}
        legal={legalPaths.map((l) => ({ label: l.label, href: `${own}${l.path}` }))}
        note={`© ${new Date().getFullYear()} ${person.name}. All photographs and writing are © ${person.name} unless stated.`}
      />
    </>
  );
}
