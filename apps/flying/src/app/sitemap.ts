import { getSite } from "@jerryqiu/sites";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSite("flying").url;
  return [
    "",
    "/log",
    "/map",
    "/aircraft",
    "/about",
    "/tools",
    "/tools/crosswind",
    "/tools/density-altitude",
    "/tools/weather",
    "/tools/trip",
    "/tools/weight-balance",
  ].map((p) => ({
    url: `${base}${p}`,
    lastModified: new Date(),
  }));
}
