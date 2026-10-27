import { AppShell, Atmosphere, LightField } from "@holominimal/ui";
import { getSite } from "@jerryqiu/sites";
import Link from "next/link";
import type { ReactNode } from "react";
import { FlyingDock } from "./FlyingDock";
import "./flying.css";

/** The flying site's frame: Holominimal's night sky and dock, a hairline footer, and the one jerryqiu.com button. */
export function FlyingChrome({ children }: { children: ReactNode }) {
  const hub = getSite("hub");
  return (
    <LightField className="fl">
      <AppShell backdrop={<Atmosphere />} sidebar={<FlyingDock />}>
        {children}
        <footer className="fl-foot">
          <nav aria-label="Footer">
            <Link href="/tools">Tools</Link>
            <Link href="/log">Log</Link>
            <Link href="/map">Map</Link>
            <Link href="/about">About</Link>
          </nav>
          <p className="fl-foot__note">
            A personal account of learning to fly. Nothing here is flight instruction, a briefing or aviation advice.
          </p>
          <div className="fl-foot__base">
            <p>© {new Date().getFullYear()} Jerry Qiu. Photographs and writing are © Jerry Qiu unless stated.</p>
            <a className="fl-return" href={hub.url} data-return-to-hub>
              jerryqiu.com
            </a>
          </div>
        </footer>
      </AppShell>
    </LightField>
  );
}
