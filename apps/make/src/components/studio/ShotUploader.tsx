"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button, Field, FormMessage, Input } from "@/components/ui";

function put(url: string, file: File, type: string, onPct: (n: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open("PUT", url);
    x.setRequestHeader("Content-Type", type);
    x.upload.onprogress = (e) => e.lengthComputable && onPct(Math.round((e.loaded / e.total) * 100));
    x.onload = () => (x.status < 300 ? resolve() : reject(new Error(`Upload failed (${x.status}).`)));
    x.onerror = () => reject(new Error("The upload was interrupted."));
    x.send(file);
  });
}

/** Uploads a screenshot in two steps. It is saved hidden: it only shows publicly once it is marked checked. */
export function ShotUploader({ projectId }: { projectId: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function go() {
    const file = input.current?.files?.[0];
    if (!file) return setMsg({ ok: false, text: "Choose an image first." });
    setMsg(null);
    setPct(0);
    try {
      const sign = await fetch("/api/studio/upload/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, filename: file.name, size: file.size, type: file.type }),
      });
      const s = (await sign.json()) as { error?: string; mode?: string; id?: string; key?: string; uploadUrl?: string };
      if (!sign.ok || !s.id) throw new Error(s.error ?? "Could not start the upload.");
      if (s.mode === "blob") {
        const { upload } = await import("@vercel/blob/client");
        await upload(`private/${s.key}`, file, {
          access: "public",
          handleUploadUrl: "/api/upload/blob",
          onUploadProgress: (p) => setPct(Math.round(p.percentage)),
        });
      } else await put(s.uploadUrl as string, file, file.type, setPct);
      const fin = await fetch("/api/studio/upload/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: s.id, projectId, filename: file.name }),
      });
      const f = (await fin.json()) as { error?: string };
      if (!fin.ok) throw new Error(f.error ?? "Could not add the image.");
      setMsg({ ok: true, text: "Added. It stays hidden until you describe it and mark it checked." });
      if (input.current) input.current.value = "";
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setPct(null);
    }
  }

  return (
    <div className="st-drop">
      <Field label="Screenshot" hint="PNG, JPEG, WebP or GIF, up to 25 MB. Metadata is removed.">
        <Input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
      </Field>
      <div className="mk-row">
        <Button type="button" onClick={go} loading={pct !== null}>
          Upload
        </Button>
        {pct !== null ? (
          <div
            className="st-progress"
            style={{ width: "10rem" }}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Upload progress"
          >
            <i style={{ width: `${pct}%` }} />
          </div>
        ) : null}
        {msg ? <FormMessage ok={msg.ok}>{msg.text}</FormMessage> : null}
      </div>
    </div>
  );
}
