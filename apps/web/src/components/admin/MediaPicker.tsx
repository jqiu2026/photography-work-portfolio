"use client";

import { Button } from "@/components/kit";
import { Dialog, Input } from "@/components/kit-client";

import { useEffect, useState } from "react";

type Item = { id: string; filename: string; alt: string | null; width: number | null; height: number | null };

/** Choose an image from the media library. Writes the chosen id into a hidden input named `name`. */
export function MediaPicker({
  name,
  label,
  defaultValue,
  kind = "image",
  onPick,
  multiple,
}: {
  name?: string;
  label: string;
  defaultValue?: string | null;
  kind?: "image" | "audio";
  onPick?: (m: Item) => void;
  multiple?: boolean;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Item[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open) return;
    const ctl = new AbortController();
    fetch(`/api/admin/media?kind=${kind}&q=${encodeURIComponent(q)}`, { signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j: { items: Item[] }) => {
        setItems(j.items);
        setFailed(false);
      })
      .catch(() => !ctl.signal.aborted && setFailed(true));
    return () => ctl.abort();
  }, [open, q, kind]);

  return (
    <div>
      <p className="hm-field-label" style={{ marginBottom: "0.5rem" }}>
        {label}
      </p>
      {name ? <input type="hidden" name={name} value={value} onChange={() => {}} /> : null}
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        {!multiple && value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/admin/media/${value}/file?w=480`}
            alt=""
            width={96}
            height={64}
            style={{
              objectFit: "cover",
              borderRadius: 3,
              border: "1px solid var(--hm-line-strong)",
              width: 96,
              height: 64,
            }}
          />
        ) : multiple ? null : (
          <span className="adm-note">None selected</span>
        )}
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(true)}>
          {multiple ? "Add image" : value ? "Change" : "Choose"}
        </Button>
        {!multiple && value ? (
          <Button type="button" size="sm" variant="quiet" onClick={() => setValue("")}>
            Remove
          </Button>
        ) : null}
      </div>
      <Dialog title={`Choose ${kind}`} open={open} onOpenChange={setOpen}>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by file name…"
          aria-label="Search media"
        />
        {failed ? (
          <p className="adm-note" style={{ marginTop: "1rem" }}>
            The media library isn't available (database or storage not set up).
          </p>
        ) : null}
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: "1rem 0 0",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(7rem, 1fr))",
            gap: "0.5rem",
            maxHeight: "50dvh",
            overflow: "auto",
          }}
        >
          {(items ?? []).map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => {
                  if (!multiple) setValue(m.id);
                  onPick?.(m);
                  setOpen(false);
                }}
                style={{ all: "unset", cursor: "pointer", display: "block", width: "100%" }}
                aria-label={`Use ${m.filename}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/admin/media/${m.id}/file?w=480`}
                  alt={m.alt ?? ""}
                  style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 3 }}
                />
                <span
                  className="adm-note"
                  style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                  {m.filename}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {items && !items.length && !failed ? (
          <p className="adm-note" style={{ marginTop: "1rem" }}>
            No media yet. Upload files in Admin, Media.
          </p>
        ) : null}
      </Dialog>
    </div>
  );
}
