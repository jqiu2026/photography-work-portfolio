"use client";

import { ProtectedImage } from "@/components/media";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  CopyIcon,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  EmptyState,
  Field,
  GalleryCard as CoverCard,
  GalleryCover,
  GalleryGrid,
  GalleryItem,
  GalleryMeta,
  GalleryTitle,
  Input,
  Segment,
  SegmentedControl,
  Select,
} from "@holominimal/ui";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { newGalleryAction } from "@/app/studio/gallery-actions";
import { FormMessage } from "@/components/ui";
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
  favorites: number;
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

const TONE: Record<string, "success" | "warning" | "neutral" | "muted"> = {
  live: "success",
  expiring: "warning",
  draft: "neutral",
  expired: "muted",
  archived: "muted",
};

/** All client galleries as cover cards: search, filter by state, sort. New galleries start empty; photographs come after, inside the gallery. */
export function GalleriesView({
  galleries,
  jobs,
}: { galleries: GalleryCard[]; jobs: { id: string; title: string; client: string }[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const { pending, note, act } = useAct();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>("all");
  const [sort, setSort] = useState("newest");
  const [open, setOpen] = useState(false);
  // "New gallery" in the studio toolbar and on the dashboard arrives with ?new=1
  useEffect(() => {
    if (params.has("new")) setOpen(true);
  }, [params]);
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
            : sort === "favorites"
              ? b.favorites - a.favorites
              : b.createdAt.localeCompare(a.createdAt),
      );
  }, [galleries, q, filter, sort]);

  function close() {
    setOpen(false);
    if (params.has("new")) router.replace("/studio/galleries", { scroll: false });
  }
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
        close();
      },
    );
  }

  return (
    <Frame section="galleries" note={made ? null : note}>
      {made ? (
        <Alert tone="success" role="status" aria-label="Gallery created" className="gl-made">
          <AlertTitle>Gallery created</AlertTitle>
          <AlertDescription>
            Client passcode: <code>{made.passcode}</code>. This is the only time it is shown (it is stored hashed); you
            can make a new one later.
          </AlertDescription>
          <div className="gl-made__actions">
            <Button onClick={() => router.push(`/studio/gallery/${made.id}`)}>Open the gallery</Button>
            <Button variant="secondary" onClick={() => navigator.clipboard?.writeText(made.passcode)}>
              <CopyIcon /> Copy passcode
            </Button>
            <Button variant="ghost" onClick={() => setMade(null)}>
              Dismiss
            </Button>
          </div>
        </Alert>
      ) : null}

      <div className="gl-bar">
        <Input
          type="search"
          aria-label="Search galleries"
          placeholder="Search galleries"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="gl-search"
        />
        <SegmentedControl
          aria-label="Filter by state"
          value={filter}
          onValueChange={(v) => setFilter(v as typeof filter)}
        >
          {FILTERS.map(([k, label]) => (
            <Segment key={k} value={k}>
              {label} <span className="gl-count">{counts[k] ?? 0}</span>
            </Segment>
          ))}
        </SegmentedControl>
        <Select aria-label="Sort galleries" value={sort} onValueChange={setSort} className="gl-sort">
          <option value="newest">Newest</option>
          <option value="name">Name</option>
          <option value="expiring">Expiring soon</option>
          <option value="favorites">Most favorites</option>
        </Select>
      </div>

      <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
        <DialogContent size="sm">
          <DialogTitle>New gallery</DialogTitle>
          {jobs.length ? (
            <form className="st-stack" onSubmit={create} aria-label="New gallery" noValidate>
              <DialogDescription>
                A gallery belongs to a job. You upload the photographs and set everything else inside it.
              </DialogDescription>
              <Field label="Job">
                <Select value={job} onValueChange={setJob}>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} · {j.client}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Title" hint="Optional. Defaults to the job's name.">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </Field>
              {note && !note.ok ? <FormMessage className="st-error">{note.error}</FormMessage> : null}
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={close}>
                  Cancel
                </Button>
                <Button type="submit" loading={pending}>
                  Create
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <>
              <DialogDescription>A gallery belongs to a job, and there are no jobs yet.</DialogDescription>
              <DialogFooter>
                <Button asChild>
                  <Link href="/studio/shoots">Add a client and a job</Link>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {shown.length ? (
        <GalleryGrid aria-label="Galleries">
          {shown.map((g, i) => (
            <GalleryItem key={g.id} index={i}>
              <CoverCard asChild>
                <Link href={`/studio/gallery/${g.id}`}>
                  <GalleryCover
                    empty="No photographs yet"
                    badge={
                      <Badge tone={TONE[g.state] ?? "neutral"} appearance="overlay">
                        {LABEL[g.state] ?? g.state}
                      </Badge>
                    }
                  >
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
                    ) : undefined}
                  </GalleryCover>
                  <GalleryTitle>{g.title}</GalleryTitle>
                  <GalleryMeta>{g.jobTitle}</GalleryMeta>
                  <GalleryMeta>
                    {g.photos} photos
                    {g.favorites ? ` · ${g.favorites} favorites` : ""}
                    {g.views ? ` · ${g.views} views` : ""}
                    {g.downloads ? ` · ${g.downloads} downloads` : ""}
                  </GalleryMeta>
                  <GalleryMeta>
                    {g.publishAt && g.state === "draft"
                      ? `Publishes ${g.publishAt.slice(0, 10)}`
                      : g.expiresAt
                        ? `Until ${g.expiresAt}`
                        : "No expiry"}
                  </GalleryMeta>
                </Link>
              </CoverCard>
            </GalleryItem>
          ))}
        </GalleryGrid>
      ) : (
        <EmptyState>
          {galleries.length ? (
            "No galleries match."
          ) : (
            <>
              No galleries yet.{" "}
              <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
                Create the first one
              </Button>
            </>
          )}
        </EmptyState>
      )}
    </Frame>
  );
}
