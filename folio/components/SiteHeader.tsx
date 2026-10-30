"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const path = usePathname();
  const link = (href: string, label: string, on: boolean) => (
    <Link href={href} aria-current={on ? "page" : undefined}>
      {label}
    </Link>
  );
  return (
    <header className="top">
      <Link className="brand" href="/">
        Jerry Qiu
      </Link>
      <nav aria-label="Pages">
        {link("/", "Photos", path === "/")}
        {link("/videos", "Videos", path.startsWith("/videos"))}
      </nav>
    </header>
  );
}
