"use server";

import { type Block, schema } from "@jerryqiu/db";
import { and, desc, eq, ne } from "drizzle-orm";
import { z } from "zod";
import type { ActionState } from "@/components/admin/form-kit";
import { blank, fdBool, fdList, fdStr, optionalUrl, parseForm, slug as slugRule, slugify } from "@/lib/action-utils";
import { touch } from "@/lib/revalidate";
import { guarded } from "@/auth";

const uuid = z.string().uuid();
const blockSchema: z.ZodType<Block> = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), markdown: z.string().max(50_000) }),
  z.object({ type: z.literal("image"), mediaId: uuid, caption: z.string().max(300).optional() }),
  z.object({ type: z.literal("gallery"), mediaIds: z.array(uuid).max(60) }),
  z.object({ type: z.literal("quote"), text: z.string().max(600), cite: z.string().max(120).optional() }),
  z.object({
    type: z.literal("video"),
    provider: z.enum(["youtube", "vimeo"]),
    id: z.string().regex(/^[\w-]{6,20}$/, "Not a valid video id"),
    title: z.string().max(120),
  }),
  z.object({ type: z.literal("columns"), left: z.string().max(20_000), right: z.string().max(20_000) }),
]);
const creditSchema = z.object({
  name: z.string().trim().min(1).max(80),
  role: z.string().trim().max(80),
  url: optionalUrl.optional(),
});

const projectSchema = z.object({
  id: z.string().uuid().or(z.literal("")),
  title: z.string().trim().min(1, "Required").max(160),
  slug: slugRule,
  type: z.enum(["photography", "software", "design", "writing", "other"]),
  summary: z.string().trim().max(400),
  date: z
    .string()
    .trim()
    .regex(/^(\d{4}-\d{2}-\d{2})?$/, "Use YYYY-MM-DD"),
  client: z.string().trim().max(120),
  role: z.string().trim().max(120),
  category: z.string().trim().max(60),
  coverMediaId: uuid.or(z.literal("")),
  status: z.enum(["draft", "published"]),
  sort: z.coerce.number().int().min(0).max(9999),
  blocks: z.array(blockSchema).max(80),
  credits: z.array(creditSchema).max(20),
});

function json<T>(s: string, fallback: T): T {
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

const snap = (p: typeof schema.projects.$inferSelect) => ({
  title: p.title,
  slug: p.slug,
  type: p.type,
  summary: p.summary,
  date: p.date,
  client: p.client,
  role: p.role,
  category: p.category,
  coverMediaId: p.coverMediaId,
  blocks: p.blocks,
  credits: p.credits,
  related: p.related,
  status: p.status,
  featured: p.featured,
  sort: p.sort,
});

export async function saveProject(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const r = parseForm(projectSchema, {
    id: fdStr(fd, "id"),
    title: fdStr(fd, "title"),
    slug: fdStr(fd, "slug") || slugify(fdStr(fd, "title")),
    type: fdStr(fd, "type") || "photography",
    summary: fdStr(fd, "summary"),
    date: fdStr(fd, "date"),
    client: fdStr(fd, "client"),
    role: fdStr(fd, "role"),
    category: fdStr(fd, "category"),
    coverMediaId: fdStr(fd, "coverMediaId"),
    status: fdStr(fd, "status") || "draft",
    sort: fdStr(fd, "sort") || "0",
    blocks: json<unknown[]>(fdStr(fd, "blocks"), []),
    credits: json<unknown[]>(fdStr(fd, "credits"), []),
  });
  if (!r.ok) return r.state;
  const d = r.data;
  const related = fdList(fd, "related");
  return guarded(d.status === "published" ? "content.publish" : "content.write", async ({ db, user, audit }) => {
    const dupe = await db
      .select({ id: schema.projects.id })
      .from(schema.projects)
      .where(
        and(
          eq(schema.projects.site, "photos"),
          eq(schema.projects.slug, d.slug),
          d.id ? ne(schema.projects.id, d.id) : undefined,
        ),
      )
      .limit(1);
    if (dupe.length)
      return {
        ok: false as const,
        error: "Check the highlighted fields.",
        fieldErrors: { slug: "Another project already uses this URL" },
      };
    const values = {
      title: d.title,
      slug: d.slug,
      type: d.type,
      summary: blank(d.summary),
      date: blank(d.date),
      client: blank(d.client),
      role: blank(d.role),
      category: blank(d.category),
      coverMediaId: d.coverMediaId || null,
      blocks: d.blocks,
      credits: d.credits.map((c) => ({ name: c.name, role: c.role, url: c.url || undefined })),
      related,
      status: d.status,
      featured: fdBool(fd, "featured"),
      protectedPage: fdBool(fd, "protectedPage"),
      sort: d.sort,
      updatedAt: new Date(),
      updatedBy: user.email,
    };
    let id = d.id;
    if (id) {
      const [before] = await db.select().from(schema.projects).where(eq(schema.projects.id, id)).limit(1);
      if (!before) return { ok: false as const, error: "That project no longer exists." };
      await db.update(schema.projects).set(values).where(eq(schema.projects.id, id));
      if (before.slug !== d.slug && before.status === "published") {
        await db
          .insert(schema.redirects)
          .values({ site: "photos", fromPath: `/work/${before.slug}`, toPath: `/work/${d.slug}`, permanent: true })
          .onConflictDoUpdate({
            target: [schema.redirects.site, schema.redirects.fromPath],
            set: { toPath: `/work/${d.slug}` },
          });
        touch(["redirects"]);
      }
    } else {
      const [row] = await db
        .insert(schema.projects)
        .values({ site: "photos", ...values })
        .returning({ id: schema.projects.id });
      id = row.id;
    }
    const [now] = await db.select().from(schema.projects).where(eq(schema.projects.id, id)).limit(1);
    const [last] = await db
      .select({ v: schema.projectVersions.version })
      .from(schema.projectVersions)
      .where(eq(schema.projectVersions.projectId, id))
      .orderBy(desc(schema.projectVersions.version))
      .limit(1);
    await db
      .insert(schema.projectVersions)
      .values({ projectId: id, version: (last?.v ?? 0) + 1, snapshot: snap(now), createdBy: user.email });
    const old = await db
      .select({ id: schema.projectVersions.id })
      .from(schema.projectVersions)
      .where(eq(schema.projectVersions.projectId, id))
      .orderBy(desc(schema.projectVersions.version))
      .offset(50);
    for (const o of old) await db.delete(schema.projectVersions).where(eq(schema.projectVersions.id, o.id));
    await audit({
      action: d.id ? "project.update" : "project.create",
      entity: "project",
      entityId: id,
      site: "photos",
      summary: `${d.id ? "Updated" : "Created"} “${d.title}” (${d.status})`,
    });
    touch(["projects"], [], ["/", "/work", `/work/${d.slug}`, "/sitemap.xml"]);
    return {
      ok: true as const,
      message: d.status === "published" ? "Published" : "Draft saved",
      redirectTo: d.id ? undefined : `/admin/projects/${id}`,
      id,
    };
  });
}

export async function deleteProject(id: string): Promise<ActionState> {
  return guarded("content.write", async ({ db, user, audit }) => {
    const [p] = await db
      .update(schema.projects)
      .set({ deletedAt: new Date(), updatedBy: user.email })
      .where(eq(schema.projects.id, id))
      .returning({ title: schema.projects.title, slug: schema.projects.slug });
    await audit({
      action: "project.delete",
      entity: "project",
      entityId: id,
      site: "photos",
      summary: `Moved “${p?.title}” to the trash`,
    });
    touch(["projects"], [], ["/", "/work", ...(p?.slug ? [`/work/${p.slug}`] : [])]);
    return { ok: true as const, message: "Moved to trash", redirectTo: "/admin/projects" };
  });
}

export async function restoreProjectVersion(projectId: string, versionId: string): Promise<ActionState> {
  return guarded("content.write", async ({ db, user, audit }) => {
    const [v] = await db
      .select()
      .from(schema.projectVersions)
      .where(and(eq(schema.projectVersions.id, versionId), eq(schema.projectVersions.projectId, projectId)))
      .limit(1);
    if (!v) return { ok: false as const, error: "Version not found." };
    const s = v.snapshot as Record<string, never>;
    await db
      .update(schema.projects)
      .set({
        title: s.title,
        slug: s.slug,
        type: s.type,
        summary: s.summary ?? null,
        date: s.date ?? null,
        client: s.client ?? null,
        role: s.role ?? null,
        category: s.category ?? null,
        coverMediaId: s.coverMediaId ?? null,
        blocks: s.blocks ?? [],
        credits: s.credits ?? [],
        related: s.related ?? [],
        status: "draft",
        featured: Boolean(s.featured),
        sort: Number(s.sort ?? 0),
        updatedAt: new Date(),
        updatedBy: user.email,
      })
      .where(eq(schema.projects.id, projectId));
    await audit({
      action: "project.restore_version",
      entity: "project",
      entityId: projectId,
      site: "photos",
      summary: `Restored version ${v.version} as a draft`,
    });
    touch(["projects"], [], ["/work"]);
    return { ok: true as const, message: `Restored version ${v.version} as a draft` };
  });
}
