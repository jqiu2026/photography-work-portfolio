import { AppShell, Atmosphere, LightField } from "@holominimal/ui";
import { getMakeUrl, getSite } from "@jerryqiu/sites";
import Link from "next/link";
import type { ReactNode } from "react";
import { nav as defaultNav } from "@/content/site";
import { siteSettings } from "@/lib/site-settings";
import { HubDock } from "./HubDock";
import "./hub.css";

const LEGAL = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Licensing", href: "/licensing" },
  { label: "Accessibility", href: "/accessibility" },
];

/** The rooms of the family: the hub is the one place that lists them (cross-site rule). */
export function rooms() {
  return [
    { label: "Photography", href: getSite("photos").url },
    { label: "Music", href: getSite("music").url },
    { label: "Flying", href: getSite("flying").url },
    { label: "Make", href: getMakeUrl() },
  ];
}

/** The hub's frame on Holominimal: night sky, dock (navigation from the CMS when set), a footer with the rooms and the legal pages. */
export async function HubChrome({ children }: { children: ReactNode }) {
  const { nav: custom } = await siteSettings("hub");
  const links = [
    { label: "Home", href: "/" },
    ...(custom.items.length ? custom.items : defaultNav),
    { label: "Connect", href: "/connect" },
  ];
  const unique = links.filter((l, i) => links.findIndex((x) => x.href === l.href) === i);
  return (
    <LightField className="hb">
      <AppShell backdrop={<Atmosphere />} sidebar={<HubDock links={unique} rooms={rooms()} />}>
        {children}
        <footer className="hb-foot">
          <nav aria-label="The rooms" style={{ marginBottom: "1rem" }}>
            {rooms().map((r) => (
              <a key={r.label} href={r.href}>
                {r.label}
              </a>
            ))}
          </nav>
          <nav aria-label="Legal">
            {LEGAL.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="hb-foot__base">
            <p>© {new Date().getFullYear()} Jerry Qiu. All photographs and writing are © Jerry Qiu unless stated.</p>
          </div>
        </footer>
      </AppShell>
    </LightField>
  );
}
