"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const LINKS = [
  { label: "Portfolio", href: "/portfolio" },
  { label: "Projects", href: "/work" },
  { label: "Video", href: "/video" },
  { label: "About", href: "/about" },
  { label: "Packages", href: "/packages" },
];

/** The site's one navigation: a few text links, the current page marked, and a plain menu on small screens. */
export function PublicNav() {
  const path = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: close the small-screen menu after every navigation
  useEffect(() => {
    if (menu.current) menu.current.open = false;
  }, [path]);
  const on = (href: string) => path === href || path.startsWith(`${href}/`);
  return (
    <>
      <nav className="pub-nav" aria-label="Main">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} aria-current={on(l.href) ? "page" : undefined}>
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="pub-right">
        <Link href="/client" className="pub-clients" aria-current={on("/client") ? "page" : undefined}>
          Clients
        </Link>
        <Link href="/studio" className="pub-clients" aria-current={on("/studio") ? "page" : undefined}>
          Dashboard
        </Link>
        <Link href="/book" className="pub-cta">
          Book a shoot
        </Link>
        <details className="pub-menu" ref={menu}>
          <summary aria-label="Menu">
            <span aria-hidden="true" />
          </summary>
          <nav aria-label="Menu">
            {[
              ...LINKS,
              { label: "Book a shoot", href: "/book" },
              { label: "Clients", href: "/client" },
              { label: "Dashboard", href: "/studio" },
            ].map((l) => (
              <Link key={l.href} href={l.href} aria-current={on(l.href) ? "page" : undefined}>
                {l.label}
              </Link>
            ))}
          </nav>
        </details>
      </div>
    </>
  );
}
