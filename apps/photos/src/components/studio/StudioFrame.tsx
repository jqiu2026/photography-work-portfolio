"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useState, useTransition } from "react";
import { studioSections } from "./sections";
import "./studio.css";

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

export function Frame({
  section,
  user,
  note,
  children,
}: { section: string; user: string; note: Result | null; children: ReactNode }) {
  return (
    <div className="st-wrap">
      <p className="hl-eyebrow">Studio · {user}</p>
      <nav className="st-nav" aria-label="Studio sections">
        {studioSections.map((x) => (
          <Link key={x.id} href={`/studio/${x.id}`} aria-current={x.id === section ? "page" : undefined}>
            {x.label}
          </Link>
        ))}
      </nav>
      <Banner note={note} />
      {children}
    </div>
  );
}
