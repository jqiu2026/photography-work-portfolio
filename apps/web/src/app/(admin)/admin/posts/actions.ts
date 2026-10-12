"use server";

import { schema } from "@jerryqiu/db";
import { and, desc, eq, ne } from "drizzle-orm";
import { z } from "zod";
import type { ActionState } from "@/components/admin/form-kit";
import { blank, fdBool, fdList, fdStr, parseForm, readingMinutes, slug as slugRule, slugify } from "@/lib/action-utils";
import { touch } from "@/lib/revalidate";
import { guarded } from "@/auth";

const postSchema = z.object({
  id: z.string().uuid().or(z.literal("")),
  site: z.enum(["hub", "photos", "music", "flying"]),
  title: z.string().trim().min(1, "Required").max(160),
  slug: slugRule,
  subtitle: z.string().trim().max(240),
  summary: z.string().trim().max(400),
  body: z.string().max(200_000),
  status: z.enum(["draft", "scheduled", "published"]),
  publishAt: z.string().trim(),
  coverMediaId: z.string().uuid().or(z.literal("")),
  seoTitle: z.string().trim().max(120),
  seoDescription: z.string().trim().max(300),
});

const MAX_VERSIONS = 50;

function toDate(local: string): Date | null {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d;
}

type Snapshot = Record<string, unknown>;
const snapshotOf = (p: typeof schema.posts.$inferSelect): Snapshot => ({
  title: p.title,
  slug: p.slug,
  subtitle: p.subtitle,
  summary: p.summary,
  body: p.body,
  tags: p.tags,
  status: p.status,
  publishAt: p.publishAt,
  coverMediaId: p.coverMediaId,
  featured: p.featured,
  seo: p.seo,
});

/** Create or update a post. Records a version, and creates a redirect when a published post's slug changes. */
export async function savePost(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const raw = {
    id: fdStr(fd, "id"),
    site: fdStr(fd, "site") || "hub",
    title: fdStr(fd, "title"),
    slug: fdStr(fd, "slug") || slugify(fdStr(fd, "title")),
    subtitle: fdStr(fd, "subtitle"),
    summary: fdStr(fd, "summary"),
    body: fdStr(fd, "body"),
    status: fdStr(fd, "status") || "draft",
    publishAt: fdStr(fd, "publishAt"),
    coverMediaId: fdStr(fd, "coverMediaId"),
    seoTitle: fdStr(fd, "seoTitle"),
    seoDescription: fdStr(fd, "seoDescription"),
  };
  const r = parseForm(postSchema, raw);
  if (!r.ok) return r.state;
  const d = r.data;
  const publishAt = toDate(d.publishAt);
  if (d.status === "scheduled" && (!publishAt || publishAt.getTime() < Date.now() - 60_000)) {
    return {
      ok: false,
      error: "Check the highlighted fields.",
      fieldErrors: { publishAt: "Pick a future date and time to schedule" },
    };
  }
  if (d.status === "published" && (!d.summary || !d.body.trim())) {
    return {
      ok: false,
      error: "Check the highlighted fields.",
      fieldErrors: d.body.trim()
        ? { summary: "Add a short summary before publishing" }
        : { body: "Write something before publishing" },
    };
  }
  const tags = fdList(fd, "tags");
  const featured = fdBool(fd, "featured");
  const seo = { title: blank(d.seoTitle) ?? undefined, description: blank(d.seoDescription) ?? undefined };

  return guarded(d.status === "draft" ? "content.write" : "content.publish", async ({ db, user, audit }) => {
    const dupe = await db
      .select({ id: schema.posts.id })
      .from(schema.posts)
      .where(
        and(eq(schema.posts.site, d.site), eq(schema.posts.slug, d.slug), d.id ? ne(schema.posts.id, d.id) : undefined),
      )
      .limit(1);
    if (dupe.length)
      return {
        ok: false as const,
        error: "Check the highlighted fields.",
        fieldErrors: { slug: "Another post already uses this URL" },
      };

    const values = {
      site: d.site,
      slug: d.slug,
      title: d.title,
      subtitle: blank(d.subtitle),
      summary: blank(d.summary),
      body: d.body,
      tags,
      status: d.status,
      publishAt: d.status === "published" ? (publishAt ?? new Date()) : publishAt,
      featured,
      seo,
      coverMediaId: d.coverMediaId || null,
      readingMinutes: readingMinutes(d.body),
      updatedAt: new Date(),
      updatedBy: user.email,
    };
    let id = d.id;
    if (id) {
      const [before] = await db.select().from(schema.posts).where(eq(schema.posts.id, id)).limit(1);
      if (!before) return { ok: false as const, error: "That post no longer exists." };
      await db.update(schema.posts).set(values).where(eq(schema.posts.id, id));
      if (before.slug !== d.slug && before.status !== "draft") {
        await db
          .insert(schema.redirects)
          .values({ site: d.site, fromPath: `/writing/${before.slug}`, toPath: `/writing/${d.slug}`, permanent: true })
          .onConflictDoUpdate({
            target: [schema.redirects.site, schema.redirects.fromPath],
            set: { toPath: `/writing/${d.slug}` },
          });
        touch(["redirects"]);
      }
    } else {
      const [row] = await db.insert(schema.posts).values(values).returning({ id: schema.posts.id });
      id = row.id;
    }
    const [now] = await db.select().from(schema.posts).where(eq(schema.posts.id, id)).limit(1);
    const [last] = await db
      .select({ v: schema.postVersions.version })
      .from(schema.postVersions)
      .where(eq(schema.postVersions.postId, id))
      .orderBy(desc(schema.postVersions.version))
      .limit(1);
    await db
      .insert(schema.postVersions)
      .values({ postId: id, version: (last?.v ?? 0) + 1, snapshot: snapshotOf(now), createdBy: user.email });
    const old = await db
      .select({ id: schema.postVersions.id })
      .from(schema.postVersions)
      .where(eq(schema.postVersions.postId, id))
      .orderBy(desc(schema.postVersions.version))
      .offset(MAX_VERSIONS);
    for (const o of old) await db.delete(schema.postVersions).where(eq(schema.postVersions.id, o.id));
    await audit({
      action: d.id ? "post.update" : "post.create",
      entity: "post",
      entityId: id,
      site: d.site,
      summary: `${d.id ? "Updated" : "Created"} “${d.title}” (${d.status})`,
    });
    touch(["posts", "pages"], ["/", "/writing", `/writing/${d.slug}`, "/writing/rss.xml", "/sitemap.xml"]);
    return {
      ok: true as const,
      message: d.status === "published" ? "Published" : d.status === "scheduled" ? "Scheduled" : "Draft saved",
      redirectTo: d.id ? undefined : `/admin/posts/${id}`,
      id,
    };
  });
}

/** Silent autosave of a draft's text fields (no version, no publish, no status change). */
export async function autosavePost(
  id: string,
  patch: { title: string; body: string; summary: string },
): Promise<ActionState> {
  return guarded("content.write", async ({ db, user }) => {
    const [p] = await db
      .select({ status: schema.posts.status })
      .from(schema.posts)
      .where(eq(schema.posts.id, id))
      .limit(1);
    if (!p || p.status !== "draft") return { ok: false as const, error: "Autosave only applies to drafts." };
    await db
      .update(schema.posts)
      .set({
        title: patch.title.slice(0, 160) || "Untitled",
        body: patch.body.slice(0, 200_000),
        summary: patch.summary.slice(0, 400) || null,
        updatedAt: new Date(),
        updatedBy: user.email,
      })
      .where(eq(schema.posts.id, id));
    return { ok: true as const, message: "" };
  });
}

export async function deletePost(id: string): Promise<ActionState> {
  return guarded("content.write", async ({ db, user, audit }) => {
    const [p] = await db
      .update(schema.posts)
      .set({ deletedAt: new Date(), updatedBy: user.email })
      .where(eq(schema.posts.id, id))
      .returning({ title: schema.posts.title, slug: schema.posts.slug, site: schema.posts.site });
    await audit({
      action: "post.delete",
      entity: "post",
      entityId: id,
      site: p?.site,
      summary: `Moved “${p?.title}” to the trash`,
    });
    touch(["posts"], ["/", "/writing", `/writing/${p?.slug}`]);
    return { ok: true as const, message: "Moved to trash", redirectTo: "/admin/posts" };
  });
}

export async function restoreVersion(postId: string, versionId: string): Promise<ActionState> {
  return guarded("content.write", async ({ db, user, audit }) => {
    const [v] = await db
      .select()
      .from(schema.postVersions)
      .where(and(eq(schema.postVersions.id, versionId), eq(schema.postVersions.postId, postId)))
      .limit(1);
    if (!v) return { ok: false as const, error: "Version not found." };
    const s = v.snapshot as Record<string, never>;
    await db
      .update(schema.posts)
      .set({
        title: s.title,
        slug: s.slug,
        subtitle: s.subtitle ?? null,
        summary: s.summary ?? null,
        body: s.body,
        tags: s.tags ?? [],
        status: "draft",
        featured: Boolean(s.featured),
        seo: s.seo ?? null,
        coverMediaId: s.coverMediaId ?? null,
        readingMinutes: readingMinutes(String(s.body ?? "")),
        updatedAt: new Date(),
        updatedBy: user.email,
      })
      .where(eq(schema.posts.id, postId));
    await audit({
      action: "post.restore_version",
      entity: "post",
      entityId: postId,
      summary: `Restored version ${v.version} as a draft`,
    });
    touch(["posts"], ["/writing"]);
    return { ok: true as const, message: `Restored version ${v.version} as a draft` };
  });
}
