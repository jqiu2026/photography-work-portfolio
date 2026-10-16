import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAccountAction } from "@/app/client/account-actions";
import { Shell } from "@/components/Shell";
import "@/components/studio/studio.css";

/** The signed-in portal: a small nav (home, messages, account, sign out) around the page. */
export function PortalFrame({
  current,
  name,
  unread = 0,
  children,
}: { current: string; name: string; unread?: number; children: ReactNode }) {
  const items = [
    { id: "home", label: "Home", href: "/client/home" },
    { id: "messages", label: unread ? `Messages (${unread})` : "Messages", href: "/client/messages" },
    { id: "account", label: "Account", href: "/client/account" },
  ];
  return (
    <Shell>
      <div className="st-wrap">
        <p className="hl-eyebrow">Client portal · {name}</p>
        <nav className="st-nav" aria-label="Portal">
          {items.map((i) => (
            <Link key={i.id} href={i.href} aria-current={i.id === current ? "page" : undefined}>
              {i.label}
            </Link>
          ))}
          <form action={logoutAccountAction}>
            <button type="submit" className="st-btn st-btn--ghost">
              Sign out
            </button>
          </form>
        </nav>
        {children}
      </div>
    </Shell>
  );
}
