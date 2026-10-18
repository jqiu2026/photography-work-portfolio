"use client";

import { Button, Checkbox, Field, Input, Select, SettingsSection, Text, Textarea } from "@holominimal/ui";

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
    <SettingsSection title="Free downloads" className="gm-block">
      <Text size="sm" tone="muted">
        Rules decide who may download for free. With no rule, visitors cannot download (they can still buy in the
        Store). The client's own downloads are set below.
      </Text>
      {rules.length ? (
        <ul className="hm-data-list st-list" aria-label="Download rules">
          {rules.map((r) => (
            <li className="hm-data-list-item" key={r.id}>
              <span>
                {r.name}
                <small>
                  {r.albumId ? `Album: ${albums.find((a) => a.id === r.albumId)?.name ?? "?"}` : "Whole gallery"} ·{" "}
                  {r.maxPx ? `${r.maxPx} px` : "original"} · {r.perVisitor ? `${r.perVisitor} each` : "unlimited"}
                  {wm(r.watermarkId) ? ` · ${wm(r.watermarkId)}` : ""}
                  {r.hasPin ? " · PIN" : ""}
                </small>
              </span>
              <Button variant="secondary" onClick={() => edit(r)}>
                Edit
              </Button>
              <Button
                variant="secondary"
                disabled={pending}
                onClick={() => run(() => deleteRuleAction({ galleryId, id: r.id }))}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <Text size="sm" tone="muted">
          No rules yet.
        </Text>
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
        <Field label="Rule name (visitors see it)">
          <Input value={f.name} maxLength={80} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Applies to">
          <Select value={f.albumId} onValueChange={(v) => set("albumId", v)}>
            <option value="">Whole gallery</option>
            {albums.map((a) => (
              <option key={a.id} value={a.id}>
                Album: {a.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Longest side in pixels (blank = the original file)">
          <Input inputMode="numeric" value={f.maxPx} onChange={(e) => set("maxPx", e.target.value)} />
        </Field>
        <Field label="Downloads per visitor (blank = unlimited)">
          <Input inputMode="numeric" value={f.perVisitor} onChange={(e) => set("perVisitor", e.target.value)} />
        </Field>
        <Field label="Watermark">
          <Select value={f.watermarkId} onValueChange={(v) => set("watermarkId", v)}>
            <option value="">None</option>
            {watermarks.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={<>PIN (optional, 4 to 12 letters or digits{f.id ? "; blank keeps the current one" : ""})</>}>
          <Input autoComplete="off" value={f.pin} onChange={(e) => set("pin", e.target.value)} />
        </Field>
        <Field
          label="Licence to accept before downloading (optional; **bold**, *italic*, [links](https://…) work)"
          className="gm-wide"
        >
          <Textarea
            rows={5}
            maxLength={7500}
            value={f.printRelease}
            onChange={(e) => set("printRelease", e.target.value)}
          />
        </Field>
        <Checkbox
          checked={f.showAll}
          onChange={(e) => set("showAll", e.target.checked)}
          label={'Offer this rule in "Download all"'}
        />
        <div className="gm-row">
          <Button type="submit" disabled={pending}>
            {f.id ? "Save rule" : "Add rule"}
          </Button>
          {f.id ? (
            <Button variant="secondary" onClick={() => setF(blank)}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>
    </SettingsSection>
  );
}
