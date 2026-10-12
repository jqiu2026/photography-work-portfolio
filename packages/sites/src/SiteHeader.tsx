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
}: {
  sites: SiteEntry[];
  currentId: string;
  links: { label: string; href: string }[];
  transparentTop?: boolean;
  connectHref: string;
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
      brand={<SiteSwitcher sites={sites} currentId={currentId} />}
      links={items}
      actions={
        <>
          <ThemeToggle />
          <Button as={NextLink} href={connectHref} size="sm" variant="solid" className="ph-hide-sm">
            Connect
          </Button>
        </>
      }
    />
  );
}
