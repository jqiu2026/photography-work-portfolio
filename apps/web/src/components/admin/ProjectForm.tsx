"use client";

import { Button, Input, Select, Textarea } from "@halation/ui";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteProject, saveProject } from "@/app/(admin)/admin/projects/actions";
import { slugify } from "@/lib/slugify";
import { ActionForm, ConfirmButton, F, FieldE } from "./form-kit";
import { MediaPicker } from "./MediaPicker";

type Block =
  | { type: "text"; markdown: string }
  | { type: "image"; mediaId: string; caption?: string }
  | { type: "gallery"; mediaIds: string[] }
  | { type: "quote"; text: string; cite?: string }
  | { type: "video"; provider: "youtube" | "vimeo"; id: string; title: string }
  | { type: "columns"; left: string; right: string };
type Credit = { name: string; role: string; url?: string };

export type ProjectValues = {
  id?: string;
  title: string;
  slug: string;
  type: string;
  summary: string;
  date: string;
  client: string;
  role: string;
  category: string;
  coverMediaId: string | null;
  status: "draft" | "published";
  featured: boolean;
  protectedPage: boolean;
  sort: number;
  related: string[];
  blocks: Block[];
  credits: Credit[];
};

const newBlock = (type: Block["type"]): Block =>
  type === "text"
    ? { type, markdown: "" }
    : type === "image"
      ? { type, mediaId: "", caption: "" }
      : type === "gallery"
        ? { type, mediaIds: [] }
        : type === "quote"
          ? { type, text: "", cite: "" }
          : type === "video"
            ? { type, provider: "youtube", id: "", title: "" }
            : { type, left: "", right: "" };

const labels: Record<Block["type"], string> = {
  text: "Text",
  image: "Image",
  gallery: "Gallery",
  quote: "Quote",
  video: "Video",
  columns: "Two columns",
};
const move = <T,>(a: T[], i: number, d: number) => {
  const j = i + d;
  if (j < 0 || j >= a.length) return a;
  const c = a.slice();
  [c[i], c[j]] = [c[j], c[i]];
  return c;
};

function BlockEditor({ blocks, onChange }: { blocks: Block[]; onChange: (b: Block[]) => void }) {
  const set = (i: number, b: Block) => onChange(blocks.map((x, n) => (n === i ? b : x)));
  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      {blocks.map((b, i) => (
        <div key={`${i}-${b.type}`} className="adm-card" style={{ padding: "1rem" }}>
          <div
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}
          >
            <strong>{labels[b.type]}</strong>
            <span style={{ display: "flex", gap: "0.25rem" }}>
              <Button
                type="button"
                size="sm"
                variant="quiet"
                aria-label="Move up"
                onClick={() => onChange(move(blocks, i, -1))}
              >
                <ArrowUp size={14} />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="quiet"
                aria-label="Move down"
                onClick={() => onChange(move(blocks, i, 1))}
              >
                <ArrowDown size={14} />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="quiet"
                aria-label="Remove block"
                onClick={() => onChange(blocks.filter((_, n) => n !== i))}
              >
                <Trash2 size={14} />
              </Button>
            </span>
          </div>
          {b.type === "text" ? (
            <Textarea
              rows={6}
              aria-label="Text (Markdown)"
              value={b.markdown}
              onChange={(e) => set(i, { ...b, markdown: e.target.value })}
            />
          ) : null}
          {b.type === "image" ? (
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <MediaPicker label="Image" defaultValue={b.mediaId} onPick={(m) => set(i, { ...b, mediaId: m.id })} />
              <Input
                aria-label="Caption"
                placeholder="Caption (optional)"
                value={b.caption ?? ""}
                onChange={(e) => set(i, { ...b, caption: e.target.value })}
              />
            </div>
          ) : null}
          {b.type === "gallery" ? (
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {b.mediaIds.map((id, k) => (
                  <span key={`${id}-${k}`} style={{ position: "relative" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/admin/media/${id}/file?w=480`}
                      alt=""
                      style={{ width: 84, height: 60, objectFit: "cover", borderRadius: 3 }}
                    />
                    <button
                      type="button"
                      aria-label="Remove image"
                      onClick={() => set(i, { ...b, mediaIds: b.mediaIds.filter((_, n) => n !== k) })}
                      style={{
                        position: "absolute",
                        top: 2,
                        right: 2,
                        border: 0,
                        borderRadius: "50%",
                        width: 20,
                        height: 20,
                        cursor: "pointer",
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <MediaPicker label="Images" multiple onPick={(m) => set(i, { ...b, mediaIds: [...b.mediaIds, m.id] })} />
            </div>
          ) : null}
          {b.type === "quote" ? (
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <Textarea
                rows={3}
                aria-label="Quote"
                value={b.text}
                onChange={(e) => set(i, { ...b, text: e.target.value })}
              />
              <Input
                aria-label="Who said it"
                placeholder="Who said it (real quotes only)"
                value={b.cite ?? ""}
                onChange={(e) => set(i, { ...b, cite: e.target.value })}
              />
            </div>
          ) : null}
          {b.type === "video" ? (
            <div className="adm-grid2">
              <Input
                aria-label="YouTube video id"
                placeholder="YouTube video id"
                value={b.id}
                onChange={(e) => set(i, { ...b, id: e.target.value.trim() })}
              />
              <Input
                aria-label="Video title"
                placeholder="Title"
                value={b.title}
                onChange={(e) => set(i, { ...b, title: e.target.value })}
              />
            </div>
          ) : null}
          {b.type === "columns" ? (
            <div className="adm-grid2">
              <Textarea
                rows={5}
                aria-label="Left column"
                value={b.left}
                onChange={(e) => set(i, { ...b, left: e.target.value })}
              />
              <Textarea
                rows={5}
                aria-label="Right column"
                value={b.right}
                onChange={(e) => set(i, { ...b, right: e.target.value })}
              />
            </div>
          ) : null}
        </div>
      ))}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }} role="group" aria-label="Add a block">
        {(Object.keys(labels) as Block["type"][]).map((t) => (
          <Button key={t} type="button" size="sm" variant="ghost" onClick={() => onChange([...blocks, newBlock(t)])}>
            + {labels[t]}
          </Button>
        ))}
      </div>
    </div>
  );
}

function CreditsEditor({ credits, onChange }: { credits: Credit[]; onChange: (c: Credit[]) => void }) {
  const set = (i: number, c: Credit) => onChange(credits.map((x, n) => (n === i ? c : x)));
  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      {credits.map((c, i) => (
        <div key={`${i}-${c.name}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "0.5rem" }}>
          <Input
            aria-label="Name"
            placeholder="Name"
            value={c.name}
            onChange={(e) => set(i, { ...c, name: e.target.value })}
          />
          <Input
            aria-label="Role"
            placeholder="Role"
            value={c.role}
            onChange={(e) => set(i, { ...c, role: e.target.value })}
          />
          <Input
            aria-label="Link"
            placeholder="Link (optional)"
            value={c.url ?? ""}
            onChange={(e) => set(i, { ...c, url: e.target.value })}
          />
          <Button
            type="button"
            variant="quiet"
            aria-label="Remove credit"
            onClick={() => onChange(credits.filter((_, n) => n !== i))}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ))}
      <div>
        <Button type="button" size="sm" variant="ghost" onClick={() => onChange([...credits, { name: "", role: "" }])}>
          + Add credit
        </Button>
      </div>
    </div>
  );
}

const types = ["photography", "software", "design", "writing", "other"].map((v) => ({
  value: v,
  label: v[0].toUpperCase() + v.slice(1),
}));

export function ProjectForm({ values }: { values: ProjectValues }) {
  const [title, setTitle] = useState(values.title);
  const [slug, setSlug] = useState(values.slug);
  const [touched, setTouched] = useState(Boolean(values.id));
  const [blocks, setBlocks] = useState<Block[]>(values.blocks);
  const [credits, setCredits] = useState<Credit[]>(values.credits);
  return (
    <ActionForm
      action={saveProject}
      secondary={
        values.id ? (
          <ConfirmButton
            label="Delete"
            confirm="Move this project to the trash?"
            action={() => deleteProject(values.id as string)}
          />
        ) : undefined
      }
    >
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}
      <input type="hidden" name="blocks" value={JSON.stringify(blocks)} />
      <input type="hidden" name="credits" value={JSON.stringify(credits.filter((c) => c.name.trim()))} />
      <FieldE name="title" label="Title" required>
        <Input
          name="title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (!touched) setSlug(slugify(e.target.value));
          }}
        />
      </FieldE>
      <FieldE name="slug" label="URL" hint={`/work/${slug || "…"}`} required>
        <Input
          name="slug"
          value={slug}
          onChange={(e) => {
            setTouched(true);
            setSlug(e.target.value);
          }}
        />
      </FieldE>
      <F
        name="summary"
        label="Summary"
        type="textarea"
        rows={2}
        defaultValue={values.summary}
        hint="e.g. “Theater photography”. Shown on cards."
      />
      <div className="adm-grid2">
        <FieldE name="type" label="Type">
          <Select name="type" defaultValue={values.type}>
            {types.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </FieldE>
        <F name="date" label="Date" type="date" defaultValue={values.date} />
      </div>
      <div className="adm-grid2">
        <F name="client" label="Client / event" defaultValue={values.client} />
        <F name="role" label="My role" defaultValue={values.role} />
      </div>
      <F name="category" label="Category" defaultValue={values.category} />
      <MediaPicker name="coverMediaId" label="Cover image" defaultValue={values.coverMediaId} />
      <div>
        <span className="hl-field__label">Body</span>
        <div style={{ marginTop: "0.5rem" }}>
          <BlockEditor blocks={blocks} onChange={setBlocks} />
        </div>
      </div>
      <div>
        <span className="hl-field__label">Credits</span>
        <div style={{ marginTop: "0.5rem" }}>
          <CreditsEditor credits={credits} onChange={setCredits} />
        </div>
      </div>
      <F
        name="related"
        label="Related projects"
        defaultValue={values.related.join(", ")}
        hint="Comma separated project URLs (slugs)."
      />
      <div className="adm-grid2">
        <FieldE name="status" label="Status">
          <Select name="status" defaultValue={values.status}>
            <option value="draft">Draft (not public)</option>
            <option value="published">Published</option>
          </Select>
        </FieldE>
        <F
          name="sort"
          label="Order"
          type="number"
          defaultValue={values.sort}
          min={0}
          hint="Higher numbers come first."
        />
      </div>
      <F name="featured" label="Featured on the home page" type="checkbox" defaultValue={values.featured} />
      <F
        name="protectedPage"
        label="Password protected"
        type="checkbox"
        defaultValue={values.protectedPage}
        hint="Visitors need the shared password (PAGE_ACCESS_PASSWORD)."
      />
    </ActionForm>
  );
}
