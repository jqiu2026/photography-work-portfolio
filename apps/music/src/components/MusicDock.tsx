"use client";

import { Dock, DockBrand, DockItem } from "@holominimal/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { label: "Compositions", href: "/compositions" },
  { label: "Scores", href: "/scores" },
  { label: "Listen", href: "/listen" },
  { label: "Performances", href: "/performances" },
  { label: "Commission", href: "/commission" },
  { label: "About", href: "/about" },
];

/** The cart count lives in the server cookie; the dock asks for it once and again whenever the cart changes. */
function useCartCount() {
  const [n, setN] = useState(0);
  useEffect(() => {
    let live = true;
    const load = () =>
      fetch("/api/cart", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : { count: 0 }))
        .then((j: { count?: number }) => live && setN(j.count ?? 0))
        .catch(() => {});
    load();
    window.addEventListener("mu:cart", load);
    return () => {
      live = false;
      window.removeEventListener("mu:cart", load);
    };
  }, []);
  return n;
}

export function MusicDock() {
  const path = usePathname();
  const count = useCartCount();
  const on = (href: string) => path === href || path.startsWith(`${href}/`);
  return (
    <Dock
      aria-label="Main"
      brand={
        <DockBrand asChild>
          <Link href="/">Jerry Qiu · Music</Link>
        </DockBrand>
      }
    >
      {LINKS.map((l) => (
        <DockItem key={l.href} asChild current={on(l.href)}>
          <Link href={l.href}>{l.label}</Link>
        </DockItem>
      ))}
      <DockItem asChild current={on("/cart")}>
        <Link href="/cart">{count ? `Cart (${count})` : "Cart"}</Link>
      </DockItem>
    </Dock>
  );
}
