"use server";

import { schema } from "@jerryqiu/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { ActionState } from "@/components/admin/form-kit";
import { blank, fdBool, fdList, fdStr, parseForm } from "@/lib/action-utils";
import { touch } from "@/lib/revalidate";
import { guarded } from "@/auth";

/** Only ids a provider could actually produce are accepted, so a typo (or an attack) never becomes an iframe URL. */
const embedPatterns = {
  youtube: /^[\w-]{6,20}$/,
  spotify: /^(track|album|playlist|episode|show|artist)\/[A-Za-z0-9]{10,30}$/,
  soundcloud: /^https:\/\/soundcloud\.com\/[\w.-]+(\/[\w.-]+){1,2}$/,
  bandcamp: /^https:\/\/bandcamp\.com\/EmbeddedPlayer\/[\w=/.-]+$/,
} as const;

const musicSchema = z
  .object({
    id: z.string().uuid().or(z.literal("")),
    kind: z.enum(["recording", "performance"]),
    title: z.string().trim().min(1, "Required").max(160),
    date: z
      .string()
      .trim()
      .regex(/^(\d{4}-\d{2}-\d{2})?$/, "Use YYYY-MM-DD"),
    venue: z.string().trim().max(160),
    ensemble: z.string().trim().max(160),
    note: z.string().trim().max(1500),
    provider: z.enum(["", "youtube", "spotify", "soundcloud", "bandcamp"]),
    embedId: z.string().trim().max(300),
    rights: z.enum(["original", "cover", "licensed", "third-party-embed"]),
    coverMediaId: z.string().uuid().or(z.literal("")),
    sort: z.coerce.number().int().min(0).max(9999),
  })
  .superRefine((v, ctx) => {
    if (v.provider && !embedPatterns[v.provider].test(v.embedId))
      ctx.addIssue({
        code: "custom",
        path: ["embedId"],
        message:
          v.provider === "youtube"
            ? "A YouTube video id (e.g. aqz-KE-bpKQ)"
            : v.provider === "spotify"
              ? "Like track/4uLU6hMCjMI75M1A2tKUQC"
              : v.provider === "soundcloud"
                ? "A soundcloud.com track URL"
                : "A Bandcamp EmbeddedPlayer URL",
      });
    if (!v.provider && v.embedId)
      ctx.addIssue({ code: "custom", path: ["provider"], message: "Choose the service for this link" });
  });

export async function saveMusic(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const r = parseForm(musicSchema, {
    id: fdStr(fd, "id"),
    kind: fdStr(fd, "kind") || "recording",
    title: fdStr(fd, "title"),
    date: fdStr(fd, "date"),
    venue: fdStr(fd, "venue"),
    ensemble: fdStr(fd, "ensemble"),
    note: fdStr(fd, "note"),
    provider: fdStr(fd, "provider"),
    embedId: fdStr(fd, "embedId"),
    rights: fdStr(fd, "rights") || "original",
    coverMediaId: fdStr(fd, "coverMediaId"),
    sort: fdStr(fd, "sort") || "0",
  });
  if (!r.ok) return r.state;
  const d = r.data;
  const values = {
    kind: d.kind,
    title: d.title,
    date: blank(d.date),
    venue: blank(d.venue),
    ensemble: blank(d.ensemble),
    note: blank(d.note),
    provider: d.provider || null,
    embedId: blank(d.embedId),
    rights: d.rights,
    coverMediaId: d.coverMediaId || null,
    needsReview: fdBool(fd, "needsReview"),
    featured: fdBool(fd, "featured"),
    visible: fdBool(fd, "visible"),
    sort: d.sort,
  };
  return guarded("content.write", async ({ db, user, audit }) => {
    let id = d.id;
    if (id)
      await db
        .update(schema.musicItems)
        .set({ ...values, updatedAt: new Date(), updatedBy: user.email })
        .where(eq(schema.musicItems.id, id));
    else {
      const [row] = await db
        .insert(schema.musicItems)
        .values({ ...values, updatedBy: user.email })
        .returning({ id: schema.musicItems.id });
      id = row.id;
    }
    await audit({
      action: d.id ? "music.update" : "music.create",
      entity: "music_item",
      entityId: id,
      site: "music",
      summary: `${d.id ? "Updated" : "Added"} ${d.kind} “${d.title}”`,
    });
    touch(["music"], ["/music", "/music/listen", "/music/performances"]);
    return { ok: true as const, message: "Saved", redirectTo: "/admin/music", id };
  });
}

export async function deleteMusic(id: string): Promise<ActionState> {
  return guarded("content.write", async ({ db, user, audit }) => {
    await db
      .update(schema.musicItems)
      .set({ deletedAt: new Date(), updatedBy: user.email })
      .where(eq(schema.musicItems.id, id));
    await audit({
      action: "music.delete",
      entity: "music_item",
      entityId: id,
      site: "music",
      summary: "Moved a music item to the trash",
    });
    touch(["music"], ["/music"]);
    return { ok: true as const, message: "Moved to trash", redirectTo: "/admin/music" };
  });
}

const backgroundSchema = z.object({
  story: z.string().trim().max(3000),
  instruments: z.array(z.string().max(60)).max(30),
  repertoire: z.array(z.string().max(120)).max(100),
});

export async function saveMusicBackground(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const r = parseForm(backgroundSchema, {
    story: fdStr(fd, "story"),
    instruments: fdList(fd, "instruments"),
    repertoire: fdList(fd, "repertoire"),
  });
  if (!r.ok) return r.state;
  return guarded("content.write", async ({ db, user, audit }) => {
    await db
      .insert(schema.settings)
      .values({ site: "music", key: "background", value: r.data, updatedBy: user.email })
      .onConflictDoUpdate({
        target: [schema.settings.site, schema.settings.key],
        set: { value: r.data, updatedAt: new Date(), updatedBy: user.email },
      });
    await audit({
      action: "music.background",
      entity: "settings",
      entityId: "music/background",
      site: "music",
      summary: "Updated the music background",
    });
    touch(["music", "settings"], ["/music", "/music/about"]);
    return { ok: true as const, message: "Saved" };
  });
}
