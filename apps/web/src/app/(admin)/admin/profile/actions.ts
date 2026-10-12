"use server";

import { schema } from "@jerryqiu/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import type { ActionState } from "@/components/admin/form-kit";
import { blank, fdBool, fdList, fdStr, optionalUrl, parseForm } from "@/lib/action-utils";
import { touch } from "@/lib/revalidate";
import { guarded } from "@/auth";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Required").max(80),
  headline: z.string().trim().max(200),
  location: z.string().trim().max(80),
  currently: z.string().trim().max(200),
  email: z.string().trim().email("Enter a valid email").max(120),
  bookingEmail: z.string().trim().email("Enter a valid email").max(120).or(z.literal("")),
  languages: z.array(z.string().max(40)).max(12),
  skills: z.array(z.string().max(40)).max(40),
});

/** Profile facts for the hub (headline, "currently", contact) and the skills tags. */
export async function saveProfile(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const r = parseForm(profileSchema, {
    name: fdStr(fd, "name"),
    headline: fdStr(fd, "headline"),
    location: fdStr(fd, "location"),
    currently: fdStr(fd, "currently"),
    email: fdStr(fd, "email"),
    bookingEmail: fdStr(fd, "bookingEmail"),
    languages: fdList(fd, "languages"),
    skills: fdList(fd, "skills"),
  });
  if (!r.ok) return r.state;
  return guarded("content.write", async ({ db, user, audit }) => {
    const value = r.data;
    await db
      .insert(schema.settings)
      .values({ site: "hub", key: "profile", value, updatedBy: user.email })
      .onConflictDoUpdate({
        target: [schema.settings.site, schema.settings.key],
        set: { value, updatedAt: new Date(), updatedBy: user.email },
      });
    await audit({
      action: "profile.save",
      entity: "settings",
      entityId: "hub/profile",
      site: "hub",
      summary: "Updated the profile",
    });
    touch(["profile", "settings"], ["/", "/about", "/connect"]);
    return { ok: true as const, message: "Profile saved" };
  });
}

const socialSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  label: z.string().trim().min(1, "Required").max(40),
  href: optionalUrl.refine((v) => v !== "", "Required"),
  icon: z.string().trim().max(30),
  sort: z.coerce.number().int().min(0).max(999),
});

export async function saveSocial(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const r = parseForm(socialSchema, {
    id: fdStr(fd, "id"),
    label: fdStr(fd, "label"),
    href: fdStr(fd, "href"),
    icon: fdStr(fd, "icon") || "web",
    sort: fdStr(fd, "sort") || "0",
  });
  if (!r.ok) return r.state;
  const flags = {
    showHeader: fdBool(fd, "showHeader"),
    showFooter: fdBool(fd, "showFooter"),
    visible: fdBool(fd, "visible"),
  };
  return guarded("content.write", async ({ db, user, audit }) => {
    const { id, ...rest } = r.data;
    if (id)
      await db
        .update(schema.socialLinks)
        .set({ ...rest, ...flags, updatedAt: new Date(), updatedBy: user.email })
        .where(eq(schema.socialLinks.id, id));
    else await db.insert(schema.socialLinks).values({ ...rest, ...flags, site: "all", updatedBy: user.email });
    await audit({
      action: id ? "social.update" : "social.create",
      entity: "social_link",
      entityId: id || undefined,
      summary: `${id ? "Updated" : "Added"} link “${rest.label}”`,
    });
    touch(["social"], ["/", "/connect", "/about"]);
    return { ok: true as const, message: id ? "Link saved" : "Link added" };
  });
}

export async function deleteSocial(id: string): Promise<ActionState> {
  return guarded("content.write", async ({ db, user, audit }) => {
    await db
      .update(schema.socialLinks)
      .set({ deletedAt: new Date(), updatedBy: user.email })
      .where(and(eq(schema.socialLinks.id, id)));
    await audit({ action: "social.delete", entity: "social_link", entityId: id, summary: "Moved a link to the trash" });
    touch(["social"], ["/", "/connect"]);
    return { ok: true as const, message: "Moved to trash" };
  });
}
