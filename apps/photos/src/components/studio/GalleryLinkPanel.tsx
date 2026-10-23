"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  Field,
  Input,
  Select,
  SettingsSection,
  Text,
} from "@holominimal/ui";

import { useEffect, useState } from "react";
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
        <QrCode url={url} title={clientName ? `Gallery for ${clientName}` : "Gallery"} />
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
    </SettingsSection>
  );
}

/**
 * A QR code for the gallery link (for a card, a print or a screen at the event). It encodes only the public link, never
 * the passcode. Made in the browser; download as SVG (sharp at any size) or PNG.
 */
function QrCode({ url, title }: { url: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [svg, setSvg] = useState("");
  useEffect(() => {
    if (!open) return;
    let live = true;
    void import("qrcode").then(async (QR) => {
      const text = await QR.toString(url, {
        type: "svg",
        margin: 2,
        errorCorrectionLevel: "M",
        color: { dark: "#000000", light: "#ffffff" },
      });
      if (live) setSvg(text);
    });
    return () => {
      live = false;
    };
  }, [open, url]);
  const save = (href: string, name: string) => {
    const a = document.createElement("a");
    a.href = href;
    a.download = name;
    a.click();
  };
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        QR code
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="sm">
          <DialogTitle>QR code</DialogTitle>
          <DialogDescription>
            Scanning it opens {url}. The passcode is not in it, so a private gallery still asks for it.
          </DialogDescription>
          {svg ? (
            <div
              className="gm-qr"
              role="img"
              aria-label={`QR code for ${title}`}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ) : (
            <Text size="sm" tone="muted">
              Making it…
            </Text>
          )}
          <DialogFooter>
            <Button
              variant="secondary"
              disabled={!svg}
              onClick={() => save(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, "gallery-qr.svg")}
            >
              Download SVG
            </Button>
            <Button
              disabled={!svg}
              onClick={async () => {
                const QR = await import("qrcode");
                save(await QR.toDataURL(url, { width: 1024, margin: 2, errorCorrectionLevel: "M" }), "gallery-qr.png");
              }}
            >
              Download PNG
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
