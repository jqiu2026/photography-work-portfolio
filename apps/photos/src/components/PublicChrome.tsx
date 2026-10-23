import { SchemeSwitch } from "@/components/SchemeProvider";
import { getSite } from "@jerryqiu/sites";
import {
  AppShell,
  Atmosphere,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  LightField,
} from "@holominimal/ui";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChromeReveal } from "./ChromeReveal";
import { PublicDock } from "./PublicDock";
import "./public.css";

const FOOTER = [
  {
    title: "Studio",
    links: [
      ["Packages", "/packages"],
      ["How it works", "/how-it-works"],
      ["Features", "/features"],
      ["Prints", "/prints"],
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
      ["Remove a photo of me", "/privacy-request"],
      ["Licensing", "/licensing"],
      ["Accessibility", "/accessibility"],
    ],
  },
] as const;

/**
 * The photography site's frame, built on Holominimal: a night-sky atmosphere, the proximity dock for navigation, one
 * call to action pinned top right (left out where it would be noise: client documents, the booking pages), and a hairline footer.
 * `intro` (the home page) keeps the dock and the top bar out of the story until the end of the page (ChromeReveal). The only link that leaves this site is the one jerryqiu.com
 * button (cross-site rule).
 */
export function PublicChrome({
  children,
  cta = true,
  intro = false,
}: { children: ReactNode; cta?: boolean; intro?: boolean }) {
  const hub = getSite("hub");
  const year = new Date().getFullYear();
  return (
    <LightField className="pub" data-intro={intro ? "" : undefined}>
      {intro ? <ChromeReveal /> : null}
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
          {intro ? (
            <Collapsible className="pub-foot__more">
              <CollapsibleTrigger className="pub-foot__toggle">
                More links
                <span aria-hidden="true" className="pub-foot__plus" />
              </CollapsibleTrigger>
              <CollapsibleContent>
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
              </CollapsibleContent>
            </Collapsible>
          ) : (
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
          )}
          <div className="pub-foot__base">
            <p>© {year} Jerry Qiu. All photographs and writing are © Jerry Qiu unless stated.</p>
            <SchemeSwitch className="pub-scheme" />
            <a className="pub-return" href={hub.url} data-return-to-hub>
              jerryqiu.com
            </a>
          </div>
        </footer>
      </AppShell>
    </LightField>
  );
}
