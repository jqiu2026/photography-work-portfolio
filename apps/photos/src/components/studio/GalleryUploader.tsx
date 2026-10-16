"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type Item = {
  id: number;
  name: string;
  state: "queued" | "hashing" | "uploading" | "processing" | "done" | "duplicate" | "failed";
  pct: number;
  error?: string;
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
 * retried with backoff; choosing the same folder again after an interruption skips what already arrived.
 */
export function GalleryUploader({ galleryId, albumId }: { galleryId: string; albumId?: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const seen = useRef(new Set<string>()); // hashes already sent (or being sent) in this page session
  const patch = (id: number, p: Partial<Item>) => setItems((all) => all.map((i) => (i.id === id ? { ...i, ...p } : i)));

  async function one(it: Item) {
    try {
      patch(it.id, { state: "hashing", pct: 0, error: undefined });
      const sha256 = hex(await crypto.subtle.digest("SHA-256", await it.file.arrayBuffer()));
      if (seen.current.has(sha256)) return patch(it.id, { state: "duplicate", pct: 100 });
      seen.current.add(sha256);
      const type = it.file.type;
      const sign = await withRetry(async () => {
        const r = await fetch("/api/upload/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ galleryId, albumId, filename: it.file.name, size: it.file.size, type, sha256 }),
        });
        const j = (await r.json().catch(() => ({}))) as {
          error?: string;
          duplicate?: boolean;
          mode?: string;
          id?: string;
          key?: string;
          uploadUrl?: string;
        };
        if (!r.ok) throw Object.assign(new Error(j.error ?? "Could not start the upload"), { fatal: true });
        return j;
      });
      if (sign.duplicate) return patch(it.id, { state: "duplicate", pct: 100 });
      patch(it.id, { state: "uploading", pct: 0 });
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
      await withRetry(async () => {
        const r = await fetch("/api/upload/finish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: sign.id, galleryId, albumId, filename: it.file.name, sha256 }),
        });
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        if (!r.ok)
          throw Object.assign(new Error(j.error ?? "Could not process the photograph"), { fatal: r.status === 422 });
      }, 2);
      patch(it.id, { state: "done" });
    } catch (e) {
      patch(it.id, { state: "failed", error: (e as Error).message });
      seen.current.clear();
    }
  }

  async function run(list: Item[]) {
    setBusy(true);
    const queue = [...list];
    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
        for (let it = queue.shift(); it; it = queue.shift()) await one(it);
      }),
    );
    setBusy(false);
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
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        pick(e.dataTransfer.files);
      }}
      className="st-drop"
    >
      <label>
        Upload photographs (JPEG, PNG, WebP, AVIF, GIF or TIFF, up to 60 MB each)
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => e.target.files && pick(e.target.files)}
        />
      </label>
      {items.length ? (
        <>
          <p className="st-note" role="status">
            {done} of {items.length} done{failed.length ? `, ${failed.length} failed` : ""}.
          </p>
          <ul className="st-list" aria-label="Uploads">
            {items.map((i) => (
              <li key={i.id} data-upload-state={i.state}>
                <span>
                  {i.name}
                  <small>
                    {i.state === "failed" ? i.error : i.state === "duplicate" ? "already uploaded, added" : i.state}
                  </small>
                </span>
                {i.state === "uploading" ? (
                  <progress max={100} value={i.pct} aria-label={`Uploading ${i.name}`} />
                ) : null}
              </li>
            ))}
          </ul>
          {failed.length ? (
            <button type="button" className="st-btn" disabled={busy} onClick={() => void run(failed)}>
              Retry the failed ones
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
