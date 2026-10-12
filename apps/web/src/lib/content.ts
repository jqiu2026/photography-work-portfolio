import type { ProjectBlockView } from "@jerryqiu/db/queries";
import type { GalleryImage, ImageAsset } from "@placeholder/ui/media";
import { getPosts as dbPosts, getProjects as dbProjects } from "@/lib/content-db";
import { getImage } from "@/lib/images";
import { getPosts as mdxFiles } from "@/utils/utils";

/**
 * One shape for work and writing, whichever source it comes from: the database (the CMS, when configured) or the MDX
 * files in the repository (fallback, and the seed). Pages only ever see these types.
 */
export type WorkItem = {
  slug: string;
  title: string;
  summary: string;
  date: string;
  credits: { name: string; role: string }[];
  protectedPage: boolean;
  cover: ImageAsset | null;
  images: GalleryImage[];
  body: { kind: "mdx"; source: string } | { kind: "blocks"; blocks: ProjectBlockView[] };
};

export type WritingItem = {
  slug: string;
  title: string;
  subtitle?: string;
  summary?: string;
  date: string;
  cover: ImageAsset | null;
  body: { kind: "mdx" | "md"; source: string };
};

const byDate = <T extends { date: string }>(a: T, b: T) => +new Date(b.date) - +new Date(a.date);

/** "/images/projects/stuy-sing-26/senior.png" -> optimized manifest id "stuy-sing-26-senior" */
function imageId(src: string) {
  return src
    .replace(/^\/images\/(projects|blogs)\//, "")
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function mdxWork(): WorkItem[] {
  return mdxFiles(["src", "content", "projects"])
    .map((p) => {
      const images = p.metadata.images.map((src, n) => ({
        ...getImage("projects", imageId(src)),
        alt: `${p.metadata.title}, photograph ${n + 1}`,
      }));
      return {
        slug: p.slug,
        title: p.metadata.title,
        summary: p.metadata.summary,
        date: p.metadata.publishedAt,
        credits: (p.metadata.team ?? []).map((t) => ({ name: t.name, role: t.role })),
        protectedPage: Boolean(p.metadata.protected),
        cover: images[0] ?? null,
        images,
        body: { kind: "mdx" as const, source: p.content },
      };
    })
    .sort(byDate);
}

function mdxWriting(): WritingItem[] {
  return mdxFiles(["src", "content", "posts"])
    .map((p) => ({
      slug: p.slug,
      title: p.metadata.title,
      subtitle: p.metadata.subtitle,
      summary: p.metadata.summary,
      date: p.metadata.publishedAt,
      cover: p.metadata.image ? getImage("blogs", imageId(p.metadata.image)) : null,
      body: { kind: "mdx" as const, source: p.content },
    }))
    .sort(byDate);
}

export async function getWork(): Promise<WorkItem[]> {
  const rows = await dbProjects();
  if (!rows) return mdxWork();
  return rows
    .map((p) => {
      const images = p.blocks.flatMap((b) => (b.type === "gallery" ? b.assets : []));
      return {
        slug: p.slug,
        title: p.title,
        summary: p.summary ?? "",
        date: p.date ?? new Date(0).toISOString(),
        credits: p.credits.map((c) => ({ name: c.name, role: c.role })),
        protectedPage: p.protectedPage,
        cover: p.cover,
        images: images.map((a) => ({ ...a, alt: a.alt ?? p.title })),
        body: { kind: "blocks" as const, blocks: p.blocks },
      };
    })
    .sort(byDate);
}

export async function getWriting(): Promise<WritingItem[]> {
  const rows = await dbPosts();
  if (!rows) return mdxWriting();
  return rows
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      subtitle: p.subtitle ?? undefined,
      summary: p.summary ?? undefined,
      date: p.date,
      cover: p.cover,
      body: { kind: "md" as const, source: p.body },
    }))
    .sort(byDate);
}
