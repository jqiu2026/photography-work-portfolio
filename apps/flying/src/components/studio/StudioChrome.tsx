"use client";

import { AppShell, Atmosphere, Dock, DockBrand, DockItem, LightField } from "@holominimal/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import "../flying.css";
import "./studio.css";

const SECTIONS = [
  { id: "overview", label: "Overview", href: "/studio" },
  { id: "flights", label: "Flights", href: "/studio/flights" },
  { id: "airports", label: "Airports", href: "/studio/airports" },
];

export function StudioChrome({ children }: { children: ReactNode }) {
  const active = usePathname().split("/")[2] ?? "overview";
  return (
    <LightField className="fl st">
      <AppShell
        backdrop={<Atmosphere />}
        sidebar={
          <Dock
            aria-label="Studio sections"
            brand={
              <DockBrand asChild>
                <Link href="/">Flying studio</Link>
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
