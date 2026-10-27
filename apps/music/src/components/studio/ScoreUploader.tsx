"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button, Field, FormMessage, Input, Select } from "@/components/ui";

const KINDS = [
  { value: "full-score", label: "Full score" },
  { value: "parts", label: "Parts" },
  { value: "piano-reduction", label: "Piano reduction" },
  { value: "midi", label: "MIDI" },
  { value: "practice-audio", label: "Practice audio" },
  { value: "other", label: "Other" },
];

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

/** Direct upload of a score file in two steps: send the bytes to private storage, then register the file with the piece. */
export function ScoreUploader({ workId }: { workId: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState("full-score");
  const [label, setLabel] = useState("Score");
  const [preview, setPreview] = useState("2");
  const [pct, setPct] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function go() {
    const file = input.current?.files?.[0];
    if (!file) return setMsg({ ok: false, text: "Choose a file first." });
    setMsg(null);
    setPct(0);
    try {
      const type = file.type || "application/octet-stream";
      const sign = await fetch("/api/studio/upload/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workId, filename: file.name, size: file.size, type }),
      });
      const s = (await sign.json()) as { error?: string; mode?: string; id?: string; key?: string; uploadUrl?: string };
      if (!sign.ok || !s.id) throw new Error(s.error ?? "Could not start the upload.");
      if (s.mode === "blob") {
        const { upload } = await import("@vercel/blob/client");
        await upload(`private/${s.key}`, file, {
          access: "public",
          handleUploadUrl: "/api/upload/blob",
          multipart: true,
          onUploadProgress: (p) => setPct(Math.round(p.percentage)),
        });
      } else await put(s.uploadUrl as string, file, type, setPct);
      const fin = await fetch("/api/studio/upload/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: s.id,
          workId,
          filename: file.name,
          kind,
          label,
          previewPages: Number(preview) || 0,
        }),
      });
      const f = (await fin.json()) as { error?: string; pages?: number | null };
      if (!fin.ok) throw new Error(f.error ?? "Could not add the file.");
      setMsg({ ok: true, text: f.pages ? `Added (${f.pages} pages).` : "Added." });
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
      <div className="st-grid2">
        <Field label="Kind">
          <Select
            value={kind}
            onValueChange={(v) => {
              setKind(v);
              setLabel(KINDS.find((k) => k.value === v)?.label ?? "File");
            }}
            options={KINDS}
          />
        </Field>
        <Field label="Name shown to buyers">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={80} />
        </Field>
        <Field label="Free preview pages" hint="Full scores only. 0 = no preview.">
          <Input type="number" min={0} max={10} value={preview} onChange={(e) => setPreview(e.target.value)} />
        </Field>
      </div>
      <Field label="File" hint="PDF, MIDI, MusicXML, MP3, WAV, M4A or ZIP, up to 60 MB.">
        <Input ref={input} type="file" accept=".pdf,.mid,.midi,.musicxml,.mxl,.mp3,.wav,.m4a,.zip" />
      </Field>
      <div className="mu-row">
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
