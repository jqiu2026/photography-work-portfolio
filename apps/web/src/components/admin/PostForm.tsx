"use client";

import { Button } from "@/components/kit";
import { Input, Select, Textarea } from "@/components/kit-client";

import { type RefObject, useEffect, useRef, useState } from "react";
import { RenderMarkdown } from "@jerryqiu/render";
import { autosavePost, deletePost, savePost } from "@/app/(admin)/admin/posts/actions";
import { slugify } from "@/lib/slugify";
import { ActionForm, ConfirmButton, ErrorFor, F, FieldE } from "./form-kit";
import { MediaPicker } from "./MediaPicker";

export type PostValues = {
  id?: string;
  site: string;
  title: string;
  slug: string;
  subtitle: string;
  summary: string;
  body: string;
  tags: string[];
  status: "draft" | "scheduled" | "published";
  publishAt: string;
  featured: boolean;
  coverMediaId: string | null;
  seoTitle: string;
  seoDescription: string;
};

/** Wraps the current selection of a textarea. */
function wrap(el: HTMLTextAreaElement, before: string, after = before, placeholder = "text") {
  const { selectionStart: a, selectionEnd: b, value } = el;
  const sel = value.slice(a, b) || placeholder;
  el.setRangeText(`${before}${sel}${after}`, a, b, "select");
  el.focus();
  el.dispatchEvent(new Event("input", { bubbles: true }));
}
function prefixLines(el: HTMLTextAreaElement, prefix: string) {
  const { selectionStart: a, selectionEnd: b, value } = el;
  const start = value.lastIndexOf("\n", a - 1) + 1;
  const block = value.slice(start, b) || "item";
  el.setRangeText(
    block
      .split("\n")
      .map((l) => `${prefix}${l}`)
      .join("\n"),
    start,
    b,
    "end",
  );
  el.focus();
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

function Toolbar({ target }: { target: RefObject<HTMLTextAreaElement | null> }) {
  const run = (fn: (el: HTMLTextAreaElement) => void) => () => target.current && fn(target.current);
  const btn = (label: string, title: string, fn: (el: HTMLTextAreaElement) => void) => (
    <Button key={label} type="button" size="sm" variant="ghost" onClick={run(fn)} aria-label={title} title={title}>
      {label}
    </Button>
  );
  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginBottom: "0.5rem" }}
    >
      {btn("B", "Bold", (e) => wrap(e, "**"))}
      {btn("I", "Italic", (e) => wrap(e, "*"))}
      {btn("H2", "Heading", (e) => prefixLines(e, "## "))}
      {btn("H3", "Subheading", (e) => prefixLines(e, "### "))}
      {btn("“ ”", "Quote", (e) => prefixLines(e, "> "))}
      {btn("• List", "Bulleted list", (e) => prefixLines(e, "- "))}
      {btn("Link", "Link", (e) => wrap(e, "[", "](https://)", "link text"))}
      {btn("Video", "YouTube video (click-to-load)", (e) => wrap(e, "\n\n[[youtube ", "]]\n\n", "VIDEO_ID"))}
    </div>
  );
}

/** Autosaves a draft every 30 seconds while it has unsaved edits (existing drafts only). */
function AutoSave({ id, enabled }: { id: string; enabled: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const last = useRef("");
  const [at, setAt] = useState<Date | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const t = setInterval(async () => {
      const form = ref.current?.closest("form");
      if (!form) return;
      const fd = new FormData(form);
      const patch = {
        title: String(fd.get("title") ?? ""),
        body: String(fd.get("body") ?? ""),
        summary: String(fd.get("summary") ?? ""),
      };
      const key = JSON.stringify(patch);
      if (key === last.current) return;
      if (!last.current) {
        last.current = key;
        return;
      }
      const r = await autosavePost(id, patch);
      if (r.ok) {
        last.current = key;
        setAt(new Date());
      }
    }, 30_000);
    return () => clearInterval(t);
  }, [id, enabled]);
  return (
    <span ref={ref} className="adm-note" aria-live="polite">
      {at ? `Autosaved ${at.toLocaleTimeString()}` : ""}
    </span>
  );
}

export function PostForm({ values }: { values: PostValues }) {
  const [title, setTitle] = useState(values.title);
  const [slug, setSlug] = useState(values.slug);
  const [touched, setTouched] = useState(Boolean(values.id));
  const [body, setBody] = useState(values.body);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [status, setStatus] = useState(values.status);
  const area = useRef<HTMLTextAreaElement>(null);

  return (
    <ActionForm
      action={savePost}
      submitLabel={status === "published" ? "Publish" : status === "scheduled" ? "Schedule" : "Save draft"}
      secondary={
        values.id ? (
          <ConfirmButton
            label="Delete"
            confirm="Move this post to the trash?"
            action={() => deletePost(values.id as string)}
          />
        ) : undefined
      }
    >
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}
      <input type="hidden" name="site" value={values.site} />
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
      <F name="subtitle" label="Subtitle" defaultValue={values.subtitle} />
      <FieldE name="slug" label="URL" hint={`/writing/${slug || "…"}`} required>
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
        hint="Shown in lists, search results and link previews. Required to publish."
      />
      <MediaPicker name="coverMediaId" label="Cover image" defaultValue={values.coverMediaId} />
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}>
          <span className="hm-field-label">Body (Markdown)</span>
          <div role="tablist" aria-label="Editor mode" style={{ display: "flex", gap: "0.25rem" }}>
            {(["write", "preview"] as const).map((m) => (
              <Button
                key={m}
                type="button"
                size="sm"
                variant={mode === m ? "solid" : "ghost"}
                onClick={() => setMode(m)}
                role="tab"
                aria-selected={mode === m}
              >
                {m === "write" ? "Write" : "Preview"}
              </Button>
            ))}
          </div>
        </div>
        <div hidden={mode !== "write"} style={{ marginTop: "0.5rem" }}>
          <Toolbar target={area} />
          <Textarea
            ref={area}
            name="body"
            rows={20}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            style={{ fontFamily: "var(--hm-font-mono)", fontSize: "var(--hm-text-sm)" }}
            aria-label="Body"
          />
        </div>
        {mode === "preview" ? (
          <div
            style={{
              border: "1px solid var(--hm-line-strong)",
              borderRadius: 4,
              padding: "1.5rem",
              marginTop: "0.5rem",
            }}
          >
            {body.trim() ? <RenderMarkdown source={body} /> : <p className="adm-note">Nothing to preview yet.</p>}
          </div>
        ) : null}
        <ErrorFor name="body" />
        <p className="adm-note" style={{ marginTop: "0.4rem" }}>
          Markdown only (no HTML). Add a YouTube video on its own line with <code>[[youtube VIDEO_ID]]</code>; it loads
          only when a visitor presses play.
        </p>
      </div>
      <F name="tags" label="Tags" defaultValue={values.tags.join(", ")} hint="Comma separated." />
      <div className="adm-grid2">
        <FieldE name="status" label="Status">
          <Select name="status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="draft">Draft (not public)</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
          </Select>
        </FieldE>
        <F
          name="publishAt"
          label={status === "scheduled" ? "Publish on" : "Published on"}
          type="text"
          defaultValue={values.publishAt}
          placeholder="2026-12-01T09:00"
          hint="Local date and time (YYYY-MM-DDTHH:MM)."
        />
      </div>
      <F name="featured" label="Featured on the home page" type="checkbox" defaultValue={values.featured} />
      <details>
        <summary style={{ cursor: "pointer", padding: "0.5rem 0" }}>Search and sharing (optional)</summary>
        <div style={{ display: "grid", gap: "1rem", marginTop: "0.75rem" }}>
          <F name="seoTitle" label="Search title" defaultValue={values.seoTitle} hint="Defaults to the post title." />
          <F
            name="seoDescription"
            label="Search description"
            type="textarea"
            rows={2}
            defaultValue={values.seoDescription}
            hint="Defaults to the summary."
          />
        </div>
      </details>
      {values.id ? <AutoSave id={values.id} enabled={status === "draft"} /> : null}
    </ActionForm>
  );
}
