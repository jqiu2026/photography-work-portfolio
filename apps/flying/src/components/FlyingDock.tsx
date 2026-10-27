"use client";

import { Dock, DockBrand, DockItem } from "@holominimal/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { label: "Log", href: "/log" },
  { label: "Map", href: "/map" },
  { label: "Tools", href: "/tools" },
  { label: "Aircraft", href: "/aircraft" },
  { label: "About", href: "/about" },
];

export function FlyingDock() {
  const path = usePathname();
  const on = (href: string) => path === href || path.startsWith(`${href}/`);
  return (
    <Dock
      aria-label="Main"
      brand={
        <DockBrand asChild>
          <Link href="/">Jerry Qiu · Flying</Link>
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
