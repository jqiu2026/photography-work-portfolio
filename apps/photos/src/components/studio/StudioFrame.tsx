"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useCallback, useState, useTransition } from "react";
import {
  Alert,
  Button,
  CardContent,
  CardHeader,
  CardTitle,
  CopyCheckIcon,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  Card as HmCard,
  PageActions,
  PageDescription,
  PageEyebrow,
  PageHeader,
  PageTab,
  PageTabs,
  PageTitle,
} from "@holominimal/ui";
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

/** The answer to the last action: a Holominimal alert (status or alert role), and the client link when one was made. */
export function Banner({ note }: { note: Result | null }) {
  if (!note) return null;
  return (
    <Alert tone={note.ok ? "success" : "danger"} className="st-banner">
      <p className={note.ok ? "hm-alert-description" : "hm-alert-description st-error"}>
        {note.ok ? note.message : note.error}
      </p>
      {note.link ? <CopyLink link={note.link} /> : null}
    </Alert>
  );
}

/** A link for the client, with a copy button (the owner pastes it into a message). */
export function CopyLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <p className="st-copy">
      <span>Link for the client:</span> <code>{link}</code>
      <Button
        variant="secondary"
        size="sm"
        onClick={() =>
          navigator.clipboard?.writeText(link).then(
            () => setCopied(true),
            () => setCopied(false),
          )
        }
      >
        <CopyCheckIcon copied={copied} /> {copied ? "Copied" : "Copy"}
      </Button>
    </p>
  );
}

export function Card({ title, children, id }: { title: string; children: ReactNode; id: string }) {
  return (
    <HmCard as="section" variant="section" padding="none" className="st-card" aria-labelledby={id}>
      <CardHeader>
        <CardTitle as="h2" id={id}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="st-card__body">{children}</CardContent>
    </HmCard>
  );
}

/** Page header: where you are, what this page is for, and its siblings as tabs. */
export function StudioHead({ section, title, actions }: { section: string; title?: ReactNode; actions?: ReactNode }) {
  const group = groupOf(section);
  const label = studioSections.find((x) => x.id === section)?.label ?? "Studio";
  return (
    <PageHeader className="st-head" style={{ "--hue": group.hue } as React.CSSProperties}>
      <PageEyebrow>{group.label}</PageEyebrow>
      <PageTitle>{title ?? label}</PageTitle>
      {sectionInfo[section] && !title ? <PageDescription>{sectionInfo[section]}</PageDescription> : null}
      {actions ? <PageActions>{actions}</PageActions> : null}
      {group.sections.length > 1 ? (
        <PageTabs aria-label={`${group.label} pages`}>
          {group.sections.map((id) => (
            <PageTab key={id} asChild current={id === section}>
              <Link href={`/studio/${id}`}>{studioSections.find((x) => x.id === id)?.label}</Link>
            </PageTab>
          ))}
        </PageTabs>
      ) : null}
    </PageHeader>
  );
}

export function Frame({
  section,
  note,
  children,
  head = true,
}: { section: string; user?: string; note: Result | null; children: ReactNode; head?: boolean }) {
  return (
    <div className="st-wrap">
      {head ? <StudioHead section={section} /> : null}
      <Banner note={note} />
      {children}
    </div>
  );
}

type Ask = { title: string; body?: string; action: string; danger?: boolean };

/**
 * A Holominimal confirmation dialog for destructive or final actions, used as `if (await ask({...})) doIt()`. Returns
 * the `ask` function and the dialog element, which the caller renders once.
 */
export function useConfirm(): [(a: Ask) => Promise<boolean>, ReactNode] {
  const [q, setQ] = useState<(Ask & { done: (ok: boolean) => void }) | null>(null);
  const ask = useCallback((a: Ask) => new Promise<boolean>((done) => setQ({ danger: true, ...a, done })), []);
  const finish = (ok: boolean) => {
    q?.done(ok);
    setQ(null);
  };
  const el = (
    <Dialog open={Boolean(q)} onOpenChange={(o) => !o && finish(false)}>
      <DialogContent size="sm" role="alertdialog">
        <DialogTitle>{q?.title}</DialogTitle>
        {q?.body ? <DialogDescription>{q.body}</DialogDescription> : null}
        <DialogFooter>
          <Button variant="secondary" onClick={() => finish(false)}>
            Cancel
          </Button>
          <Button variant={q?.danger ? "danger" : "primary"} onClick={() => finish(true)}>
            {q?.action}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  return [ask, el];
}
