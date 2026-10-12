import { getSite } from "@jerryqiu/sites";
import type { MetadataRoute } from "next";

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
  "Meta-ExternalAgent",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }, ...AI.map((userAgent) => ({ userAgent, disallow: "/" }))],
    sitemap: `${getSite("photos").url}/sitemap.xml`,
  };
}
