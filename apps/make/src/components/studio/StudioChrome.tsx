"use client";

import { AppShell, Atmosphere, Dock, DockBrand, DockItem, LightField } from "@holominimal/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import "../make.css";
import "./studio.css";

const SECTIONS = [
  { id: "overview", label: "Overview", href: "/studio" },
  { id: "projects", label: "Projects", href: "/studio/projects" },
  { id: "now", label: "Now log", href: "/studio/now" },
];

export function StudioChrome({ children }: { children: ReactNode }) {
  const active = usePathname().split("/")[2] ?? "overview";
  return (
    <LightField className="mk st">
      <AppShell
        backdrop={<Atmosphere />}
        sidebar={
          <Dock
            aria-label="Studio sections"
            brand={
              <DockBrand asChild>
                <Link href="/">Make studio</Link>
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
