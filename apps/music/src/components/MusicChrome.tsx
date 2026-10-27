import { AppShell, Atmosphere, LightField } from "@holominimal/ui";
import { getSite } from "@jerryqiu/sites";
import Link from "next/link";
import type { ReactNode } from "react";
import { MusicDock } from "./MusicDock";
import "./music.css";

const FOOTER = [
  {
    title: "Music",
    links: [
      ["Compositions", "/compositions"],
      ["Scores", "/scores"],
      ["Listen", "/listen"],
      ["Performances", "/performances"],
    ],
  },
  {
    title: "Work with me",
    links: [
      ["Commission a piece", "/commission"],
      ["Newsletter", "/newsletter"],
      ["Your library", "/library"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Score licenses", "/licensing"],
      ["Privacy", "/privacy"],
    ],
  },
] as const;

/**
 * The music site's frame, built on Holominimal like the photo site: a night-sky atmosphere, the proximity dock, a hairline
 * footer. The only link that leaves this site is the one jerryqiu.com button (cross-site rule).
 */
export function MusicChrome({ children }: { children: ReactNode }) {
  const hub = getSite("hub");
  const year = new Date().getFullYear();
  return (
    <LightField className="mu">
      <AppShell backdrop={<Atmosphere />} sidebar={<MusicDock />}>
        {children}
        <footer className="mu-foot">
          <div className="mu-foot__grid">
            {FOOTER.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h2>{col.title}</h2>
                <ul>
                  {col.links.map(([label, href]) => (
                    <li key={href}>
                      <Link href={href}>{label}</Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
          <div className="mu-foot__base">
            <p>© {year} Jerry Qiu. All music and writing are © Jerry Qiu unless stated.</p>
            <a className="mu-return" href={hub.url} data-return-to-hub>
              jerryqiu.com
            </a>
          </div>
        </footer>
      </AppShell>
    </LightField>
  );
}
