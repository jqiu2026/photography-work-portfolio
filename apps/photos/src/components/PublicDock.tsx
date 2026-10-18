"use client";

import { Dock, DockBrand, DockItem } from "@holominimal/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { label: "Portfolio", href: "/portfolio" },
  { label: "Projects", href: "/work" },
  { label: "Video", href: "/video" },
  { label: "About", href: "/about" },
  { label: "Packages", href: "/packages" },
  { label: "Shop", href: "/shop" },
  { label: "Book", href: "/book" },
];

/** The site's one navigation: Holominimal's proximity dock. A side rail on desktop, a scrolling strip on small screens. */
export function PublicDock() {
  const path = usePathname();
  const on = (href: string) => path === href || path.startsWith(`${href}/`);
  return (
    <Dock
      aria-label="Main"
      brand={
        <DockBrand asChild>
          <Link href="/">Jerry Qiu</Link>
        </DockBrand>
      }
    >
      {LINKS.map((l) => (
        <DockItem key={l.href} asChild current={on(l.href)}>
          <Link href={l.href}>{l.label}</Link>
        </DockItem>
      ))}
    </Dock>
  );
}
