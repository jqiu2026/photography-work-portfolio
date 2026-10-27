"use client";

import { AppShell, Atmosphere, Dock, DockBrand, DockItem, LightField } from "@holominimal/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import "../music.css";
import "./studio.css";

const SECTIONS = [
  { id: "overview", label: "Overview", href: "/studio" },
  { id: "pieces", label: "Pieces", href: "/studio/pieces" },
  { id: "bundles", label: "Bundles", href: "/studio/bundles" },
  { id: "media", label: "Recordings", href: "/studio/media" },
  { id: "orders", label: "Orders", href: "/studio/orders" },
  { id: "commissions", label: "Commissions", href: "/studio/commissions" },
  { id: "newsletter", label: "Newsletter", href: "/studio/newsletter" },
];

const sectionOf = (path: string) => path.split("/")[2] ?? "overview";

export function StudioChrome({ children }: { children: ReactNode }) {
  const active = sectionOf(usePathname());
  return (
    <LightField className="mu st">
      <AppShell
        backdrop={<Atmosphere />}
        sidebar={
          <Dock
            aria-label="Studio sections"
            brand={
              <DockBrand asChild>
                <Link href="/">Music studio</Link>
              </DockBrand>
            }
          >
            {SECTIONS.map((s) => (
              <DockItem key={s.id} asChild current={s.id === active}>
                <Link href={s.href}>{s.label}</Link>
              </DockItem>
            ))}
          </Dock>
        }
      >
        <div className="st-page">{children}</div>
      </AppShell>
    </LightField>
  );
}
