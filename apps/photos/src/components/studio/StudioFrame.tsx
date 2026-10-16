"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useState, useTransition } from "react";
import Link from "next/link";
import { groupOf, sectionInfo, studioSections } from "./sections";
import "./studio.css";
import "./studio-chrome.css";
import "./studio-dashboard.css";

export type Result = { ok: boolean; message?: string; error?: string; link?: string };

/** Shared pieces for studio sections: the section nav, a result banner, cards, and an action runner with refresh. */
export function useAct() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [note, setNote] = useState<Result | null>(null);
  const act = (fn: () => Promise<unknown>, after?: () => void) =>
    start(async () => {
      const r = (await fn()) as Result;
      setNote(r);
      if (r.ok) {
        after?.();
        router.refresh();
      }
    });
  const submit = (fn: () => Promise<unknown>, after?: () => void) => (e: FormEvent) => {
    e.preventDefault();
    act(fn, after);
  };
  return { pending, note, act, submit };
}

export function Banner({ note }: { note: Result | null }) {
  if (!note) return null;
  return (
    <div className="st-card" role={note.ok ? "status" : "alert"} data-ok={note.ok || undefined}>
      <p className={note.ok ? "st-note" : "st-error"}>{note.ok ? note.message : note.error}</p>
      {note.link ? (
        <p className="st-note">
          Link (copy it to the client): <code>{note.link}</code>
        </p>
      ) : null}
    </div>
  );
}

export function Card({ title, children, id }: { title: string; children: ReactNode; id: string }) {
  return (
    <section className="st-card" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {children}
    </section>
  );
}

/** Page header: where you are, what this page is for, and its siblings as quiet tabs. */
export function StudioHead({ section }: { section: string }) {
  const group = groupOf(section);
  const label = studioSections.find((x) => x.id === section)?.label ?? "Studio";
  return (
    <header className="st-head" style={{ "--hue": group.hue } as React.CSSProperties}>
      <p className="st-crumb">{group.label}</p>
      <h1 className="st-title">{label}</h1>
      <p className="st-sub">{sectionInfo[section]}</p>
      {group.sections.length > 1 ? (
        <nav className="st-tabs" aria-label={`${group.label} pages`}>
          {group.sections.map((id) => (
            <Link key={id} href={`/studio/${id}`} aria-current={id === section ? "page" : undefined}>
              {studioSections.find((x) => x.id === id)?.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}

export function Frame({
  section,
  note,
  children,
}: { section: string; user?: string; note: Result | null; children: ReactNode }) {
  return (
    <div className="st-wrap">
      <StudioHead section={section} />
      <Banner note={note} />
      {children}
    </div>
  );
}
