import { createHash } from "node:crypto";

/** Hash of the client IP (+ secret) for rate limiting and abuse review without storing raw IPs. */
export function clientIpHash(
  headers: { get(name: string): string | null },
  secret = process.env.AUTH_SECRET ?? "dev",
): string {
  const ip = (headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
  return createHash("sha256").update(`${secret}:${ip}`).digest("base64url").slice(0, 22);
}

/**
 * User agents of crawlers that collect images for AI training or bulk scraping. They are refused on the image route
 * (robots.txt asks the polite ones to stay away; this stops the ones that identify themselves but ignore it).
 */
const BLOCKED_BOTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "CCBot",
  "anthropic-ai",
  "ClaudeBot",
  "Claude-Web",
  "Google-Extended",
  "Bytespider",
  "PerplexityBot",
  "Amazonbot",
  "Applebot-Extended",
  "FacebookBot",
  "meta-externalagent",
  "Diffbot",
  "ImagesiftBot",
  "Omgilibot",
  "cohere-ai",
  "img2dataset",
  "python-requests",
  "scrapy",
  "curl/",
  "wget/",
  "Go-http-client",
];

export function isBlockedBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true; // real browsers always send one
  const ua = userAgent.toLowerCase();
  return BLOCKED_BOTS.some((b) => ua.includes(b.toLowerCase()));
}
