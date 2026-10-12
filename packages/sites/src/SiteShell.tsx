import { Footer, SkipLink } from "@placeholder/ui";
import type { ReactNode } from "react";
import { type SiteId, getSite, getSites, sitePath } from "./index";
import { legalPaths, person, socials } from "./profile";
import { SiteHeader } from "./SiteHeader";

/**
 * Shared chrome. The hub gets the family switcher and the "More from me" footer (it is the only site that introduces
 * the others). Photography, music and flying get NO reference to any other site: their header has a plain brand and
 * their footer has exactly one button back to jerryqiu.com (cross-site rule, 12-vision-v2.md). Tested in e2e/cross-site.
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
  const hub = getSite("hub");
  const self = getSite(currentId);
  if (currentId === "hub") {
    return (
      <>
        <SkipLink />
        <SiteHeader
          sites={sites}
          currentId={currentId}
          links={links}
          transparentTop={transparentTop}
          connectHref="/connect"
        />
        <main id="main">{children}</main>
        <Footer
          sites={sites}
          currentId={currentId}
          social={socials}
          legal={legalPaths.map((l) => ({ label: l.label, href: l.path }))}
          note={`© ${new Date().getFullYear()} ${person.name}. All photographs and writing are © ${person.name} unless stated.`}
        />
      </>
    );
  }
  return (
    <>
      <SkipLink />
      <SiteHeader
        sites={[]}
        currentId={currentId}
        links={links}
        transparentTop={transparentTop}
        brandName={self.name}
        brandHref={sitePath(currentId)}
      />
      <main id="main">{children}</main>
      <footer className="ph-footer">
        <div className="ph-footer__inner">
          <div className="ph-footer__legal">
            <p>{`© ${new Date().getFullYear()} ${person.name}. All photographs and writing are © ${person.name} unless stated.`}</p>
            <a className="ph-btn ph-btn--ghost ph-btn--md" href={hub.url} data-return-to-hub>
              jerryqiu.com
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
