"use client";

import { useState } from "react";
import { deleteRuleAction, saveRuleAction } from "@/app/studio/gallery-actions";

type Run = (fn: () => Promise<{ ok: boolean; [k: string]: unknown }>, after?: () => void) => void;
export type DownloadRuleRow = {
  id: string;
  albumId: string | null;
  name: string;
  maxPx: number | null;
  perVisitor: number | null;
  watermarkId: string | null;
  hasPin: boolean;
  printRelease: string;
  showAll: boolean;
};

const blank = {
  id: "",
  albumId: "",
  name: "",
  maxPx: "720",
  perVisitor: "",
  watermarkId: "",
  pin: "",
  printRelease: "",
  showAll: true,
};

/**
 * Free downloads: rules say who may download what without paying. A rule has a name visitors see, a size (or the original), a
 * limit per visitor, an optional watermark and PIN, a licence to accept, and covers the whole gallery or one album.
 */
export function GalleryDownloads({
  galleryId,
  rules,
  albums,
  watermarks,
  run,
  pending,
}: {
  galleryId: string;
  rules: DownloadRuleRow[];
  albums: { id: string; name: string }[];
  watermarks: { id: string; name: string }[];
  run: Run;
  pending: boolean;
}) {
  const [f, setF] = useState(blank);
  const set = <K extends keyof typeof blank>(k: K, v: (typeof blank)[K]) => setF((x) => ({ ...x, [k]: v }));
  const edit = (r: DownloadRuleRow) =>
    setF({
      id: r.id,
      albumId: r.albumId ?? "",
      name: r.name,
      maxPx: r.maxPx ? String(r.maxPx) : "",
      perVisitor: r.perVisitor ? String(r.perVisitor) : "",
      watermarkId: r.watermarkId ?? "",
      pin: "",
      printRelease: r.printRelease,
      showAll: r.showAll,
    });
  const wm = (id: string | null) => watermarks.find((w) => w.id === id)?.name;
  return (
    <div className="gm-block">
      <h2>Free downloads</h2>
      <p className="st-note">
        Rules decide who may download for free. With no rule, visitors cannot download (they can still buy in the
        Store). The client's own downloads are set below.
      </p>
      {rules.length ? (
        <ul className="st-list" aria-label="Download rules">
          {rules.map((r) => (
            <li key={r.id}>
              <span>
                {r.name}
                <small>
                  {r.albumId ? `Album: ${albums.find((a) => a.id === r.albumId)?.name ?? "?"}` : "Whole gallery"} ·{" "}
                  {r.maxPx ? `${r.maxPx} px` : "original"} · {r.perVisitor ? `${r.perVisitor} each` : "unlimited"}
                  {wm(r.watermarkId) ? ` · ${wm(r.watermarkId)}` : ""}
                  {r.hasPin ? " · PIN" : ""}
                </small>
              </span>
              <button type="button" className="st-btn st-btn--ghost" onClick={() => edit(r)}>
                Edit
              </button>
              <button
                type="button"
                className="st-btn st-btn--ghost"
                disabled={pending}
                onClick={() => run(() => deleteRuleAction({ galleryId, id: r.id }))}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="st-note">No rules yet.</p>
      )}
      <h3>{f.id ? "Edit rule" : "New rule"}</h3>
      <form
        className="gm-fields"
        aria-label="Download rule"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          run(
            () =>
              saveRuleAction({
                galleryId,
                id: f.id || undefined,
                albumId: f.albumId || undefined,
                name: f.name,
                maxPx: f.maxPx,
                perVisitor: f.perVisitor,
                watermarkId: f.watermarkId || undefined,
                pin: f.pin || (f.id ? undefined : ""),
                printRelease: f.printRelease,
                showAll: f.showAll,
              }),
            () => setF(blank),
          );
        }}
      >
        <label>
          Rule name (visitors see it)
          <input value={f.name} maxLength={80} onChange={(e) => set("name", e.target.value)} />
        </label>
        <label>
          Applies to
          <select value={f.albumId} onChange={(e) => set("albumId", e.target.value)}>
            <option value="">Whole gallery</option>
            {albums.map((a) => (
              <option key={a.id} value={a.id}>
                Album: {a.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Longest side in pixels (blank = the original file)
          <input inputMode="numeric" value={f.maxPx} onChange={(e) => set("maxPx", e.target.value)} />
        </label>
        <label>
          Downloads per visitor (blank = unlimited)
          <input inputMode="numeric" value={f.perVisitor} onChange={(e) => set("perVisitor", e.target.value)} />
        </label>
        <label>
          Watermark
          <select value={f.watermarkId} onChange={(e) => set("watermarkId", e.target.value)}>
            <option value="">None</option>
            {watermarks.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          PIN (optional, 4 to 12 letters or digits{f.id ? "; blank keeps the current one" : ""})
          <input autoComplete="off" value={f.pin} onChange={(e) => set("pin", e.target.value)} />
        </label>
        <label className="gm-wide">
          Licence to accept before downloading (optional; **bold**, *italic*, [links](https://…) work)
          <textarea
            rows={5}
            maxLength={7500}
            value={f.printRelease}
            onChange={(e) => set("printRelease", e.target.value)}
          />
        </label>
        <label className="gm-check">
          <input type="checkbox" checked={f.showAll} onChange={(e) => set("showAll", e.target.checked)} /> Offer this
          rule in "Download all"
        </label>
        <div className="gm-row">
          <button type="submit" className="st-btn" disabled={pending}>
            {f.id ? "Save rule" : "Add rule"}
          </button>
          {f.id ? (
            <button type="button" className="st-btn st-btn--ghost" onClick={() => setF(blank)}>
              Cancel
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
