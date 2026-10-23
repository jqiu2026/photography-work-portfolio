"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useCallback, useEffect, useState, useTransition } from "react";
import {
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
  useToast,
} from "@holominimal/ui";
import Link from "next/link";
import { groupOf, sectionInfo, studioSections } from "./sections";
import "./studio.css";
import "./studio-chrome.css";
import "./studio-dashboard.css";

export type Tone = "neutral" | "accent" | "success" | "warning" | "danger" | "muted" | "info";
const TONES: Record<string, Tone> = {
  paid: "success",
  succeeded: "success",
  signed: "success",
  accepted: "success",
  published: "success",
  delivered: "success",
  done: "success",
  confirmed: "success",
  converted: "success",
  free: "success",
  active: "success",
  new: "accent",
  booked: "accent",
  sent: "info",
  viewed: "info",
  scheduled: "info",
  shot: "info",
  editing: "info",
  pending: "warning",
  partial: "warning",
  expiring: "warning",
  overdue: "danger",
  failed: "danger",
  declined: "danger",
  cancelled: "danger",
  bounced: "danger",
  void: "muted",
  refunded: "muted",
  archived: "muted",
  expired: "muted",
  stopped: "muted",
  skipped: "muted",
  mock: "muted",
  lost: "muted",
};
/** One color per meaning for every status badge in the studio: done is green, waiting on someone is blue, needs you is amber, went wrong is red, finished with is grey. */
export const statusTone = (status: string): Tone => TONES[status] ?? "neutral";

export type Result = { ok: boolean; message?: string; error?: string; link?: string };

/** Shared pieces for studio sections: the section nav, a result banner, cards, and an action runner with refresh. */
export function useAct() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [working, start] = useTransition();
  const pending = working || busy;
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
  /** Like `act`, but resolves to whether it worked, so a dialog can stay open (with its fields) when it did not. */
  const go = async (fn: () => Promise<unknown>, after?: () => void) => {
    setBusy(true);
    try {
      const r = (await fn()) as Result;
      setNote(r);
      if (r.ok) {
        after?.();
        router.refresh();
      }
      return r.ok;
    } finally {
      setBusy(false);
    }
  };
  return { pending, note, act, submit, go };
}

/**
 * The answer to the last action, as a toast in the corner (it fades by itself and never pushes the page down). When
 * the action made a client link, the toast stays until dismissed and offers a Copy button.
 */
export function Banner({ note }: { note: Result | null }) {
  const { toast } = useToast();
  useEffect(() => {
    if (!note) return;
    const text = note.ok ? note.message : note.error;
    const link = note.link;
    toast({
      title: text || (note.ok ? "Done" : "That didn't work"),
      tone: note.ok ? "success" : "danger",
      description: link,
      duration: link ? 0 : note.ok ? 4000 : 8000,
      action: link ? { label: "Copy link", onClick: () => void navigator.clipboard?.writeText(link) } : undefined,
    });
  }, [note, toast]);
  return null;
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

export function Card({
  title,
  children,
  id,
  actions,
}: { title: string; children: ReactNode; id: string; actions?: ReactNode }) {
  return (
    <HmCard as="section" variant="section" padding="none" className="st-card" aria-labelledby={id}>
      <CardHeader className={actions ? "st-card__head" : undefined}>
        <CardTitle as="h2" id={id}>
          {title}
        </CardTitle>
        {actions ? <div className="st-card__actions">{actions}</div> : null}
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

/** A small toast for things that are not a saved result: "Loaded saved settings", "Copied", "Opened". */
export function useNotify() {
  const { toast } = useToast();
  return useCallback(
    (title: string, tone: Tone = "info", description?: string) =>
      toast({
        title,
        tone: tone === "muted" ? "neutral" : tone === "accent" ? "info" : tone,
        description,
        duration: 3200,
      }),
    [toast],
  );
}

/**
 * A form inside a dialog, so a page can keep its fields out of sight until they are wanted. The form submits with Enter
 * or the main button, and the dialog closes itself when `onSubmit` returns true (or nothing).
 */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel = "Save",
  pending,
  onSubmit,
  children,
  danger,
  size = "md",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  submitLabel?: string;
  pending?: boolean;
  onSubmit: () => unknown;
  children: ReactNode;
  danger?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size={size}>
        <DialogTitle>{title}</DialogTitle>
        {description ? <DialogDescription>{description}</DialogDescription> : null}
        <form
          noValidate
          aria-label={title}
          className="st-form st-modal-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const r = await onSubmit();
            if (r !== false) onOpenChange(false);
          }}
        >
          {children}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant={danger ? "danger" : "primary"} disabled={pending}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
