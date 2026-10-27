import { getSite } from "@jerryqiu/sites";
import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSite("music").url;
  const pieces = await getCatalog("{}");
  return [
    ...[
      "",
      "/compositions",
      "/scores",
      "/listen",
      "/performances",
      "/commission",
      "/newsletter",
      "/about",
      "/licensing",
      "/privacy",
    ].map((p) => ({
      url: `${base}${p}`,
      lastModified: new Date(),
    })),
    ...pieces.map((c) => ({ url: `${base}/compositions/${c.slug}`, lastModified: c.updatedAt })),
  ];
}
