"use client";

import { Button, FileDropzone, FileItem, Progress, RefreshIcon, Text } from "@holominimal/ui";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useNotify } from "./StudioFrame";

type Item = {
  id: number;
  name: string;
  state: "queued" | "hashing" | "uploading" | "processing" | "done" | "duplicate" | "failed";
  pct: number;
  error?: string;
  /** what happened besides the upload itself: a rename, or a look-alike already in the library */
  note?: string;
  file: File;
};
const TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif", "image/tiff"]);
const CONCURRENCY = 3;
const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function putWithProgress(url: string, file: File, type: string, onProgress: (p: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open("PUT", url);
    x.setRequestHeader("Content-Type", type);
    x.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    x.onload = () =>
      x.status >= 200 && x.status < 300 ? resolve() : reject(new Error(`Upload refused (${x.status})`));
    x.onerror = () => reject(new Error("The connection dropped"));
    x.send(file);
  });
}

async function withRetry<T>(fn: () => Promise<T>, tries = 4): Promise<T> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if ((e as { fatal?: boolean }).fatal) throw e;
      await sleep(500 * 2 ** i);
    }
  }
  throw last;
}

/**
 * Bulk upload straight from the browser. Each file: SHA-256 (so an exact duplicate is not sent again), a signed PUT or a
 * Vercel Blob client upload, then the server validates the real bytes and makes the four sizes. Up to 3 files at a time, each
 * retried with backoff; choosing the same folder again after an interruption skips what already arrived. A different picture
 * whose name this gallery already uses is renamed ("IMG_0001-2.jpg") and the row and a toast say so.
 */
export function GalleryUploader({ galleryId, albumId }: { galleryId: string; albumId?: string }) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const notify = useNotify();
  const seen = useRef(new Set<string>()); // hashes already sent (or being sent) in this page session
  const claimed = useRef<string[]>([]); // names given to uploads in this page session, so two in flight never share one
  const signing = useRef<Promise<unknown>>(Promise.resolve()); // one sign at a time, so free names are handed out in turn
  const patch = (id: number, p: Partial<Item>) => setItems((all) => all.map((i) => (i.id === id ? { ...i, ...p } : i)));

  type Outcome = "done" | "renamed" | "duplicate" | "failed";
  async function one(it: Item): Promise<Outcome> {
    const dup = () => {
      patch(it.id, { state: "duplicate", pct: 100, note: undefined });
      return "duplicate" as const;
    };
    try {
      patch(it.id, { state: "hashing", pct: 0, error: undefined });
      const sha256 = hex(await crypto.subtle.digest("SHA-256", await it.file.arrayBuffer()));
      if (seen.current.has(sha256)) return dup();
      seen.current.add(sha256);
      const type = it.file.type;
      const signed = signing.current.then(() =>
        withRetry(async () => {
          const r = await fetch("/api/upload/sign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              galleryId,
              albumId,
              filename: it.file.name,
              size: it.file.size,
              type,
              sha256,
              claimed: claimed.current,
            }),
          });
          const j = (await r.json().catch(() => ({}))) as {
            error?: string;
            duplicate?: boolean;
            mode?: string;
            id?: string;
            key?: string;
            uploadUrl?: string;
            filename?: string;
            renamedFrom?: string;
          };
          if (!r.ok) throw Object.assign(new Error(j.error ?? "Could not start the upload"), { fatal: true });
          if (j.filename) claimed.current.push(j.filename);
          return j;
        }),
      );
      signing.current = signed.catch(() => {});
      const sign = await signed;
      if (sign.duplicate) return dup();
      const filename = sign.filename ?? it.file.name;
      const renamed = sign.renamedFrom
        ? `saved as ${filename}: another photograph in this gallery already has this name`
        : undefined;
      patch(it.id, { state: "uploading", pct: 0, note: renamed });
      if (sign.mode === "blob") {
        const { upload } = await import("@vercel/blob/client");
        await withRetry(() =>
          upload(`private/${sign.key}`, it.file, {
            access: "public",
            handleUploadUrl: "/api/upload/blob",
            multipart: true,
            contentType: type,
            onUploadProgress: (p) => patch(it.id, { pct: Math.round(p.percentage) }),
          }),
        );
      } else
        await withRetry(() => putWithProgress(sign.uploadUrl as string, it.file, type, (pct) => patch(it.id, { pct })));
      patch(it.id, { state: "processing", pct: 100 });
      const fin = await withRetry(async () => {
        const r = await fetch("/api/upload/finish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: sign.id, galleryId, albumId, filename, sha256 }),
        });
        const j = (await r.json().catch(() => ({}))) as {
          error?: string;
          duplicate?: boolean;
          similarTo?: { filename: string } | null;
        };
        if (!r.ok)
          throw Object.assign(new Error(j.error ?? "Could not process the photograph"), { fatal: r.status === 422 });
        return j;
      }, 2);
      if (fin.duplicate) return dup();
      const alike = fin.similarTo ? `looks like ${fin.similarTo.filename}, already in your library` : undefined;
      patch(it.id, { state: "done", note: [renamed, alike].filter(Boolean).join("; ") || undefined });
      return renamed ? "renamed" : "done";
    } catch (e) {
      patch(it.id, { state: "failed", error: (e as Error).message });
      seen.current.clear();
      return "failed";
    }
  }

  async function run(list: Item[]) {
    setBusy(true);
    const queue = [...list];
    const got: Outcome[] = [];
    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
        for (let it = queue.shift(); it; it = queue.shift()) got.push(await one(it));
      }),
    );
    setBusy(false);
    const n = (o: Outcome) => got.filter((g) => g === o).length;
    const parts = [
      n("done") + n("renamed") && `${n("done") + n("renamed")} added`,
      n("duplicate") && `${n("duplicate")} already uploaded (not stored again)`,
      n("renamed") && `${n("renamed")} renamed because the name was taken`,
      n("failed") && `${n("failed")} failed`,
    ].filter(Boolean);
    if (parts.length) notify(parts.join(", "), n("failed") ? "danger" : n("renamed") ? "warning" : "success");
    router.refresh();
  }

  function pick(files: FileList | File[]) {
    const list: Item[] = [...files]
      .filter((f) => TYPES.has(f.type))
      .map((file, i) => ({ id: Date.now() + i, name: file.name, state: "queued", pct: 0, file }));
    if (!list.length) return;
    setItems((prev) => [...prev, ...list]);
    void run(list);
  }
  const failed = items.filter((i) => i.state === "failed");
  const done = items.filter((i) => i.state === "done" || i.state === "duplicate").length;
  return (
    <div className="st-drop">
      <FileDropzone
        onFiles={pick}
        accept="image/*"
        multiple
        label="Drop photographs here, or choose files"
        description="JPEG, PNG, WebP, AVIF, GIF or TIFF, up to 60 MB each. Duplicates are recognized and skipped."
      />
      {items.length ? (
        <>
          <Progress
            value={done}
            max={items.length}
            tone={failed.length ? "warning" : "accent"}
            aria-label="Upload progress"
            size="sm"
          />
          <Text size="sm" tone="muted" role="status">
            {done} of {items.length} done{failed.length ? `, ${failed.length} failed` : ""}.
          </Text>
          <ul className="hm-file-list" aria-label="Uploads">
            {items.map((i) => (
              <FileItem
                key={i.id}
                data-upload-state={i.state}
                name={
                  i.state === "duplicate"
                    ? `${i.name} (already uploaded, added)`
                    : i.note
                      ? `${i.name} (${i.note})`
                      : i.name
                }
                size={i.file?.size}
                progress={i.state === "uploading" ? i.pct : undefined}
                status={
                  i.state === "failed"
                    ? "error"
                    : i.state === "uploading"
                      ? "uploading"
                      : i.state === "done" || i.state === "duplicate"
                        ? "done"
                        : "ready"
                }
                error={i.state === "failed" ? i.error : undefined}
              />
            ))}
          </ul>
          {failed.length ? (
            <Button variant="secondary" disabled={busy} onClick={() => void run(failed)}>
              <RefreshIcon /> Retry the failed ones
            </Button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
