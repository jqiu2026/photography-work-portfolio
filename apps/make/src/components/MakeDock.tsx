"use client";

import { Dock, DockBrand, DockItem } from "@holominimal/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** Workshop words with their plain meaning in the title, so the vocabulary never hides where a link goes. */
const LINKS = [
  { label: "Bench", href: "/projects?place=bench", title: "What I'm building now", match: "/projects" },
  { label: "Shelf", href: "/projects?place=shelf", title: "Finished and working", match: "/shelf" },
  { label: "Scrap bin", href: "/projects?place=scrap", title: "Stopped, with what I learned", match: "/scrap" },
  { label: "Tool wall", href: "/tools", title: "The tools I use", match: "/tools" },
  { label: "Now", href: "/now", title: "What I'm doing this week", match: "/now" },
  { label: "About", href: "/about", title: "About this site", match: "/about" },
];

export function MakeDock() {
  const path = usePathname();
  return (
    <Dock
      aria-label="Main"
      brand={
        <DockBrand asChild>
          <Link href="/">Jerry Qiu · Make</Link>
        </DockBrand>
      }
    >
      {LINKS.map((l) => (
        <DockItem
          key={l.label}
          asChild
          current={l.match === "/projects" ? false : path === l.match || path.startsWith(`${l.match}/`)}
        >
          <Link href={l.href} title={l.title}>
            {l.label}
          </Link>
        </DockItem>
      ))}
    </Dock>
  );
}
