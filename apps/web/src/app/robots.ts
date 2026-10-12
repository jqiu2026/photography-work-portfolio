import { getSite } from "@jerryqiu/sites";
import type { MetadataRoute } from "next";

// AI crawler opt-out is a request, not enforcement (see /licensing).
const AI = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "CCBot",
  "ClaudeBot",
  "anthropic-ai",
  "Claude-Web",
  "Google-Extended",
  "PerplexityBot",
  "Bytespider",
  "Applebot-Extended",
  "cohere-ai",
  "Omgilibot",
  "Diffbot",
  "ImagesiftBot",
  "FacebookBot",
  "Meta-ExternalAgent",
];

export default function robots(): MetadataRoute.Robots {
  const base = getSite("hub").url;
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/admin", "/sign-in", "/_progress", "/_design"] },
      ...AI.map((userAgent) => ({ userAgent, disallow: "/" })),
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
