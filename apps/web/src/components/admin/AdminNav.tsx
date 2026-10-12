"use client";

import { Button, Dialog, IconButton, Input, Sheet, ThemeToggle } from "@placeholder/ui";
import { Command, LogOut, Menu } from "lucide-react";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { setAdminSite, signOutAction } from "./actions";
import { type AdminSite, type NavGroup, adminSites } from "./nav";

function Links({ groups, onNavigate }: { groups: NavGroup[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="adm-nav">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="ph-eyebrow">{g.title}</p>
          <ul>
            {g.items.map((i) => {
              const current = i.href === "/admin" ? pathname === "/admin" : pathname.startsWith(i.href);
              return (
                <li key={i.href}>
                  <NextLink href={i.href} aria-current={current ? "page" : undefined} onClick={onNavigate}>
                    {i.label}
                  </NextLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SiteSelector({ site, back }: { site: AdminSite; back: string }) {
  return (
    <form action={setAdminSite} className="adm-sites" aria-label="Site">
      <input type="hidden" name="back" value={back} />
      <p className="ph-eyebrow">Editing</p>
      <div role="group" aria-label="Choose site">
        {adminSites.map((s) => (
          <button key={s.id} type="submit" name="site" value={s.id} aria-pressed={s.id === site} title={s.note}>
            {s.label}
          </button>
        ))}
      </div>
    </form>
  );
}

export function AdminSidebar({ groups, site }: { groups: NavGroup[]; site: AdminSite }) {
  const pathname = usePathname();
  return (
    <aside className="adm-side">
      <NextLink href="/admin" className="adm-brand">
        Admin
      </NextLink>
      <SiteSelector site={site} back={pathname} />
      <Links groups={groups} />
    </aside>
  );
}

/** Top bar: mobile menu, command palette (Cmd/Ctrl-K), theme, user. */
export function AdminTopbar({
  groups,
  site,
  userEmail,
  devOpen,
}: { groups: NavGroup[]; site: AdminSite; userEmail: string; devOpen: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const [palette, setPalette] = useState(false);
  const [q, setQ] = useState("");
  const all = useMemo(() => groups.flatMap((g) => g.items.map((i) => ({ ...i, group: g.title }))), [groups]);
  const results = all
    .filter((i) => `${i.label} ${i.hint ?? ""} ${i.group}`.toLowerCase().includes(q.toLowerCase()))
    .slice(0, 8);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="adm-top">
      <div className="adm-top__left">
        <IconButton label="Open navigation" className="adm-burger" onClick={() => setMenu(true)}>
          <Menu size={20} />
        </IconButton>
        {menu ? (
          <Sheet title="Admin" side="left" open onOpenChange={setMenu}>
            <SiteSelector site={site} back={pathname} />
            <Links groups={groups} onNavigate={() => setMenu(false)} />
          </Sheet>
        ) : null}
        <Button variant="ghost" size="sm" onClick={() => setPalette(true)} iconLeft={<Command size={14} />}>
          Jump to… <kbd className="adm-kbd">⌘K</kbd>
        </Button>
      </div>
      <div className="adm-top__right">
        {devOpen ? (
          <span className="adm-dev" title="DASHBOARD_OPEN_SIGNIN: development only">
            dev sign-in
          </span>
        ) : null}
        <ThemeToggle />
        <span className="adm-user" title={userEmail}>
          {userEmail}
        </span>
        {!devOpen ? (
          <form action={signOutAction}>
            <IconButton label="Sign out" type="submit">
              <LogOut size={18} />
            </IconButton>
          </form>
        ) : null}
      </div>
      <Dialog
        title="Jump to"
        open={palette}
        onOpenChange={(o) => {
          setPalette(o);
          if (!o) setQ("");
        }}
      >
        <Input
          autoFocus
          placeholder="Type a section…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search sections"
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) {
              router.push(results[0].href);
              setPalette(false);
            }
          }}
        />
        <ul className="adm-palette" style={{ listStyle: "none", padding: 0, margin: "1rem 0 0" }}>
          {results.map((r) => (
            <li key={r.href}>
              <NextLink href={r.href} onClick={() => setPalette(false)}>
                <strong>{r.label}</strong>
                <span>{r.group}</span>
              </NextLink>
            </li>
          ))}
          {!results.length ? <li style={{ color: "var(--ph-muted)" }}>No match</li> : null}
        </ul>
      </Dialog>
    </header>
  );
}
