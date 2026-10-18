"use client";

import { Button, Field, Input, Select, SettingsSection, Text } from "@holominimal/ui";

import { useState } from "react";
import { saveLinkAction, sendGalleryLinkAction } from "@/app/studio/gallery-actions";

type Run = (fn: () => Promise<{ ok: boolean; [k: string]: unknown }>, after?: () => void) => void;

/**
 * The gallery's one sharing link: /g/<address>. Open it with no passcode ("anyone with the link": view and shop) or keep it
 * private (the passcode is asked for on that same page). Clients never log in anywhere else.
 */
export function GalleryLinkPanel({
  galleryId,
  link,
  live,
  origin,
  clientName,
  clientEmail,
  run,
  pending,
  copy,
  copied,
}: {
  galleryId: string;
  link: { slug: string; visibility: string };
  live: boolean;
  origin: string;
  clientName: string;
  clientEmail: string;
  run: Run;
  pending: boolean;
  copy: (text: string, what: string) => void;
  copied: string;
}) {
  const [slug, setSlug] = useState(link.slug);
  const [vis, setVis] = useState(link.visibility);
  const url = `${origin}/g/${slug}`;
  return (
    <SettingsSection title="Gallery link" className="gm-block">
      <Text size="sm" tone="muted">
        This is the link to send. {live ? "The gallery is live." : "Publish the gallery before sending it."} Clients
        open it, and enter the passcode there if the gallery is private. There is no separate client login.
      </Text>
      <div className="gm-row">
        <code>{url}</code>
        <Button variant="secondary" onClick={() => copy(url, "Link copied")}>
          Copy link
        </Button>
        <Button asChild variant="secondary">
          <a href={url} target="_blank" rel="noreferrer">
            Open
          </a>
        </Button>
        <Button variant="secondary" disabled={pending} onClick={() => run(() => sendGalleryLinkAction(galleryId))}>
          Email {clientName || "the client"}
        </Button>
      </div>
      {clientEmail ? (
        <Text size="sm" tone="muted">
          Goes to {clientEmail}. The email has the link, not the passcode.
        </Text>
      ) : null}
      <div className="gm-fields">
        <Field label="Gallery address" hint={origin ? `${origin}/g/${slug || "…"}` : undefined}>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} spellCheck={false} />
        </Field>
        <Field label="Who can open the link">
          <Select aria-label="Who can open the link" value={vis} onValueChange={(v) => setVis(v)}>
            <option value="passcode">Private: the passcode is asked for</option>
            <option value="link">Anyone with the link (view and shop; the passcode adds proofing)</option>
          </Select>
        </Field>
        <Button disabled={pending} onClick={() => run(() => saveLinkAction({ galleryId, slug, visibility: vis }))}>
          Save link
        </Button>
      </div>
      {copied ? (
        <Text size="sm" tone="muted" role="status">
          {copied}
        </Text>
      ) : null}
    </SettingsSection>
  );
}
