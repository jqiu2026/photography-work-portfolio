"use client";

import { Dock, DockBrand, DockItem } from "@holominimal/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type DockLink = { label: string; href: string };

/** The hub's navigation: its own pages, then the rooms (separate sites, so plain links). */
export function HubDock({ links, rooms }: { links: DockLink[]; rooms: DockLink[] }) {
  const path = usePathname();
  const on = (href: string) => path === href || (href !== "/" && path.startsWith(`${href}/`));
  return (
    <Dock
      aria-label="Main"
      brand={
        <DockBrand asChild>
          <Link href="/">Jerry Qiu</Link>
        </DockBrand>
      }
    >
      {links.map((l) => (
        <DockItem key={l.href} asChild current={on(l.href)}>
          <Link href={l.href}>{l.label}</Link>
        </DockItem>
      ))}
      {rooms.map((r) => (
        <DockItem key={r.href} asChild>
          <a href={r.href}>{r.label}</a>
        </DockItem>
      ))}
    </Dock>
  );
}
