import { getSite } from "@jerryqiu/sites";
import { person } from "@/content/site";
import { getWriting } from "@/lib/content";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function GET() {
  const base = getSite("hub").url;
  const items = getWriting()
    .map(
      (p) =>
        `<item><title>${esc(p.metadata.title)}</title><link>${base}/writing/${p.slug}</link><guid>${base}/writing/${p.slug}</guid><pubDate>${new Date(p.metadata.publishedAt).toUTCString()}</pubDate><description><![CDATA[${p.metadata.summary}]]></description></item>`,
    )
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${esc(person.name)}: Writing</title><link>${base}/writing</link><description>Thoughts, stories and notes.</description><language>en</language><atom:link href="${base}/writing/rss.xml" rel="self" type="application/rss+xml"/>${items}</channel></rss>`;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
