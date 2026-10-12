import { getSite } from "@jerryqiu/sites";
import type { MetadataRoute } from "next";
import { getWork, getWriting } from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [work, writing] = await Promise.all([getWork(), getWriting()]);
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
    ...work.map((p) => ({ url: `${base}/work/${p.slug}`, lastModified: p.date })),
    ...writing.map((p) => ({ url: `${base}/writing/${p.slug}`, lastModified: p.date })),
  ];
}
