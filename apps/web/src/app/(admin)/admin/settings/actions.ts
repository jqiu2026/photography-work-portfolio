"use server";

import { schema } from "@jerryqiu/db";
import { z } from "zod";
import { guarded } from "@/auth";
import type { ActionState } from "@/components/admin/form-kit";
import { fdBool, fdStr, parseForm } from "@/lib/action-utils";
import { touch } from "@/lib/revalidate";
import { type SettingKey, parseNavLines, settingSchemas } from "@/lib/settings";

const siteField = z.enum(["hub", "photos", "music", "flying"]);
const keyField = z.enum(Object.keys(settingSchemas) as [SettingKey, ...SettingKey[]]);

/** One action for every settings group: the group's own zod schema validates the payload. */
export async function saveSettings(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const head = parseForm(z.object({ site: siteField, key: keyField }), {
    site: fdStr(fd, "site"),
    key: fdStr(fd, "key"),
  });
  if (!head.ok) return head.state;
  const { site, key } = head.data;
  const raw: Record<string, unknown> = {};
  switch (key) {
    case "general":
      Object.assign(raw, {
        siteName: fdStr(fd, "siteName"),
        tagline: fdStr(fd, "tagline"),
        contactEmail: fdStr(fd, "contactEmail"),
        maintenance: fdBool(fd, "maintenance"),
        maintenanceMessage: fdStr(fd, "maintenanceMessage"),
      });
      break;
    case "home":
      Object.assign(raw, {
        heroHeadline: fdStr(fd, "heroHeadline"),
        heroIntro: fdStr(fd, "heroIntro"),
        aboutIntro: fdStr(fd, "aboutIntro"),
      });
      break;
    case "seo":
      Object.assign(raw, {
        title: fdStr(fd, "title"),
        description: fdStr(fd, "description"),
        ogImageMediaId: fdStr(fd, "ogImageMediaId"),
      });
      break;
    case "theme":
      raw.accent = fdStr(fd, "accent") || "default";
      break;
    case "protection":
      Object.assign(raw, {
        level: fdStr(fd, "level") || "light",
        watermark: fdBool(fd, "watermark"),
        watermarkText: fdStr(fd, "watermarkText"),
        watermarkPosition: fdStr(fd, "watermarkPosition") || "bottom-right",
        watermarkOpacity: fdStr(fd, "watermarkOpacity") || "0.3",
      });
      break;
    case "nav":
      raw.items = parseNavLines(fdStr(fd, "items"));
      break;
  }
  const r = parseForm(settingSchemas[key] as z.ZodType, raw);
  if (!r.ok) {
    // The nav textarea is one field; show nested problems under it.
    if (key === "nav")
      return { ok: false, error: "Check the navigation.", fieldErrors: { items: "Each line must be “Label | /path”" } };
    return r.state;
  }
  return guarded("settings.write", async ({ db, user, audit }) => {
    await db
      .insert(schema.settings)
      .values({ site, key, value: r.data, updatedBy: user.email })
      .onConflictDoUpdate({
        target: [schema.settings.site, schema.settings.key],
        set: { value: r.data, updatedAt: new Date(), updatedBy: user.email },
      });
    await audit({
      action: `settings.${key}`,
      entity: "settings",
      entityId: `${site}/${key}`,
      site,
      summary: `Updated ${site} ${key} settings`,
    });
    touch(["settings"], ["/", "/music", "/flying"]);
    return { ok: true as const, message: "Saved" };
  });
}

const pageSchema = z.object({
  slug: z.enum(["privacy", "terms", "licensing", "accessibility"]),
  title: z.string().trim().min(1, "Required").max(120),
  body: z.string().max(60_000),
  status: z.enum(["draft", "published"]),
});

/** Legal pages: editable Markdown with a visible draft status. Publishing needs the publish permission. */
export async function saveLegalPage(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const r = parseForm(pageSchema, {
    slug: fdStr(fd, "slug"),
    title: fdStr(fd, "title"),
    body: fdStr(fd, "body"),
    status: fdStr(fd, "status") || "draft",
  });
  if (!r.ok) return r.state;
  const d = r.data;
  return guarded(d.status === "published" ? "content.publish" : "content.write", async ({ db, user, audit }) => {
    await db
      .insert(schema.pages)
      .values({
        site: "hub",
        slug: d.slug,
        title: d.title,
        body: d.body,
        kind: "legal",
        status: d.status,
        updatedBy: user.email,
      })
      .onConflictDoUpdate({
        target: [schema.pages.site, schema.pages.slug],
        set: {
          title: d.title,
          body: d.body,
          status: d.status,
          updatedAt: new Date(),
          updatedBy: user.email,
          deletedAt: null,
        },
      });
    await audit({
      action: "page.save",
      entity: "page",
      entityId: d.slug,
      site: "hub",
      summary: `Saved legal page “${d.title}” (${d.status})`,
    });
    touch(["pages"], [`/${d.slug}`]);
    return { ok: true as const, message: d.status === "published" ? "Saved and published" : "Saved as draft" };
  });
}
