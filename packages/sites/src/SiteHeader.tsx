"use client";

import { Button, Header, SiteSwitcher, type SiteEntry, ThemeToggle } from "@placeholder/ui";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader({
  sites,
  currentId,
  links,
  transparentTop,
  connectHref,
  brandName,
  brandHref = "/",
}: {
  sites: SiteEntry[];
  currentId: string;
  links: { label: string; href: string }[];
  transparentTop?: boolean;
  /** Absent on the photography, music and flying sites: no "Connect" button pointing elsewhere. */
  connectHref?: string;
  /** When set, the brand is a plain link to this site's own home instead of the family switcher (hub only). */
  brandName?: string;
  brandHref?: string;
}) {
  const pathname = usePathname();
  const items = links.map((l) => ({
    ...l,
    current: l.href === "/" ? pathname === "/" : pathname === l.href || pathname.startsWith(`${l.href}/`),
  }));
  return (
    <Header
      linkAs={NextLink}
      transparentTop={transparentTop}
      brand={
        brandName ? (
          <NextLink href={brandHref} className="ph-brand">
            {brandName}
          </NextLink>
        ) : (
          <SiteSwitcher sites={sites} currentId={currentId} />
        )
      }
      links={items}
      actions={
        <>
          <ThemeToggle />
          {connectHref ? (
            <Button as={NextLink} href={connectHref} size="sm" variant="solid" className="ph-hide-sm">
              Connect
            </Button>
          ) : null}
        </>
      }
    />
  );
}
