"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AppShell,
  Atmosphere,
  Dock,
  DockBrand,
  DockItem,
  DockSubItem,
  DockSubnav,
  LightField,
  ToastProvider,
} from "@holominimal/ui";
import { type CSSProperties, type ReactNode, ViewTransition, useEffect, useState } from "react";
import { groupOf, groupsFor, studioSections } from "./sections";
import { StudioPalette } from "./StudioPalette";
import "./studio.css";
import "./studio-chrome.css";
import "./studio-dashboard.css";

/** Which sidebar entry a path belongs to (a single gallery page counts as Galleries). */
export function activeSection(pathname: string): string {
  const [, , seg, rest] = pathname.split("/");
  if (!seg) return "overview";
  if (seg === "gallery") return "galleries";
  if (seg === "health") return "overview";
  return rest !== undefined || studioSections.some((s) => s.id === seg) ? seg : "overview";
}

/**
 * Studio chrome on Holominimal: the atmosphere, the proximity dock (the current group is largest; its pages are tabs
 * in the page header), the jump palette top right, and a page column that fades between routes. Entries are real links.
 */
export function StudioChrome({ children, role }: { children: ReactNode; role?: string }) {
  const pathname = usePathname();
  const section = activeSection(pathname);
  const active = groupOf(section).id;
  // the first page rides in on the shell's own curtain; the page fade is only for moving between studio pages
  const [moved, setMoved] = useState(false);
  useEffect(() => setMoved(true), []);
  return (
    <ToastProvider position="bottom-right" label="Studio notifications">
      <LightField className="st-root">
        <AppShell
          entrance="curtain"
          backdrop={<Atmosphere />}
          sidebar={
            <Dock
              aria-label="Studio sections"
              style={{ "--st-n": groupsFor(role).length } as CSSProperties}
              brand={
                <DockBrand asChild>
                  <Link href="/">Studio</Link>
                </DockBrand>
              }
            >
              {groupsFor(role).map((g) => (
                <DockItem
                  key={g.id}
                  asChild
                  current={g.id === active}
                  subnav={
                    g.sections.length > 1 ? (
                      <DockSubnav aria-label={`${g.label} pages`}>
                        {g.sections.map((id) => (
                          <DockSubItem key={id} asChild current={id === section}>
                            <Link href={`/studio/${id}`}>{studioSections.find((x) => x.id === id)?.label}</Link>
                          </DockSubItem>
                        ))}
                      </DockSubnav>
                    ) : undefined
                  }
                >
                  <Link href={`/studio/${g.sections[0]}`}>{g.label}</Link>
                </DockItem>
              ))}
            </Dock>
          }
        >
          <StudioPalette role={role} />
          <ViewTransition key={pathname} name="st-page" enter={moved ? "st-in" : "none"} exit="st-out" default="none">
            <div className="st-page">{children}</div>
          </ViewTransition>
        </AppShell>
      </LightField>
    </ToastProvider>
  );
}
