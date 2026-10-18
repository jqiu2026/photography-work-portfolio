import { getSite } from "@jerryqiu/sites";
import { AppShell, Atmosphere, Button, LightField } from "@holominimal/ui";
import Link from "next/link";
import type { ReactNode } from "react";
import { PublicDock } from "./PublicDock";
import "./public.css";

const FOOTER = [
  {
    title: "Studio",
    links: [
      ["Packages", "/packages"],
      ["How it works", "/how-it-works"],
      ["Features", "/features"],
      ["About prints", "/prints"],
      ["FAQ", "/faq"],
      ["Contact", "/contact"],
      ["Dashboard (owner)", "/studio"],
    ],
  },
  {
    title: "Galleries",
    links: [
      ["Shop: prints and downloads", "/shop"],
      ["About galleries", "/galleries"],
      ["How a gallery works", "/client-portal"],
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
 * The photography site's frame, built on Holominimal: a night-sky atmosphere, the proximity dock for navigation, one
 * call to action pinned top right (left out where it would be noise: client documents, the booking pages), and a hairline footer. The only link that leaves this site is the one jerryqiu.com
 * button (cross-site rule).
 */
export function PublicChrome({ children, cta = true }: { children: ReactNode; cta?: boolean }) {
  const hub = getSite("hub");
  const year = new Date().getFullYear();
  return (
    <LightField className="pub">
      <AppShell
        backdrop={<Atmosphere />}
        sidebar={<PublicDock />}
        toolbarLabel="Booking"
        toolbar={
          cta ? (
            <Button asChild size="sm">
              <Link href="/book">Book a shoot</Link>
            </Button>
          ) : undefined
        }
      >
        {children}
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
      </AppShell>
    </LightField>
  );
}
