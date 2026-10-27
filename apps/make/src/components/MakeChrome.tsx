import { AppShell, Atmosphere, LightField } from "@holominimal/ui";
import { getSite } from "@jerryqiu/sites";
import Link from "next/link";
import type { ReactNode } from "react";
import { MakeDock } from "./MakeDock";
import "./make.css";

/** The Make site's frame: the same Holominimal night sky and dock as the other sites, a hairline footer, and the one jerryqiu.com button. */
export function MakeChrome({ children }: { children: ReactNode }) {
  const hub = getSite("hub");
  return (
    <LightField className="mk">
      <AppShell backdrop={<Atmosphere />} sidebar={<MakeDock />}>
        {children}
        <footer className="mk-foot">
          <nav aria-label="Footer">
            <Link href="/projects">All projects</Link>
            <Link href="/now">Now</Link>
            <Link href="/tools">Tool wall</Link>
            <Link href="/about">About</Link>
          </nav>
          <div className="mk-foot__base">
            <p>© {new Date().getFullYear()} Jerry Qiu. Projects and write-ups are © Jerry Qiu unless stated.</p>
            <a className="mk-return" href={hub.url} data-return-to-hub>
              jerryqiu.com
            </a>
          </div>
        </footer>
      </AppShell>
    </LightField>
  );
}
