"use client";

import { ProtectedImage } from "@halation/ui/media";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { newGalleryAction } from "@/app/studio/gallery-actions";
import { Frame, useAct } from "./StudioFrame";
import "./galleries.css";

export type GalleryCard = {
  id: string;
  title: string;
  jobTitle: string;
  state: string;
  expiresAt: string | null;
  publishAt: string | null;
  createdAt: string;
  photos: number;
  favourites: number;
  downloads: number;
  views: number;
  cover: { id: string; width: number; height: number; color: string | null; blur: string | null } | null;
};

const FILTERS = [
  ["all", "All"],
  ["draft", "Drafts"],
  ["live", "Live"],
  ["expiring", "Expiring"],
  ["archived", "Archived"],
] as const;
const LABEL: Record<string, string> = {
  draft: "Draft",
  live: "Live",
  expiring: "Expiring",
  expired: "Expired",
  archived: "Archived",
};

/** All client galleries as cover cards: search, filter by state, sort. New galleries start empty; photographs come after, inside the gallery. */
export function GalleriesView({
  galleries,
  jobs,
}: { galleries: GalleryCard[]; jobs: { id: string; title: string; client: string }[] }) {
  const router = useRouter();
  const { pending, note, act } = useAct();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>("all");
  const [sort, setSort] = useState("newest");
  const [open, setOpen] = useState(false);
  // "+ New gallery" in the studio toolbar arrives with ?new=1
  useEffect(() => {
    if (new URLSearchParams(location.search).has("new")) setOpen(true);
  }, []);
  const [job, setJob] = useState(jobs[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [made, setMade] = useState<{ id: string; passcode: string } | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: galleries.length };
    for (const g of galleries) {
      const key = g.state === "expired" ? "archived" : g.state;
      c[key] = (c[key] ?? 0) + 1;
    }
    return c;
  }, [galleries]);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return galleries
      .filter((g) => (filter === "all" ? true : (g.state === "expired" ? "archived" : g.state) === filter))
      .filter((g) => !needle || `${g.title} ${g.jobTitle}`.toLowerCase().includes(needle))
      .sort((a, b) =>
        sort === "name"
          ? a.title.localeCompare(b.title)
          : sort === "expiring"
            ? (a.expiresAt ?? "9999").localeCompare(b.expiresAt ?? "9999")
            : sort === "favourites"
              ? b.favourites - a.favourites
              : b.createdAt.localeCompare(a.createdAt),
      );
  }, [galleries, q, filter, sort]);

  function create(e: React.FormEvent) {
    e.preventDefault();
    act(
      async () => {
        const r = await newGalleryAction({ jobId: job, title });
        if (r.ok) setMade({ id: String(r.galleryId), passcode: String(r.passcode) });
        return r;
      },
      () => {
        setTitle("");
        setOpen(false);
      },
    );
  }

  return (
    <Frame section="galleries" note={note}>
      {made ? (
        <section className="gl-made" role="status" aria-label="Gallery created">
          <p>
            Gallery created. Client passcode: <code>{made.passcode}</code>
          </p>
          <p className="st-note">
            This is the only time it is shown (it is stored hashed). You can make a new one later.
          </p>
          <div className="st-actions">
            <button type="button" className="st-btn" onClick={() => router.push(`/studio/gallery/${made.id}`)}>
              Open the gallery
            </button>
            <button type="button" className="st-btn st-btn--ghost" onClick={() => setMade(null)}>
              Dismiss
            </button>
          </div>
        </section>
      ) : null}

      <div className="gl-bar">
        <input
          type="search"
          aria-label="Search galleries"
          placeholder="Search galleries"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="gl-filters" role="group" aria-label="Filter by state">
          {FILTERS.map(([k, label]) => (
            <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}>
              {label} <span>{counts[k] ?? 0}</span>
            </button>
          ))}
        </div>
        <select aria-label="Sort galleries" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest</option>
          <option value="name">Name</option>
          <option value="expiring">Expiring soon</option>
          <option value="favourites">Most favourites</option>
        </select>
        <button type="button" className="st-btn" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          New gallery
        </button>
      </div>

      {open ? (
        jobs.length ? (
          <form className="gl-new" onSubmit={create} aria-label="New gallery" noValidate>
            <label>
              Job
              <select value={job} onChange={(e) => setJob(e.target.value)}>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} · {j.client}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Title (optional, defaults to the job)
              <input value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <button type="submit" className="st-btn" disabled={pending}>
              Create
            </button>
            <p className="st-note">You upload the photographs and set everything else inside the gallery.</p>
          </form>
        ) : (
          <p className="st-note">
            A gallery belongs to a job. <Link href="/studio/shoots">Add a client and a job first.</Link>
          </p>
        )
      ) : null}

      {shown.length ? (
        <ul className="gl-grid" aria-label="Galleries">
          {shown.map((g, i) => (
            <li key={g.id} style={{ "--i": Math.min(i, 12) } as React.CSSProperties}>
              <Link href={`/studio/gallery/${g.id}`} className="gl-card">
                <span className="gl-cover">
                  {g.cover ? (
                    <ProtectedImage
                      asset={{
                        id: g.cover.id,
                        width: g.cover.width,
                        height: g.cover.height,
                        color: g.cover.color ?? undefined,
                        blur: g.cover.blur ?? undefined,
                        files: [],
                      }}
                      alt=""
                      fill
                      fit="cover"
                    />
                  ) : (
                    <span className="gl-empty">No photographs yet</span>
                  )}
                  <em className="gl-chip" data-state={g.state}>
                    {LABEL[g.state] ?? g.state}
                  </em>
                </span>
                <strong>{g.title}</strong>
                <small>{g.jobTitle}</small>
                <small className="gl-meta">
                  {g.photos} photos
                  {g.favourites ? ` · ${g.favourites} ♥` : ""}
                  {g.views ? ` · ${g.views} views` : ""}
                  {g.downloads ? ` · ${g.downloads} downloads` : ""}
                </small>
                <small className="gl-meta">
                  {g.publishAt && g.state === "draft"
                    ? `Publishes ${g.publishAt.slice(0, 10)}`
                    : g.expiresAt
                      ? `Until ${g.expiresAt}`
                      : "No expiry"}
                </small>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="gl-none">
          {galleries.length
            ? "No galleries match."
            : "No galleries yet. Create one, then upload photographs inside it."}
        </p>
      )}
    </Frame>
  );
}
