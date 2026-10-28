"use client";

import { Button, Progress } from "@/components/kit";
import { useToast } from "@/components/kit-client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type Job = {
  name: string;
  pct: number;
  state: "queued" | "uploading" | "processing" | "done" | "error";
  note?: string;
};

function put(url: string, file: File, onProgress: (p: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open("PUT", url);
    x.setRequestHeader("Content-Type", file.type);
    x.upload.onprogress = (e) => e.lengthComputable && onProgress((e.loaded / e.total) * 100);
    x.onload = () => (x.status >= 200 && x.status < 300 ? resolve() : reject(new Error(`Upload failed (${x.status})`)));
    x.onerror = () => reject(new Error("Network error during upload"));
    x.send(file);
  });
}

/**
 * Direct-to-storage upload with progress: sign, PUT the file to storage, finalize (server validates and processes).
 * `replaceId` swaps the file of an existing item in place. `onDone` lets a parent attach the new media (e.g. to a gallery).
 */
export function Uploader({
  replaceId,
  onDone,
  multiple = true,
  label = "Upload images",
}: { replaceId?: string; onDone?: (ids: string[]) => void | Promise<void>; multiple?: boolean; label?: string }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const toast = useToast();

  const set = (i: number, patch: Partial<Job>) => setJobs((js) => js.map((j, n) => (n === i ? { ...j, ...patch } : j)));

  async function run(files: File[]) {
    setJobs(files.map((f) => ({ name: f.name, pct: 0, state: "queued" })));
    const ids: string[] = [];
    for (const [i, file] of files.entries()) {
      try {
        set(i, { state: "uploading" });
        const sign = await fetch("/api/admin/media/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, size: file.size, type: file.type, replaceId }),
        });
        const s = await sign.json();
        if (!sign.ok) throw new Error(s.error ?? "Could not start the upload");
        await put(s.uploadUrl, file, (pct) => set(i, { pct }));
        set(i, { pct: 100, state: "processing" });
        const fin = await fetch("/api/admin/media/finalize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: s.id, filename: file.name, replace: Boolean(replaceId) }),
        });
        const f = await fin.json();
        if (!fin.ok) throw new Error(f.error ?? "Processing failed");
        ids.push(f.id ?? s.id);
        set(i, {
          state: "done",
          note: f.duplicate
            ? "Already in the library, not stored again"
            : f.similarTo
              ? `Looks like “${f.similarTo.filename}” (already in the library)`
              : undefined,
        });
      } catch (e) {
        set(i, { state: "error", note: (e as Error).message });
      }
    }
    if (ids.length) {
      toast(`${ids.length} image${ids.length === 1 ? "" : "s"} added`);
      await onDone?.(ids);
      router.refresh();
    }
  }

  return (
    <div>
      <div
        className="adm-drop"
        data-over={over || undefined}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const fs = [...e.dataTransfer.files].filter((f) => f.type.startsWith("image/"));
          if (fs.length) run(multiple ? fs : fs.slice(0, 1));
        }}
      >
        <p>{replaceId ? "Drop a replacement here, or" : "Drop photos here, or"}</p>
        <Button type="button" onClick={() => input.current?.click()}>
          {label}
        </Button>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/tiff"
          multiple={multiple}
          hidden
          aria-label={label}
          onChange={(e) => {
            const fs = [...(e.target.files ?? [])];
            e.target.value = "";
            if (fs.length) run(fs);
          }}
        />
        <p className="adm-note">JPEG, PNG, WebP, AVIF, GIF or TIFF, up to 60 MB each. Originals stay private.</p>
      </div>
      {jobs.length ? (
        <ul className="adm-jobs" aria-live="polite">
          {jobs.map((j) => (
            <li key={`${j.name}`}>
              <span>{j.name}</span>
              <span className={j.state === "error" ? "adm-bad" : j.state === "done" ? "adm-ok" : "adm-note"}>
                {j.state === "error"
                  ? j.note
                  : j.state === "done"
                    ? `Done${j.note ? `. ${j.note}` : ""}`
                    : j.state === "processing"
                      ? "Processing…"
                      : j.state === "queued"
                        ? "Waiting"
                        : `${Math.round(j.pct)}%`}
              </span>
              {j.state === "uploading" ? <Progress value={j.pct} label={`Uploading ${j.name}`} /> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
