import { getSite } from "@jerryqiu/sites";
import type { MetadataRoute } from "next";
import { categories, photosIn } from "@/content/portfolio";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSite("photos").url;
  return [
    ...["", "/portfolio", "/about", "/book", "/client"].map((p) => ({ url: `${base}${p}`, lastModified: new Date() })),
    ...categories
      .filter((c) => photosIn(c.slug).length)
      .map((c) => ({ url: `${base}/portfolio/${c.slug}`, lastModified: new Date() })),
  ];
}
