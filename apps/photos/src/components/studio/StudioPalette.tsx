"use client";

import { Button, type CommandItem, CommandPalette, Kbd, PlusIcon, SearchIcon } from "@holominimal/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
type Hit = { kind: string; id: string; label: string; detail: string; href: string };
const KIND: Record<string, string> = {
  client: "Client",
  job: "Job",
  gallery: "Gallery",
  invoice: "Invoice",
  testimonial: "Testimonial",
  expense: "Expense",
};

export function StudioPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<Hit[]>([]);
  // The palette owns its input, so the typed text is read from the field's own input events while it is open, and the
  // studio's records are searched (after a short pause) alongside the pages and actions.
  useEffect(() => {
    if (!open) {
      setHits([]);
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    let seq = 0;
    const onInput = (e: Event) => {
      const t = e.target;
      if (!(t instanceof HTMLInputElement) || t.getAttribute("role") !== "combobox") return;
      const q = t.value.trim();
      clearTimeout(timer);
      if (q.length < 2) return setHits([]);
      const mine = ++seq;
      timer = setTimeout(async () => {
        try {
          const r = await fetch(`/api/studio/search?q=${encodeURIComponent(q)}`, { credentials: "same-origin" });
          if (!r.ok || mine !== seq) return;
          setHits(((await r.json()) as { hits: Hit[] }).hits);
        } catch {}
      }, 180);
    };
    document.addEventListener("input", onInput);
    return () => {
      document.removeEventListener("input", onInput);
      clearTimeout(timer);
    };
  }, [open]);
  const items = useMemo<CommandItem[]>(
    () => [
      ...ITEMS,
      ...hits.map((h) => ({
        id: `hit:${h.kind}:${h.id}`,
        label: h.label,
        group: `Found: ${KIND[h.kind] ?? h.kind}`,
        keywords: h.detail,
      })),
    ],
    [hits],
  );
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
        items={items}
        filter={(item, query) =>
          item.id.startsWith("hit:") ||
          `${item.label} ${item.group ?? ""} ${item.keywords ?? ""}`.toLowerCase().includes(query.trim().toLowerCase())
        }
        shortcut
        label="Jump to"
        placeholder="Go to a page or start something…"
        emptyMessage="Nothing matches."
        onSelect={(item) => {
          setOpen(false);
          const hit = item.id.startsWith("hit:") ? hits.find((h) => `hit:${h.kind}:${h.id}` === item.id) : undefined;
          if (hit) return router.push(hit.href);
          const e = ALL.find((x) => x.href + x.label === item.id);
          if (e) router.push(e.href);
        }}
      />
    </>
  );
}
