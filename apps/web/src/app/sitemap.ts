import { getSite } from "@jerryqiu/sites";
import type { MetadataRoute } from "next";
import { getProjects, getWriting } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSite("hub").url;
  const pages = [
    "",
    "/about",
    "/work",
    "/writing",
    "/connect",
    "/privacy",
    "/terms",
    "/licensing",
    "/accessibility",
  ].map((p) => ({ url: `${base}${p}`, lastModified: new Date() }));
  return [
    ...pages,
    ...getProjects().map((p) => ({ url: `${base}/work/${p.slug}`, lastModified: p.metadata.publishedAt })),
    ...getWriting().map((p) => ({ url: `${base}/writing/${p.slug}`, lastModified: p.metadata.publishedAt })),
  ];
}
