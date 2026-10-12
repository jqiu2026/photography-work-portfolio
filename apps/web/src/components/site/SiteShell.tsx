import { Footer, SkipLink } from "@placeholder/ui";
import { getSites, type SiteId } from "@jerryqiu/sites";
import type { ReactNode } from "react";
import { legalLinks, nav, person, socials } from "@/content/site";
import { SiteHeader } from "./SiteHeader";

/** Shared chrome: skip link, header with site switcher, footer with "More from me" and legal links. */
export function SiteShell({
  children,
  currentId = "hub",
  links = nav,
  transparentTop = true,
}: { children: ReactNode; currentId?: SiteId; links?: { label: string; href: string }[]; transparentTop?: boolean }) {
  const sites = getSites().map(({ id, name, description, url }) => ({ id, name, description, url }));
  return (
    <>
      <SkipLink />
      <SiteHeader sites={sites} currentId={currentId} links={links} transparentTop={transparentTop} />
      <main id="main">{children}</main>
      <Footer
        sites={sites}
        currentId={currentId}
        social={socials}
        legal={legalLinks}
        note={`© ${new Date().getFullYear()} ${person.name}. All photographs and writing are © ${person.name} unless stated.`}
      />
    </>
  );
}
