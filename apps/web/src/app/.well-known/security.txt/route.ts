import { getSite } from "@jerryqiu/sites";
import { person } from "@/content/site";

export function GET() {
  const base = getSite("hub").url;
  const expires = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString();
  return new Response(
    `Contact: mailto:${person.email}\nExpires: ${expires}\nPreferred-Languages: en\nCanonical: ${base}/.well-known/security.txt\nPolicy: ${base}/accessibility\n`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
}
