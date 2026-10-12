import type { ImageAsset } from "@placeholder/ui/media";
import { getPosts as dbPosts } from "@/lib/content-db";
import { getImage } from "@/lib/images";
import { readMdxDir as mdxFiles } from "@jerryqiu/render/mdx-files";

/**
 * One shape for work and writing, whichever source it comes from: the database (the CMS, when configured) or the MDX
 * files in the repository (fallback, and the seed). Pages only ever see these types.
 */
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
