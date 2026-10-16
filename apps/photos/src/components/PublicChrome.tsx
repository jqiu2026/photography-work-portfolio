import { getSite } from "@jerryqiu/sites";
import Link from "next/link";
import type { ReactNode } from "react";
import { PublicNav } from "./PublicNav";
import "./public.css";

const FOOTER = [
  {
    title: "Studio",
    links: [
      ["Packages", "/packages"],
      ["How it works", "/how-it-works"],
      ["Features", "/features"],
      ["Shop: prints and downloads", "/shop"],
      ["About prints", "/prints"],
      ["FAQ", "/faq"],
      ["Contact", "/contact"],
      ["Dashboard (owner)", "/studio"],
    ],
  },
  {
    title: "Clients",
    links: [
      ["Open a gallery", "/client"],
      ["Sign in to the portal", "/client/login"],
      ["Portal tour", "/client-portal"],
      ["About galleries", "/galleries"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Terms", "/terms"],
      ["Privacy", "/privacy"],
      ["Licensing", "/licensing"],
      ["Accessibility", "/accessibility"],
    ],
  },
] as const;

/**
 * The photography site's frame: a quiet top bar with the wordmark, a few links and one call to action; a plain footer.
 * No stage, no scroll effects. The only link that leaves this site is the one jerryqiu.com button (cross-site rule).
 */
export function PublicChrome({ children }: { children: ReactNode }) {
  const hub = getSite("hub");
  const year = new Date().getFullYear();
  return (
    <div className="pub">
      <a className="hl-skip" href="#main">
        Skip to content
      </a>
      <header className="pub-bar">
        <Link href="/" className="pub-mark">
          Jerry Qiu <span>Photography</span>
        </Link>
        <PublicNav />
      </header>
      <main id="main" className="pub-main">
        {children}
      </main>
      <footer className="pub-foot">
        <div className="pub-foot__grid">
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
        <div className="pub-foot__base">
          <p>© {year} Jerry Qiu. All photographs and writing are © Jerry Qiu unless stated.</p>
          <a className="pub-return" href={hub.url} data-return-to-hub>
            jerryqiu.com
          </a>
        </div>
      </footer>
    </div>
  );
}
