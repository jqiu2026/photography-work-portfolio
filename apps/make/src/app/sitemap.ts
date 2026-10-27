import { getMakeUrl } from "@jerryqiu/sites";
import type { MetadataRoute } from "next";
import { getProjects } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getMakeUrl();
  const projects = await getProjects();
  return [
    ...["", "/projects", "/now", "/tools", "/about"].map((p) => ({ url: `${base}${p}`, lastModified: new Date() })),
    ...projects.map((p) => ({ url: `${base}/projects/${p.slug}`, lastModified: new Date(p.updatedAt) })),
  ];
}
