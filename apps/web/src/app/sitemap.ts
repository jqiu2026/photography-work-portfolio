import { getSite } from "@jerryqiu/sites";
import type { MetadataRoute } from "next";
import { getWriting } from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const writing = await getWriting();
  const base = getSite("hub").url;
  const pages = ["", "/about", "/writing", "/connect", "/privacy", "/terms", "/licensing", "/accessibility"].map(
    (p) => ({ url: `${base}${p}`, lastModified: new Date() }),
  );
  return [...pages, ...writing.map((p) => ({ url: `${base}/writing/${p.slug}`, lastModified: p.date }))];
}
