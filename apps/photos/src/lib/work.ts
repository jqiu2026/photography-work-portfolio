import type { ProjectBlockView } from "@jerryqiu/db/queries";
import { readMdxDir } from "@jerryqiu/render/mdx-files";
import type { GalleryImage, ImageAsset } from "@placeholder/ui/media";
import { getProjects } from "@/lib/content-db";
import { getProjectImage } from "@/lib/images";

/**
 * Project case studies, one shape whichever source they come from: the database (the CMS, when configured) or the MDX
 * files in the repository (fallback, and the seed). Pages only ever see this type.
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

const byDate = (a: WorkItem, b: WorkItem) => +new Date(b.date) - +new Date(a.date);

/** "/images/projects/stuy-sing-26/senior.png" -> optimized manifest id "stuy-sing-26-senior" */
function imageId(src: string) {
  return src
    .replace(/^\/images\/projects\//, "")
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function mdxWork(): WorkItem[] {
  return readMdxDir(["src", "content", "projects"])
    .map((p) => {
      const images = p.metadata.images.map((src, n) => ({
        ...getProjectImage(imageId(src)),
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

export async function getWork(): Promise<WorkItem[]> {
  const rows = await getProjects();
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
