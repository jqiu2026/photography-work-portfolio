"use server";

import * as mk from "@jerryqiu/db/make";
import { StudioError } from "@jerryqiu/db/studio";
import { z } from "zod";
import { parseLinks } from "@/lib/links";
import { type StudioResult, studio } from "@/lib/studio-run";

const id = z.string().uuid();
const str = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === "string" ? v.trim() : "";
};
const opt = (f: FormData, k: string) => str(f, k) || null;
const uuid = (v: string, what: string) => {
  const p = id.safeParse(v);
  if (!p.success) throw new StudioError(`Unknown ${what}.`);
  return p.data;
};

export async function saveProjectAction(form: FormData): Promise<StudioResult> {
  return studio(async ({ db }) => {
    const pid = str(form, "id") ? uuid(str(form, "id"), "project") : undefined;
    const year = str(form, "year");
    const p = await mk.saveProject(
      db,
      {
        title: str(form, "title"),
        slug: str(form, "slug") || undefined,
        summary: opt(form, "summary"),
        body: opt(form, "body"),
        status: (str(form, "status") || "building") as "building",
        year: year ? Number(year) : null,
        role: opt(form, "role"),
        stack: str(form, "stack")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        links: parseLinks(str(form, "links")),
        lessons: opt(form, "lessons"),
        published: form.get("published") === "on",
      },
      pid,
    );
    return {
      message: pid ? "Saved." : "Project created.",
      audit: { action: "make.project.save", entity: "make_project", entityId: p.id, summary: `Saved ${p.title}` },
      extra: pid ? {} : { redirect: `/studio/projects/${p.id}` },
    };
  });
}

export async function deleteProjectAction(form: FormData): Promise<StudioResult> {
  return studio(async ({ db }) => {
    await mk.deleteProject(db, uuid(str(form, "id"), "project"));
    return {
      message: "Deleted.",
      audit: {
        action: "make.project.delete",
        entity: "make_project",
        entityId: str(form, "id"),
        summary: "Deleted a project",
      },
      extra: { redirect: "/studio/projects" },
    };
  });
}

export async function saveImageAction(form: FormData): Promise<StudioResult> {
  return studio(async ({ db }) => {
    await mk.saveImage(db, uuid(str(form, "id"), "image"), {
      alt: str(form, "alt"),
      caption: opt(form, "caption"),
      reviewed: form.get("reviewed") === "on",
    });
    return {
      message: "Saved.",
      audit: {
        action: "make.image.save",
        entity: "make_image",
        entityId: str(form, "id"),
        summary: form.get("reviewed") === "on" ? "Marked a screenshot checked" : "Saved a screenshot",
      },
    };
  });
}

export async function coverAction(form: FormData): Promise<StudioResult> {
  return studio(async ({ db }) => {
    await mk.setCover(db, uuid(str(form, "projectId"), "project"), uuid(str(form, "id"), "image"));
    return { message: "Cover set." };
  });
}

export async function removeImageAction(form: FormData): Promise<StudioResult> {
  return studio(async ({ db }) => {
    await mk.removeImage(db, uuid(str(form, "id"), "image"));
    return {
      message: "Removed.",
      audit: {
        action: "make.image.remove",
        entity: "make_image",
        entityId: str(form, "id"),
        summary: "Removed a screenshot",
      },
    };
  });
}

export async function addNowAction(form: FormData): Promise<StudioResult> {
  return studio(async ({ db }) => {
    await mk.addNow(db, str(form, "body"), opt(form, "projectId"));
    return { message: "Logged." };
  });
}

export async function removeNowAction(form: FormData): Promise<StudioResult> {
  return studio(async ({ db }) => {
    await mk.removeNow(db, uuid(str(form, "id"), "entry"));
    return { message: "Removed." };
  });
}
