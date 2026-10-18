"use client";

import { Button, type CommandItem, CommandPalette, Kbd, PlusIcon, SearchIcon } from "@holominimal/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { groupOf, sectionInfo, studioSections } from "./sections";

type Entry = { label: string; hint: string; href: string; keys: string };

const ACTIONS: Entry[] = [
  {
    label: "New gallery",
    hint: "Create a client gallery",
    href: "/studio/galleries?new=1",
    keys: "create add gallery photos",
  },
  {
    label: "New client",
    hint: "Add a person you work with",
    href: "/studio/clients",
    keys: "create add client person",
  },
  { label: "New quote", hint: "Send a price to a client", href: "/studio/quotes", keys: "create add quote estimate" },
  { label: "New invoice", hint: "Bill a client", href: "/studio/invoices", keys: "create add invoice bill payment" },
  {
    label: "Orders and shop",
    hint: "Print and download sales",
    href: "/studio/orders",
    keys: "shop store sales orders prints",
  },
  { label: "View my site", hint: "Open the public homepage", href: "/", keys: "home website public" },
];

const PAGES: Entry[] = studioSections.map((s) => ({
  label: s.label,
  hint: `${groupOf(s.id).label} · ${sectionInfo[s.id] ?? ""}`,
  href: `/studio/${s.id}`,
  keys: `${groupOf(s.id).label} ${s.id}`,
}));

const ALL = [...ACTIONS.map((e) => ({ ...e, group: "Start" })), ...PAGES.map((e) => ({ ...e, group: "Go to" }))];
const ITEMS: CommandItem[] = ALL.map((e) => ({
  id: e.href + e.label,
  label: e.label,
  group: e.group,
  keywords: `${e.hint} ${e.keys}`,
}));

/**
 * "Jump to": one box that finds any studio page or common action by name (Ctrl or Command K, or the button), on the
 * Holominimal command palette. The sidebar stays quiet; this is the fast way across the studio.
 */
export function StudioPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="st-util">
        <Button variant="secondary" size="sm" shape="pill" onClick={() => setOpen(true)} aria-haspopup="dialog">
          <SearchIcon /> Jump to <Kbd>⌘K</Kbd>
        </Button>
        <Button asChild size="sm" shape="pill">
          <Link href="/studio/galleries?new=1">
            <PlusIcon /> New gallery
          </Link>
        </Button>
      </div>
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        items={ITEMS}
        shortcut
        label="Jump to"
        placeholder="Go to a page or start something…"
        emptyMessage="Nothing matches."
        onSelect={(item) => {
          const e = ALL.find((x) => x.href + x.label === item.id);
          setOpen(false);
          if (e) router.push(e.href);
        }}
      />
    </>
  );
}
