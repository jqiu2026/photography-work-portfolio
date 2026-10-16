import { getSite } from "@jerryqiu/sites";
import { mocksEnabled } from "@jerryqiu/mocks";
import type { MetadataRoute } from "next";

/** Mock-only routes (Phase 3 makes them real) are left out of production sitemaps. */
const MOCK_ONLY = new Set(["/compositions", "/scores", "/map"]);

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSite("music").url;
  return ["", "/compositions", "/scores", "/listen", "/performances", "/about"]
    .filter((p) => mocksEnabled() || !MOCK_ONLY.has(p))
    .map((p) => ({ url: `${base}${p}`, lastModified: new Date() }));
}
