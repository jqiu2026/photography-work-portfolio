import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "./client";
import { StudioError } from "./errors";
import { slugify } from "./gallery-link";
import * as s from "./schema";

/**
 * Make: a curated showcase (3 to 5 projects), screenshots that only show once someone has checked them, and a "now" log.
 * The workshop words (bench, shelf, scrap bin, tool wall) are a naming layer over the plain `status` and `stack` fields.
 */
export const SHOWCASE_MAX = 5;
export const SHOWCASE_MIN = 3;

type Project = typeof s.makeProjects.$inferSelect;
const live = isNull(s.makeProjects.deletedAt);

export type Place = "bench" | "shelf" | "scrap";
export const placeOf = (status: Project["status"]): Place =>
  status === "building" ? "bench" : status === "shipped" ? "shelf" : "scrap";

/** The plain explanation shown with each workshop word, so the vocabulary never hides what a place means. */
export const PLACES: Record<Place, { word: string; plain: string }> = {
  bench: { word: "Bench", plain: "What I'm building now" },
  shelf: { word: "Shelf", plain: "Finished and working" },
  scrap: { word: "Scrap bin", plain: "Stopped, with what I learned" },
};

export const linkSchema = z.object({
  label: z.string().trim().min(1).max(60),
  url: z
    .string()
    .trim()
    .max(300)
    .refine((u) => /^https:\/\/[^\s]+$/.test(u), "Links must start with https://"),
  kind: z.enum(["demo", "source", "writeup", "other"]).default("other"),
});

export const projectSchema = z.object({
  title: z.string().trim().min(1).max(120),
  slug: z.string().trim().max(80).optional(),
  summary: z.string().trim().max(300).nullable().optional(),
  body: z.string().max(20000).nullable().optional(),
  status: z.enum(["building", "shipped", "archived"]).default("building"),
  year: z.number().int().min(1990).max(2200).nullable().optional(),
  role: z.string().trim().max(120).nullable().optional(),
  stack: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
  links: z.array(linkSchema).max(8).default([]),
  lessons: z.string().trim().max(2000).nullable().optional(),
  published: z.boolean().default(false),
});
export type ProjectInput = z.input<typeof projectSchema>;

async function freeSlug(db: Database, wanted: string, except?: string) {
  const base = slugify(wanted) || "project";
  for (let i = 0; i < 200; i++) {
    const slug = i === 0 ? base : `${base}-${i + 1}`;
    const [hit] = await db.select({ id: s.makeProjects.id }).from(s.makeProjects).where(eq(s.makeProjects.slug, slug));
    if (!hit || hit.id === except) return slug;
  }
  throw new StudioError("Could not find a free address for this project.");
}

export async function countPublished(db: Database, except?: string) {
  const rows = await db
    .select({ id: s.makeProjects.id })
    .from(s.makeProjects)
    .where(and(live, eq(s.makeProjects.published, true)));
  return rows.filter((r) => r.id !== except).length;
}

/** Saves a project. A sixth published project is refused: the showcase is curated on purpose. */
export async function saveProject(db: Database, input: ProjectInput, id?: string): Promise<Project> {
  const v = projectSchema.parse(input);
  if (v.published && (await countPublished(db, id)) >= SHOWCASE_MAX)
    throw new StudioError(`The showcase holds at most ${SHOWCASE_MAX} projects. Unpublish one first.`);
  const row = {
    slug: await freeSlug(db, v.slug || v.title, id),
    title: v.title,
    summary: v.summary ?? null,
    body: v.body ?? null,
    status: v.status,
    year: v.year ?? null,
    role: v.role ?? null,
    stack: [...new Set(v.stack.map((x) => x.trim()))],
    links: v.links,
    lessons: v.lessons ?? null,
    published: v.published,
    updatedAt: new Date(),
  };
  if (id) {
    const [p] = await db.update(s.makeProjects).set(row).where(eq(s.makeProjects.id, id)).returning();
    if (!p) throw new StudioError("That project no longer exists.");
    return p;
  }
  const [p] = await db.insert(s.makeProjects).values(row).returning();
  return p;
}

export async function deleteProject(db: Database, id: string) {
  await db.update(s.makeProjects).set({ deletedAt: new Date(), published: false }).where(eq(s.makeProjects.id, id));
}

/** Images that may be shown: reviewed, and not removed. */
const shown = and(eq(s.makeImages.reviewed, true), isNull(s.makeImages.deletedAt));

export async function listPublic(db: Database) {
  const projects = await db
    .select()
    .from(s.makeProjects)
    .where(and(live, eq(s.makeProjects.published, true)))
    .orderBy(asc(s.makeProjects.sort), desc(s.makeProjects.year), asc(s.makeProjects.title));
  if (!projects.length) return [];
  const imgs = await db
    .select()
    .from(s.makeImages)
    .where(
      and(
        inArray(
          s.makeImages.projectId,
          projects.map((p) => p.id),
        ),
        shown,
      ),
    )
    .orderBy(desc(s.makeImages.cover), asc(s.makeImages.sort));
  return projects.map((p) => ({
    ...p,
    place: placeOf(p.status),
    cover: imgs.find((i) => i.projectId === p.id) ?? null,
  }));
}

export async function getPublicProject(db: Database, slug: string) {
  const [project] = await db
    .select()
    .from(s.makeProjects)
    .where(and(eq(s.makeProjects.slug, slug), live, eq(s.makeProjects.published, true)));
  if (!project) return null;
  const [images, now] = await Promise.all([
    db
      .select()
      .from(s.makeImages)
      .where(and(eq(s.makeImages.projectId, project.id), shown))
      .orderBy(desc(s.makeImages.cover), asc(s.makeImages.sort)),
    db
      .select()
      .from(s.makeNow)
      .where(and(eq(s.makeNow.projectId, project.id), eq(s.makeNow.visible, true), isNull(s.makeNow.deletedAt)))
      .orderBy(desc(s.makeNow.createdAt))
      .limit(5),
  ]);
  return { project, place: placeOf(project.status), images, now };
}

/** The tool wall: every tool used in a published project, with how many projects use it. */
export function toolWall(projects: { stack: string[] }[]) {
  const n = new Map<string, number>();
  for (const p of projects) for (const t of p.stack) n.set(t, (n.get(t) ?? 0) + 1);
  return [...n.entries()]
    .map(([tool, count]) => ({ tool, count }))
    .sort((a, b) => b.count - a.count || a.tool.localeCompare(b.tool));
}

/** An image for the public route: only a reviewed image of a published project. */
export async function publicImage(db: Database, id: string) {
  const [row] = await db
    .select({ image: s.makeImages, project: s.makeProjects })
    .from(s.makeImages)
    .innerJoin(s.makeProjects, eq(s.makeProjects.id, s.makeImages.projectId))
    .where(and(eq(s.makeImages.id, id), shown, live, eq(s.makeProjects.published, true)));
  return row?.image ?? null;
}

/* ---------- images (studio) ---------- */
export async function addImage(
  db: Database,
  projectId: string,
  f: { storageKey: string; mime: string; width: number | null; height: number | null; alt: string },
) {
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(s.makeImages)
    .where(and(eq(s.makeImages.projectId, projectId), isNull(s.makeImages.deletedAt)));
  const [img] = await db
    .insert(s.makeImages)
    .values({ projectId, ...f, sort: n, cover: n === 0 })
    .returning();
  return img;
}

export const imageSchema = z.object({
  alt: z.string().trim().max(300),
  caption: z.string().trim().max(300).nullable().optional(),
  reviewed: z.boolean(),
});

/** A screenshot may only be marked reviewed with a description for people who cannot see it. */
export async function saveImage(db: Database, id: string, input: z.input<typeof imageSchema>) {
  const v = imageSchema.parse(input);
  if (v.reviewed && v.alt.length < 5)
    throw new StudioError("Describe the screenshot (at least a few words) before you mark it checked.");
  await db
    .update(s.makeImages)
    .set({ alt: v.alt, caption: v.caption ?? null, reviewed: v.reviewed })
    .where(eq(s.makeImages.id, id));
}

export async function setCover(db: Database, projectId: string, imageId: string) {
  await db.update(s.makeImages).set({ cover: false }).where(eq(s.makeImages.projectId, projectId));
  await db
    .update(s.makeImages)
    .set({ cover: true })
    .where(and(eq(s.makeImages.id, imageId), eq(s.makeImages.projectId, projectId)));
}

export async function removeImage(db: Database, id: string) {
  await db.update(s.makeImages).set({ deletedAt: new Date(), reviewed: false }).where(eq(s.makeImages.id, id));
}

/* ---------- the now log ---------- */
export async function addNow(db: Database, body: string, projectId?: string | null) {
  const text = z.string().trim().min(3).max(600).parse(body);
  const [row] = await db
    .insert(s.makeNow)
    .values({ body: text, projectId: projectId ?? null })
    .returning();
  return row;
}
export async function removeNow(db: Database, id: string) {
  await db.update(s.makeNow).set({ deletedAt: new Date(), visible: false }).where(eq(s.makeNow.id, id));
}
export const listNow = (db: Database, limit = 50) =>
  db
    .select()
    .from(s.makeNow)
    .where(and(eq(s.makeNow.visible, true), isNull(s.makeNow.deletedAt)))
    .orderBy(desc(s.makeNow.createdAt))
    .limit(limit);

/* ---------- studio ---------- */
export async function listAdmin(db: Database) {
  const projects = await db
    .select()
    .from(s.makeProjects)
    .where(live)
    .orderBy(asc(s.makeProjects.sort), desc(s.makeProjects.createdAt));
  const imgs = projects.length
    ? await db
        .select()
        .from(s.makeImages)
        .where(
          and(
            inArray(
              s.makeImages.projectId,
              projects.map((p) => p.id),
            ),
            isNull(s.makeImages.deletedAt),
          ),
        )
    : [];
  return projects.map((p) => {
    const mine = imgs.filter((i) => i.projectId === p.id);
    return { ...p, images: mine.length, unchecked: mine.filter((i) => !i.reviewed).length };
  });
}

export async function getAdmin(db: Database, id: string) {
  const [project] = await db
    .select()
    .from(s.makeProjects)
    .where(and(eq(s.makeProjects.id, id), live));
  if (!project) return null;
  const [images, now] = await Promise.all([
    db
      .select()
      .from(s.makeImages)
      .where(and(eq(s.makeImages.projectId, id), isNull(s.makeImages.deletedAt)))
      .orderBy(desc(s.makeImages.cover), asc(s.makeImages.sort)),
    db
      .select()
      .from(s.makeNow)
      .where(and(eq(s.makeNow.projectId, id), isNull(s.makeNow.deletedAt)))
      .orderBy(desc(s.makeNow.createdAt)),
  ]);
  return { project, images, now };
}

export async function getImageRow(db: Database, id: string) {
  const [i] = await db.select().from(s.makeImages).where(eq(s.makeImages.id, id));
  return i ?? null;
}
