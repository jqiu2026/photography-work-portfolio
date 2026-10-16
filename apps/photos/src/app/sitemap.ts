import { getSite } from "@jerryqiu/sites";
import type { MetadataRoute } from "next";
import { getPortfolio } from "@/lib/portfolio";
import { getWork } from "@/lib/work";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ categories, photosIn }, work] = await Promise.all([getPortfolio(), getWork()]);
  const base = getSite("photos").url;
  return [
    ...[
      "",
      "/portfolio",
      "/work",
      "/video",
      "/about",
      "/book",
      "/book/schedule",
      "/book/minis",
      "/packages",
      "/features",
      "/how-it-works",
      "/client-portal",
      "/galleries",
      "/prints",
      "/faq",
      "/contact",
      "/terms",
      "/accessibility",
      "/licensing",
      "/privacy",
    ].map((p) => ({
      url: `${base}${p}`,
      lastModified: new Date(),
    })),
    ...work.map((p) => ({ url: `${base}/work/${p.slug}`, lastModified: p.date })),
    ...categories
      .filter((c) => photosIn(c.slug).length)
      .map((c) => ({ url: `${base}/portfolio/${c.slug}`, lastModified: new Date() })),
  ];
}
