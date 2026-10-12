"use server";

import { schema } from "@jerryqiu/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { ActionState } from "@/components/admin/form-kit";
import { blank, fdBool, fdStr, parseForm } from "@/lib/action-utils";
import { mediaUsage } from "@/lib/media-usage";
import { touch } from "@/lib/revalidate";
import { guarded } from "@/auth";

const schemaMedia = z.object({
  id: z.string().uuid(),
  alt: z.string().trim().max(300),
  caption: z.string().trim().max(500),
  license: z.enum(["all-rights-reserved", "cc-by", "cc-by-nc", "cc-by-sa", "cc0"]),
  reviewStatus: z.enum(["ok", "needs_review"]),
});

export async function saveMedia(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const r = parseForm(schemaMedia, {
    id: fdStr(fd, "id"),
    alt: fdStr(fd, "alt"),
    caption: fdStr(fd, "caption"),
    license: fdStr(fd, "license") || "all-rights-reserved",
    reviewStatus: fdStr(fd, "reviewStatus") || "ok",
  });
  if (!r.ok) return r.state;
  const d = r.data;
  const containsPeople = fdBool(fd, "containsPeople");
  const minors = fdBool(fd, "minors");
  const releaseOnFile = fdBool(fd, "releaseOnFile");
  return guarded("media.write", async ({ db, user, audit }) => {
    // People and minors without a release go to review rather than silently publishing.
    const reviewStatus = d.reviewStatus === "ok" && minors && !releaseOnFile ? "needs_review" : d.reviewStatus;
    await db
      .update(schema.media)
      .set({
        alt: blank(d.alt),
        caption: blank(d.caption),
        license: d.license,
        containsPeople: containsPeople || minors,
        minors,
        releaseOnFile,
        reviewStatus,
        updatedAt: new Date(),
        updatedBy: user.email,
      })
      .where(eq(schema.media.id, d.id));
    await audit({ action: "media.update", entity: "media", entityId: d.id, summary: "Updated image details" });
    touch(["media", "galleries", "projects", "posts"]);
    return {
      ok: true as const,
      message: reviewStatus !== d.reviewStatus ? "Saved. Minors without a release are marked “needs review”." : "Saved",
    };
  });
}

export async function deleteMedia(id: string): Promise<ActionState> {
  return guarded("content.write", async ({ db, user, audit }) => {
    const used = await mediaUsage(db, id);
    if (used.length)
      return {
        ok: false as const,
        error: `This image is used in ${used.length} place${used.length === 1 ? "" : "s"} (${used
          .slice(0, 3)
          .map((u) => u.title)
          .join(", ")}). Remove it there first.`,
      };
    await db.update(schema.media).set({ deletedAt: new Date(), updatedBy: user.email }).where(eq(schema.media.id, id));
    await audit({ action: "media.delete", entity: "media", entityId: id, summary: "Moved an image to the trash" });
    touch(["media"]);
    return { ok: true as const, message: "Moved to trash", redirectTo: "/admin/media" };
  });
}
