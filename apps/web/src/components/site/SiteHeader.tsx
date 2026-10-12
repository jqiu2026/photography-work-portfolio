"use client";

import { Button, Header, SiteSwitcher, ThemeToggle, type SiteEntry } from "@placeholder/ui";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader({ sites, currentId, links, transparentTop }: { sites: SiteEntry[]; currentId: string; links: { label: string; href: string }[]; transparentTop?: boolean }) {
  const pathname = usePathname();
  const items = links.map((l) => ({ ...l, current: pathname === l.href || pathname.startsWith(`${l.href}/`) }));
  return (
    <Header
      linkAs={NextLink}
      transparentTop={transparentTop}
      brand={<SiteSwitcher sites={sites} currentId={currentId} />}
      links={items}
      actions={
        <>
          <ThemeToggle />
          <Button as={NextLink} href="/connect" size="sm" variant="solid" className="ph-hide-sm">Connect</Button>
        </>
      }
    />
  );
}
